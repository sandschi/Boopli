import { css, html } from "lit";
import { WallTile, wallTileStyles } from "./wall-tile";
import { t } from "./i18n";

interface CalendarEvent {
  summary?: string;
  start: { dateTime?: string; date?: string };
}

interface Line {
  title: string;
  at: number; // when it starts (not used for an all-day event)
  allDay: boolean;
  day: string; // the calendar day in Home Assistant's time zone (YYYY-MM-DD); an all-day event keeps its own date as it is
  key: string; // day and time of day as text, so events sort and compare without any time zone arithmetic
}

/** The calendar day (YYYY-MM-DD) and the time of day (HH:MM) of a moment in a time zone, built from the parts (the order of a formatted date is up to the browser). */
function dayAndTime(ms: number, tz: string | undefined): { day: string; time: string } {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(new Date(ms))
    .reduce<Record<string, string>>((o, x) => ((o[x.type] = x.value), o), {});
  return { day: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
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
      const tz = this.snapshot?.time_zone;
      this._events = events
        .map((e): Line | null => {
          const title = e.summary ?? "(no title)";
          if (!e.start.dateTime) {
            const date = String(e.start.date ?? "");
            return /^\d{4}-\d{2}-\d{2}$/.test(date) ? { title, at: 0, allDay: true, day: date, key: `${date}T00:00` } : null;
          }
          const at = Date.parse(e.start.dateTime);
          if (Number.isNaN(at)) return null;
          const { day, time } = dayAndTime(at, tz);
          return { title, at, allDay: false, day, key: `${day}T${time}` };
        })
        .filter((l): l is Line => l !== null)
        .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
      this._error = "";
    } catch {
      if (seq === this._seq) this._error = t("wall_tile_calendar.could_not_read_the_calendar");
    }
  }

  /** The words for when an event is, worked out from the time now (so "Tomorrow" turns into "Today" at midnight). */
  private _when(line: Line): string {
    const tz = this.snapshot?.time_zone;
    const nextDay = (day: string): string => {
      const d = new Date(`${day}T12:00:00Z`); // a calendar date plus one, not 24 hours (which is wrong around the clock change)
      d.setUTCDate(d.getUTCDate() + 1);
      return d.toISOString().slice(0, 10);
    };
    const today = dayAndTime(this.nowMs || Date.now(), tz).day;
    const day = line.day;
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
    if (!this.text("entity_id")) return html`<div class="center muted normal">${t("wall_tile_calendar.pick_a_calendar_in_the_board")}</div>`;
    const today = dayAndTime(this.nowMs || Date.now(), this.snapshot?.time_zone).day;
    const lines = this._events.filter((l) => l.day >= today).slice(0, this.num("count", 4)); // an event stays until its day is over
    return html`<div class="label">${t("wall_tile_calendar.calendar")}</div>
      ${this._error
        ? html`<div class="error">${this._error}</div>`
        : lines.length
          ? lines.map((l) => html`<div class="row normal"><span class="t">${l.title}</span><span class="muted small">${this._when(l)}</span></div>`)
          : html`<div class="normal muted">${t("wall_tile_calendar.nothing_in_the_next_week")}</div>`}`;
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
