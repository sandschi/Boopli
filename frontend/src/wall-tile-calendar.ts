import { css, html } from "lit";
import { WallTile, wallTileStyles } from "./wall-tile";

interface CalendarEvent {
  summary?: string;
  start: { dateTime?: string; date?: string };
}

interface Line {
  title: string;
  at: number; // when it starts (for an all-day event: local midnight of its date, only used for the order)
  allDay: boolean;
  date: string; // an all-day event keeps its calendar date as it is (YYYY-MM-DD)
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
    if (!id) {
      // no calendar picked (or picked away): forget the old one, and what a pending request may still bring
      if (this._loadedFor || this._events.length || this._error) {
        this._seq += 1;
        this._loadedFor = "";
        this._events = [];
        this._error = "";
      }
      return;
    }
    if (!this.hass?.callApi || (!force && this._loadedFor === id)) return;
    if (this._loadedFor !== id) {
      this._events = []; // another calendar: do not show the old one's events while this one loads
      this._error = "";
    }
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
        .map((e): Line => {
          const allDay = !e.start.dateTime;
          const date = allDay ? String(e.start.date ?? "") : "";
          const at = Date.parse(e.start.dateTime ?? `${date}T00:00:00`);
          return { title: e.summary ?? "(no title)", at, allDay, date };
        })
        .filter((l) => !Number.isNaN(l.at))
        .sort((a, b) => a.at - b.at);
      this._error = "";
    } catch {
      if (seq === this._seq) this._error = "Could not read the calendar.";
    }
  }

  /** The words for when an event is, worked out from the time now (so "Tomorrow" turns into "Today" at midnight). */
  private _when(line: Line): string {
    const tz = this.snapshot?.time_zone;
    const dayOf = (ms: number): string => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(ms)); // YYYY-MM-DD in Home Assistant's time zone
    const nextDay = (day: string): string => {
      const d = new Date(`${day}T12:00:00Z`); // a calendar date plus one, not 24 hours (which is wrong around the clock change)
      d.setUTCDate(d.getUTCDate() + 1);
      return d.toISOString().slice(0, 10);
    };
    const today = dayOf(this.nowMs || Date.now());
    const day = line.allDay ? line.date : dayOf(line.at);
    const name =
      day === today
        ? "Today"
        : day === nextDay(today)
          ? "Tomorrow"
          : new Intl.DateTimeFormat(undefined, { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }).format(new Date(`${day}T12:00:00Z`));
    if (line.allDay) return name;
    return `${name} ${new Intl.DateTimeFormat(undefined, { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(line.at))}`;
  }

  render() {
    if (!this.text("entity_id")) return html`<div class="center muted normal">Pick a calendar in the board settings.</div>`;
    const lines = this._events.filter((l) => l.at >= (this.nowMs || Date.now()) - 86_400_000).slice(0, this.num("count", 4));
    return html`<div class="label">Calendar</div>
      ${this._error
        ? html`<div class="error">${this._error}</div>`
        : lines.length
          ? lines.map((l) => html`<div class="row normal"><span class="t">${l.title}</span><span class="muted small">${this._when(l)}</span></div>`)
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
