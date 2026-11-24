import { LitElement, css, html, nothing } from "lit";
import { icon } from "./icon";
import {
  BACKUP_PARTS,
  errorMessage,
  exportBackup,
  importBackup,
  previewBackup,
  type BackupPart,
  type BackupPreview,
} from "./api";
import { diffSettings } from "./diff";
import { sharedStyles } from "./styles";
import type { Hass, Settings, Snapshot } from "./types";
import { t } from "./i18n";

const MAX_FILE_BYTES = 8 * 1024 * 1024; // a backup is a few hundred kilobytes at most
const EXTENSION = ".adhd";

const PART_TEXT: Record<BackupPart, { title: string; text: string }> = {
  settings: { title: "Settings", text: "Devices, timing, nudge ladders, wall boards, your pet's name and kind, AI help." },
  chores: { title: "Chores", text: "Every chore with its steps, questions and schedule." },
  home: { title: "Rooms and notes", text: "The rooms of My home and their notes." },
  pet: { title: "Pet and history", text: "Your pet's level and XP, and what was done." },
};

/** Today as YYYY-MM-DD in this browser's time zone (for the name of the file). */
function today(): string {
  const d = new Date();
  const p = (n: number): string => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * The windows of the Backup card: "Export" saves the setup to a file (.adhd, plain JSON inside), "Import"
 * reads one back. Import first shows what is in the file and what it would change, and only replaces
 * the parts that are ticked, after the button is pressed. The checks happen in the integration.
 */
export class BoopliBackup extends LitElement {
  static properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    mode: { type: String },
    _parts: { state: true },
    _file: { state: true },
    _preview: { state: true },
    _busy: { state: true },
    _error: { state: true },
    _done: { state: true },
  };

  declare hass?: Hass;
  declare snapshot?: Snapshot;
  declare mode: "export" | "import";
  declare _parts: BackupPart[]; // the parts that are ticked
  declare _file: { name: string; data: Record<string, unknown> } | null; // the file that was chosen (import)
  declare _preview: BackupPreview | null;
  declare _busy: boolean;
  declare _error: string;
  declare _done: string[]; // what happened, as lines (the last screen)

  constructor() {
    super();
    this.mode = "export";
    this._parts = [...BACKUP_PARTS]; // a full backup by default
    this._file = null;
    this._preview = null;
    this._busy = false;
    this._error = "";
    this._done = [];
  }

  protected firstUpdated(): void {
    // a native modal dialog keeps the keyboard inside, makes the page behind inert, closes on Escape and
    // gives the focus back to the button that opened it
    (this.renderRoot.querySelector("dialog") as HTMLDialogElement | null)?.showModal();
  }

  private _close = (): void => {
    if (this._busy) return;
    (this.renderRoot.querySelector("dialog") as HTMLDialogElement | null)?.close(); // its "close" event tells the page
  };

  private _closed = (): void => {
    this.dispatchEvent(new CustomEvent("backup-close", { bubbles: true, composed: true }));
  };

  private _toggle(part: BackupPart, on: boolean): void {
    this._parts = BACKUP_PARTS.filter((p) => (p === part ? on : this._parts.includes(p)));
    this._error = "";
    if (this.mode === "import" && this._file) void this._look();
  }

  // --- export ------------------------------------------------------------------------

  /** Ask for the backup and hand it to the browser as a download. Returns the name of the file. */
  private async _download(parts: BackupPart[]): Promise<string | null> {
    if (!this.hass) return null;
    const data = await exportBackup(this.hass, parts);
    const name = `boopli-backup-${today()}${EXTENSION}`;
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/octet-stream" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return name;
  }

  private async _export(): Promise<void> {
    if (this._busy || !this._parts.length) return;
    this._busy = true;
    this._error = "";
    try {
      const name = await this._download(this._parts);
      this._done = [`Saved ${name}.`, "Keep it somewhere private: it holds the names of your devices and your notes."];
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  /** Import: save the current setup first, as a safety copy. */
  private async _saveCopy(): Promise<void> {
    if (this._busy) return;
    this._busy = true;
    this._error = "";
    try {
      const name = await this._download([...BACKUP_PARTS]);
      this._error = "";
      this._copyName = name ?? "";
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
      this.requestUpdate();
    }
  }
  private _copyName = "";

  // --- import ------------------------------------------------------------------------

  private async _choose(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.hass) return;
    this._error = "";
    this._file = null;
    this._preview = null;
    this._copyName = "";
    if (file.size > MAX_FILE_BYTES) {
      this._error = "This file is too big to be a Boopli backup.";
      return;
    }
    let data: unknown;
    try {
      data = JSON.parse(await file.text());
    } catch {
      this._error = "This is not a Boopli backup file.";
      return;
    }
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      this._error = "This is not a Boopli backup file.";
      return;
    }
    this._file = { name: file.name, data: data as Record<string, unknown> };
    this._parts = [...BACKUP_PARTS]; // a full import by default, narrowed to what the file has below
    await this._look(true);
  }

  /** Ask the integration what is in the file and what importing the ticked parts would do. */
  private async _look(first = false): Promise<void> {
    if (!this.hass || !this._file) return;
    this._busy = true;
    try {
      const parts = first ? [] : this._parts;
      const preview = await previewBackup(this.hass, this._file.data, parts);
      this._preview = preview;
      if (first) this._parts = [...preview.parts];
      this._error = preview.selection_error; // the parts picked may not fit: the list stays, Import stays off
    } catch (err) {
      this._error = errorMessage(err);
      if (first) {
        // the file itself cannot be used
        this._preview = null;
        this._file = null;
      }
      // else: the parts picked do not fit together. The list stays, so they can be changed; Import stays off until they fit.
    } finally {
      this._busy = false;
    }
  }

  private async _import(): Promise<void> {
    if (this._busy || !this.hass || !this._file || !this._parts.length) return;
    this._busy = true;
    this._error = "";
    try {
      const r = await importBackup(this.hass, this._file.data, this._parts);
      this._done = [
        `Imported: ${r.imported.map((p) => PART_TEXT[p].title.toLowerCase()).join(", ")}.`,
        ...(r.imported.includes("chores") ? [`${r.chores} ${r.chores === 1 ? "chore is" : "chores are"} set up now.`] : []),
        ...(r.runs_ended ? [`${r.runs_ended} running ${r.runs_ended === 1 ? "chore" : "chores"} ended with the chores that were replaced.`] : []),
      ];
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  // --- the pieces --------------------------------------------------------------------

  private _renderParts(available: BackupPart[], counts?: BackupPreview["counts"]) {
    const line = (p: BackupPart): string => {
      if (!counts) return PART_TEXT[p].text;
      if (p === "settings") return `${counts.boards} wall ${counts.boards === 1 ? "board" : "boards"}. ${PART_TEXT[p].text}`;
      if (p === "chores") return `${counts.chores} ${counts.chores === 1 ? "chore" : "chores"}.`;
      if (p === "home") return `${counts.rooms} ${counts.rooms === 1 ? "room" : "rooms"}.`;
      return `Level ${counts.level}, ${counts.history} things done on record.`;
    };
    return html`<div class="parts" role="group" aria-label=${t("backup.what_to_include")}>
      ${BACKUP_PARTS.filter((p) => available.includes(p)).map(
        (p) => html`<label class="part">
          <input type="checkbox" .checked=${this._parts.includes(p)} ?disabled=${this._busy} @change=${(e: Event) => this._toggle(p, (e.target as HTMLInputElement).checked)} />
          <span><b>${PART_TEXT[p].title}</b><br /><span class="muted small">${line(p)}</span></span>
        </label>`
      )}
    </div>`;
  }

  /** The changes to the settings, from the settings as an import would apply them. Null: they could not be listed. */
  private _changes(): string[] | null {
    const before = this.snapshot?.settings;
    const after: Settings | null | undefined = this._preview?.settings;
    if (!before || !after || !this._parts.includes("settings")) return [];
    try {
      return diffSettings(before, after, this.hass);
    } catch {
      return null;
    }
  }

  private _renderExport() {
    return html`
      <h2>${icon("content-save-outline")} ${t("common.export_a_backup")}</h2>
      <p>${t("backup.save_your_setup_to_one_file")}</p>
      ${this._renderParts([...BACKUP_PARTS])}
      <p class="muted small">
        The file ends in <code>${EXTENSION}</code> and is plain text inside. It holds the names of your devices and phones and your notes, so keep it private.
        Running chores, away mode and picture files are not part of it.
      </p>
      <div class="foot">
        <button class="primary" ?disabled=${this._busy || !this._parts.length} @click=${() => this._export()}>${this._busy ? "Saving…" : "Download backup"}</button>
        <button ?disabled=${this._busy} @click=${this._close}>${t("common.close")}</button>
      </div>
    `;
  }

  private _renderImport() {
    const pre = this._preview;
    const changes = this._changes();
    return html`
      <h2>${icon("content-save-outline")} ${t("common.import_a_backup")}</h2>
      <div class="field">
        <label for="file">Choose a backup file (${EXTENSION})</label>
        <input id="file" type="file" accept="${EXTENSION},.json,application/json" ?disabled=${this._busy} @change=${(e: Event) => void this._choose(e)} />
      </div>
      ${pre && this._file
        ? html`
            <p class="muted small">
              ${this._file.name}${pre.exported_at ? html` · saved ${new Date(pre.exported_at).toLocaleString()}` : nothing}${pre.boopli_version ? html` · Boopli ${pre.boopli_version}` : nothing}
            </p>
            <p>Pick what to bring in:</p>
            ${this._renderParts(pre.parts, pre.counts)}
            ${changes === null
              ? html`<div class="warn" role="status">${t("backup.the_list_of_changes_to_the")}</div>`
              : changes.length
                ? html`<div class="changes"><b>${t("backup.the_settings_would_change_like_this")}</b>
                    <ul>${changes.slice(0, 12).map((c) => html`<li>${c}</li>`)}</ul>
                    ${changes.length > 12 ? html`<span class="muted small">and ${changes.length - 12} more.</span>` : nothing}</div>`
                : nothing}
            ${pre.missing_entities_total || pre.missing_services.length
              ? html`<div class="warn" role="status">
                  <b>${t("backup.this_install_does_not_have_everything")}</b>
                  ${pre.missing_entities_total
                    ? html`<div class="small">Not found: ${pre.missing_entities.join(", ")}${pre.missing_entities_total > pre.missing_entities.length ? ` and ${pre.missing_entities_total - pre.missing_entities.length} more` : ""}.</div>`
                    : nothing}
                  ${pre.missing_services.length ? html`<div class="small">Phones not found: ${pre.missing_services.join(", ")}.</div>` : nothing}
                  <div class="small muted">They are kept, but do nothing until you pick devices that exist here.</div>
                </div>`
              : nothing}
            ${pre.runs_ended
              ? html`<div class="warn" role="status">${pre.runs_ended} running ${pre.runs_ended === 1 ? "chore belongs" : "chores belong"} to chores that are not in the file and will end.</div>`
              : nothing}
            <p class="small">
              Importing <b>replaces</b> the ticked parts on this install, and it cannot be undone.
              <button class="link" ?disabled=${this._busy} @click=${() => this._saveCopy()}>Save a copy of what I have now first</button>
              ${this._copyName ? html`<span class="muted">(saved ${this._copyName})</span>` : nothing}
            </p>
          `
        : nothing}
      <div class="foot">
        <button class="primary" ?disabled=${this._busy || !pre || !this._parts.length || !!this._error} @click=${() => this._import()}>${this._busy ? "Working…" : "Import"}</button>
        <button ?disabled=${this._busy} @click=${this._close}>Cancel</button>
      </div>
    `;
  }

  render() {
    return html`<dialog
      class="modal"
      aria-label=${t("backup.backup")}
      @close=${this._closed}
      @cancel=${(e: Event) => this._busy && e.preventDefault()}
      @click=${(e: Event) => e.target === e.currentTarget && this._close()}
    >
      <div class="box">
        ${this._done.length
          ? html`<h2>${icon("check-circle-outline")} Done</h2>
              ${this._done.map((l) => html`<p>${l}</p>`)}
              <div class="foot"><button class="primary" @click=${this._close}>Close</button></div>`
          : this.mode === "export"
            ? this._renderExport()
            : this._renderImport()}
        ${this._error ? html`<div class="error" role="alert">${this._error}</div>` : nothing}
      </div>
    </dialog>`;
  }

  static styles = [
    sharedStyles,
    css`
      :host {
        display: contents;
      }
      * {
        box-sizing: border-box;
      }
      dialog.modal {
        width: min(600px, calc(100vw - 24px));
        max-height: 92vh;
        padding: 0;
        overflow: auto;
        border-radius: 16px;
        background: var(--card-background-color, var(--primary-background-color));
        color: var(--primary-text-color);
        border: 1px solid var(--divider-color);
      }
      dialog.modal::backdrop {
        background: rgba(0, 0, 0, 0.55);
      }
      .box {
        padding: 16px 18px;
      }
      h2 {
        margin: 0 0 10px;
        font-size: 22px;
      }
      .parts {
        display: grid;
        gap: 8px;
        margin: 8px 0;
      }
      .part {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        padding: 8px 10px;
        border: 1px solid var(--divider-color);
        border-radius: 10px;
      }
      .part input[type="checkbox"] {
        flex: none;
        width: 20px;
        height: 20px;
        min-height: 0;
        margin: 2px 0 0;
        padding: 0;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin: 8px 0;
      }
      .field label {
        font-size: 15px;
        color: var(--secondary-text-color);
      }
      .changes,
      .warn {
        margin: 10px 0;
        padding: 8px 12px;
        border-radius: 10px;
        border: 1px solid var(--divider-color);
      }
      .warn {
        border-color: var(--warning-color, #ffa600);
      }
      .changes ul {
        margin: 6px 0 0;
        padding-left: 18px;
      }
      .foot {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
        /* the buttons stay in view when the window is taller than the screen */
        position: sticky;
        bottom: -16px;
        padding: 10px 0 16px;
        background: var(--card-background-color, var(--primary-background-color));
      }
      .small {
        font-size: 15px;
      }
      .muted {
        color: var(--secondary-text-color);
      }
      .error {
        color: var(--error-color, #db4437);
        margin-top: 10px;
      }
      button.link {
        background: none;
        border: none;
        padding: 0;
        min-height: 0;
        color: var(--boopli-accent, var(--primary-color));
        text-decoration: underline;
        cursor: pointer;
        font: inherit;
      }
      code {
        word-break: break-all;
      }
    `,
  ];
}
customElements.define("boopli-backup", BoopliBackup);
