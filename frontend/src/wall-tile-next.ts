import { css, html } from "lit";
import { buildToday } from "./today";
import { describeWhen, fmtTime } from "./time";
import { WallTile, wallTileStyles } from "./wall-tile";
import { t } from "./i18n";

interface Line {
  title: string;
  when: string;
}

/** What comes next: other steps that are ready, the rest of today, then later days. Option: count. */
export class WallTileNext extends WallTile {
  render() {
    if (!this.snapshot) return html`<div class="center muted normal">${t("common.loading")}</div>`;
    const tz = this.snapshot.time_zone;
    const model = buildToday(this.snapshot, this.nowMs);
    const lines: Line[] = [
      ...model.ready.flatMap((g) => g.steps.map((s) => ({ title: `${g.run.chore_name}: ${s.title}`, when: t("common.ready_now_hint") }))),
      ...model.groups.flatMap((g) => g.steps.map((s) => ({ title: `${g.run.chore_name}: ${s.title}`, when: s.hint }))),
      ...model.dueToday.map((d) => ({ title: d.chore.name, when: t("wall_tile_next.at_time", { time: fmtTime(d.at, tz) }) })),
      ...model.upcoming.map((d) => ({ title: d.chore.name, when: describeWhen(d.at, this.nowMs, tz) })),
    ].slice(0, this.num("count", 3));
    return html`<div class="label">${t("wall_tile_next.coming_up")}</div>
      ${lines.length
        ? lines.map((l) => html`<div class="row normal"><span class="t">${l.title}</span><span class="muted small">${l.when}</span></div>`)
        : html`<div class="normal muted">${t("wall_tile_next.nothing_planned")}</div>`}`;
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
customElements.define("wall-tile-coming-up", WallTileNext);
