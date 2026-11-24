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
import { t, rich } from "./i18n";

const MAX_FILE_BYTES = 8 * 1024 * 1024; // a backup is a few hundred kilobytes at most
const EXTENSION = ".adhd";

const PART_TEXT = (): Record<BackupPart, { title: string; text: string }> => ({
  settings: { title: t("common.settings"), text: t("backup.devices_timing_nudge_ladders_wall_boards") },
  chores: { title: t("common.chores"), text: t("backup.every_chore_with_its_steps_questions") },
  home: { title: t("backup.rooms_and_notes"), text: t("backup.the_rooms_of_my_home_and") },
  pet: { title: t("backup.pet_and_history"), text: t("backup.your_pets_level_and_xp_and") },
});

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
      this._done = [t("backup.saved_3", { name }), t("backup.keep_it_somewhere_private_it_holds")];
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
      this._error = t("backup.this_file_is_too_big_to");
      return;
    }
    let data: unknown;
    try {
      data = JSON.parse(await file.text());
    } catch {
      this._error = t("backup.this_is_not_a_boopli_backup");
      return;
    }
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      this._error = t("backup.this_is_not_a_boopli_backup");
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
        t("backup.imported_list", { list: r.imported.map((p) => PART_TEXT()[p].title.toLowerCase()).join(", ") }),
        ...(r.imported.includes("chores") ? [t("backup.chores_set_up_now", { count: r.chores })] : []),
        ...(r.runs_ended ? [t("backup.runs_ended_with_replaced", { count: r.runs_ended })] : []),
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
      if (!counts) return PART_TEXT()[p].text;
      if (p === "settings") return t("backup.wall_boards_and_text", { count: counts.boards, text: PART_TEXT()[p].text });
      if (p === "chores") return t("backup.count_chores", { count: counts.chores });
      if (p === "home") return t("backup.count_rooms", { count: counts.rooms });
      return t("backup.level_things_done_on_record", { level: counts.level, history: counts.history });
    };
    return html`<div class="parts" role="group" aria-label=${t("backup.what_to_include")}>
      ${BACKUP_PARTS.filter((p) => available.includes(p)).map(
        (p) => html`<label class="part">
          <input type="checkbox" .checked=${this._parts.includes(p)} ?disabled=${this._busy} @change=${(e: Event) => this._toggle(p, (e.target as HTMLInputElement).checked)} />
          <span><b>${PART_TEXT()[p].title}</b><br /><span class="muted small">${line(p)}</span></span>
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
        ${rich("backup.the_file_ends_in_and_is", { extension: EXTENSION  })}
      </p>
      <div class="foot">
        <button class="primary" ?disabled=${this._busy || !this._parts.length} @click=${() => this._export()}>${this._busy ? t("common.saving") : t("backup.download_backup")}</button>
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
        <label for="file">${t("backup.choose_a_backup_file", { extension: EXTENSION })}</label>
        <input id="file" type="file" accept="${EXTENSION},.json,application/json" ?disabled=${this._busy} @change=${(e: Event) => void this._choose(e)} />
      </div>
      ${pre && this._file
        ? html`
            <p class="muted small">
              ${this._file.name}${pre.exported_at ? html`${t("backup.saved_2", { date: new Date(pre.exported_at).toLocaleString() })}` : nothing}${pre.boopli_version ? html`${t("backup.boopli", { version: pre.boopli_version })}` : nothing}
            </p>
            <p>${t("backup.pick_what_to_bring_in")}</p>
            ${this._renderParts(pre.parts, pre.counts)}
            ${changes === null
              ? html`<div class="warn" role="status">${t("backup.the_list_of_changes_to_the")}</div>`
              : changes.length
                ? html`<div class="changes"><b>${t("backup.the_settings_would_change_like_this")}</b>
                    <ul>${changes.slice(0, 12).map((c) => html`<li>${c}</li>`)}</ul>
                    ${changes.length > 12 ? html`<span class="muted small">${t("backup.and_more", { value: changes.length - 12 })}</span>` : nothing}</div>`
                : nothing}
            ${pre.missing_entities_total || pre.missing_services.length
              ? html`<div class="warn" role="status">
                  <b>${t("backup.this_install_does_not_have_everything")}</b>
                  ${pre.missing_entities_total
                    ? html`<div class="small">${t("backup.not_found_list", { list: pre.missing_entities.join(", ") + (pre.missing_entities_total > pre.missing_entities.length ? " " + t("backup.and_n_more", { n: pre.missing_entities_total - pre.missing_entities.length }) : "") })}</div>`
                    : nothing}
                  ${pre.missing_services.length ? html`<div class="small">${t("backup.phones_not_found", { join: pre.missing_services.join(", ") })}</div>` : nothing}
                  <div class="small muted">${t("backup.they_are_kept_but_do_nothing")}</div>
                </div>`
              : nothing}
            ${pre.runs_ended
              ? html`<div class="warn" role="status">${t("backup.runs_ending", { count: pre.runs_ended })}</div>`
              : nothing}
            <p class="small">
              ${rich("backup.importing_replaces")}
              <button class="link" ?disabled=${this._busy} @click=${() => this._saveCopy()}>${t("backup.save_a_copy_of_what_i")}</button>
              ${this._copyName ? html`<span class="muted">${t("backup.saved", { name: this._copyName })}</span>` : nothing}
            </p>
          `
        : nothing}
      <div class="foot">
        <button class="primary" ?disabled=${this._busy || !pre || !this._parts.length || !!this._error} @click=${() => this._import()}>${this._busy ? t("backup.working") : t("settings.import")}</button>
        <button ?disabled=${this._busy} @click=${this._close}>${t("common.cancel")}</button>
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
          ? html`<h2>${icon("check-circle-outline")} ${t("common.done")}</h2>
              ${this._done.map((l) => html`<p>${l}</p>`)}
              <div class="foot"><button class="primary" @click=${this._close}>${t("common.close")}</button></div>`
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
