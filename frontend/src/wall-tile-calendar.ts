import { css, html } from "lit";
import { WallTile, wallTileStyles } from "./wall-tile";

interface CalendarEvent {
  summary?: string;
  start: { dateTime?: string; date?: string };
}

interface Line {
  title: string;
  when: string;
  at: number;
}

const REFRESH_MS = 10 * 60 * 1000;
const DAYS_AHEAD = 7;

/** The next events of a calendar. Options: entity_id, count. */
export class WallTileCalendar extends WallTile {
  static properties = { ...WallTile.properties, _events: { state: true }, _error: { state: true } };
  declare _events: Line[];
  declare _error: string;
  private _timer?: number;
  private _loadedFor = "";
  private _seq = 0; // every request gets a number; only the latest one may show its answer

  constructor() {
    super();
    this._events = [];
    this._error = "";
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._timer = window.setInterval(() => void this._load(true), REFRESH_MS);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.clearInterval(this._timer);
  }

  protected updated(): void {
    void this._load(false);
  }

  /** Ask Home Assistant for the next week (when the calendar changed, or on the timer). */
  private async _load(force: boolean): Promise<void> {
    const id = this.text("entity_id");
    if (!id || !this.hass?.callApi || (!force && this._loadedFor === id)) return;
    this._loadedFor = id;
    const seq = ++this._seq;
    const start = new Date();
    const end = new Date(start.getTime() + DAYS_AHEAD * 86_400_000);
    try {
      const events = await this.hass.callApi<CalendarEvent[]>(
        "GET",
        `calendars/${id}?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`
      );
      if (seq !== this._seq) return; // a newer request has been made since
      this._events = events
        .map((e) => {
          const allDay = !e.start.dateTime;
          const at = Date.parse(e.start.dateTime ?? `${e.start.date}T00:00:00`);
          return { title: e.summary ?? "(no title)", at, when: this._when(at, allDay) };
        })
        .filter((l) => !Number.isNaN(l.at))
        .sort((a, b) => a.at - b.at);
      this._error = "";
    } catch {
      if (seq === this._seq) this._error = "Could not read the calendar.";
    }
  }

  private _when(at: number, allDay: boolean): string {
    const tz = this.snapshot?.time_zone;
    const d = new Date(at);
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d);
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(this.nowMs || Date.now()));
    const tomorrow = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date((this.nowMs || Date.now()) + 86_400_000));
    const name = day === today ? "Today" : day === tomorrow ? "Tomorrow" : new Intl.DateTimeFormat(undefined, { timeZone: tz, weekday: "short", day: "numeric", month: "short" }).format(d);
    if (allDay) return name;
    return `${name} ${new Intl.DateTimeFormat(undefined, { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d)}`;
  }

  render() {
    if (!this.text("entity_id")) return html`<div class="center muted normal">Pick a calendar in the board settings.</div>`;
    const lines = this._events.filter((l) => l.at >= (this.nowMs || Date.now()) - 86_400_000).slice(0, this.num("count", 4));
    return html`<div class="label">Calendar</div>
      ${this._error
        ? html`<div class="error">${this._error}</div>`
        : lines.length
          ? lines.map((l) => html`<div class="row normal"><span class="t">${l.title}</span><span class="muted small">${l.when}</span></div>`)
          : html`<div class="normal muted">Nothing in the next week.</div>`}`;
  }

  static styles = [
    wallTileStyles,
    css`
      .row {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        padding: 6px 0;
        border-top: 1px solid var(--divider-color);
      }
      .t {
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .small {
        white-space: nowrap;
      }
    `,
  ];
}
customElements.define("wall-tile-calendar", WallTileCalendar);
