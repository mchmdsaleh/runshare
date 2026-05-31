import { formatDistance, formatPace, parsePaceToSeconds } from "../../lib/formatUtils";

export default function ClassicSummary({
  activity,
  includeWarmup = false,
  includeCooldown = false,
  includeRest = false,
  title = "Run"
}) {
  const duration = compactDuration(activity.summary.duration || "-");
  const splitRows = buildSplitRows(activity, includeWarmup, includeCooldown, includeRest);
  const scaleRows = activity?.activityType === "interval_run"
    ? splitRows.filter((row) => !["WU", "CD"].includes(row.id))
    : splitRows;
  const paceValues = scaleRows
    .map((row) => row.paceSeconds)
    .filter((value) => Number.isFinite(value));
  const minPace = paceValues.length ? Math.min(...paceValues) : 0;
  const maxPace = paceValues.length ? Math.max(...paceValues) : 0;
  const paceRange = Math.max(maxPace - minPace, 1);

  return (
    <div className="card-template classic-summary">
      <div className="classic-content">
        <h3 className="classic-title">{title || "Run"}</h3>
        <div className="classic-grid top">
          <ClassicStat label="Distance" value={formatDistance(activity.summary.distanceKm ?? 0)} />
          <ClassicStat label="Pace" value={formatPace(activity.summary.avgPace || "")} />
          <ClassicStat label="Time" value={duration} />
        </div>

        <div className="classic-split-block">
          <p className="classic-split-title">Splits</p>
          <div className="splits-head classic-splits-head">
            <span>{activity?.activityType === "interval_run" ? "Interval" : "Run"}</span>
            <span>Dist</span>
            <span>Pace</span>
            <span aria-hidden="true"></span>
            <span>HR</span>
          </div>
          <div className="splits-list classic-splits-list">
            {splitRows.length ? (
              splitRows.map((row) => {
                const widthRaw =
                  row.paceSeconds == null
                    ? 22
                    : 22 + ((maxPace - row.paceSeconds) / paceRange) * 78;
                const width = Math.max(12, Math.min(100, widthRaw));
                return (
                <div key={row.id} className="split-row classic-split-row">
                  <span className="split-km">{row.id}</span>
                  <span className="split-distance">{row.distance}</span>
                  <span className="split-pace">{row.pace}</span>
                  <div className="split-bar-wrap classic-split-bar-wrap" aria-hidden="true">
                    <div className="split-bar classic-split-bar" style={{ width: `${width}%` }} />
                  </div>
                  <span className="split-hr">{row.hr || "-"}</span>
                </div>
                );
              })
            ) : (
              <div className="split-row classic-split-row">
                <span>-</span>
                <span>-</span>
                <span>-</span>
                <span>-</span>
                <span>-</span>
              </div>
            )}
          </div>
        </div>

        <div className="classic-grid bottom">
          <ClassicStat label="Cal" value={metricOrDash(activity.summary.calories, "Cal")} />
          <ClassicStat label="Avg HR" value={metricOrDash(activity.summary.avgHr, "bpm")} />
          <ClassicStat label="Max HR" value={metricOrDash(activity.summary.maxHr, "bpm")} />
        </div>
      </div>
    </div>
  );
}

function ClassicStat({ label, value }) {
  return (
    <article className="classic-stat">
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

function compactDuration(value) {
  if (!value || !value.includes(":")) return value;
  const parts = value.split(":").map((p) => Number(p));
  if (parts.length === 3) {
    const [h, m] = parts;
    return `${h}h ${m}m`;
  }
  const [m] = parts;
  return `${m}m`;
}

function metricOrDash(value, unit) {
  if (value == null || value === "" || Number.isNaN(Number(value))) return "-";
  return `${Math.round(Number(value))} ${unit}`;
}

function buildSplitRows(activity, includeWarmup, includeCooldown, includeRest) {
  const aggregateEdgeSplits = activity?.sourceFormat === "fit";
  const isIntervalRun = activity?.activityType === "interval_run";
  let restIndex = 0;
  const segments = activity.segments.map((segment, index) => ({
    type: segment.type,
    label: segment.label || segment.type,
    rep:
      segment.type === "rest"
        ? `R${(restIndex += 1)}`
        : segment.rep ?? index + 1,
    avgPace: segment.avgPace || "-",
    distanceKm: Number(segment.distanceKm) || 0,
    avgHr: Math.round(Number(segment.avgHr) || 0)
  }));

  const rows = segments
    .filter((segment) =>
      isIntervalRun
        ? segment.type === "interval" || (includeRest && segment.type === "rest")
        : segment.type !== "rest"
    )
    .map((segment) => ({
      id: String(isIntervalRun ? segment.rep : segment.rep ?? segment.label ?? ""),
      distance: formatDistanceValue(segment.distanceKm),
      pace: formatPace(segment.avgPace).replace("/km", ""),
      paceSeconds: parsePaceToSeconds(segment.avgPace),
      hr: segment.avgHr
    }));

  if (isIntervalRun && includeWarmup) {
    const warmup = buildEdgeSplitRow(segments, "warmup", "WU", aggregateEdgeSplits);
    if (warmup) rows.unshift(warmup);
  }

  if (isIntervalRun && includeCooldown) {
    const cooldown = buildEdgeSplitRow(segments, "cooldown", "CD", aggregateEdgeSplits);
    if (cooldown) rows.push(cooldown);
  }

  if (!isIntervalRun) {
    rows.forEach((row, index) => {
      row.id = String(index + 1);
    });
  }

  return rows;
}

function formatDistanceValue(distanceKm) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return "-";
  return distanceKm.toFixed(2);
}

function buildEdgeSplitRow(segments, type, id, aggregate) {
  const matched = segments.filter((segment) => segment.type === type);
  if (!matched.length) return null;

  if (!aggregate) {
    const first = matched[0];
    return {
      id,
      distance: formatDistanceValue(first.distanceKm),
      pace: formatPace(first.avgPace).replace("/km", ""),
      paceSeconds: parsePaceToSeconds(first.avgPace),
      hr: first.avgHr
    };
  }

  const distanceKm = matched.reduce((sum, segment) => sum + (Number(segment.distanceKm) || 0), 0);
  const paceValues = matched
    .map((segment) => ({
      distanceKm: Number(segment.distanceKm),
      paceSeconds: parsePaceToSeconds(segment.avgPace)
    }));
  const paceSeconds = weightedPaceSeconds(paceValues);
  const hr = weightedHr(
    matched.map((segment) => ({
      distanceKm: Number(segment.distanceKm),
      paceSeconds: parsePaceToSeconds(segment.avgPace),
      hr: Number(segment.avgHr)
    }))
  );

  return {
    id,
    distance: formatDistanceValue(distanceKm),
    pace: paceSeconds != null ? formatPace(secondsToPace(paceSeconds)).replace("/km", "") : "-",
    paceSeconds,
    hr
  };
}

function secondsToPace(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "-";
  const rounded = Math.round(totalSeconds);
  const m = Math.floor(rounded / 60);
  const s = rounded % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function weightedPaceSeconds(rows) {
  let totalDistanceKm = 0;
  let totalSeconds = 0;
  for (const row of rows) {
    const dist = Number(row.distanceKm);
    const pace = Number(row.paceSeconds);
    if (!Number.isFinite(dist) || dist <= 0) continue;
    if (!Number.isFinite(pace) || pace <= 0) continue;
    totalDistanceKm += dist;
    totalSeconds += pace * dist;
  }
  if (totalDistanceKm <= 0 || totalSeconds <= 0) return null;
  return totalSeconds / totalDistanceKm;
}

function weightedHr(rows) {
  let weightedSum = 0;
  let totalSeconds = 0;
  for (const row of rows) {
    const hr = Number(row.hr);
    const dist = Number(row.distanceKm);
    const pace = Number(row.paceSeconds);
    if (!Number.isFinite(hr) || hr <= 0) continue;
    if (!Number.isFinite(dist) || dist <= 0) continue;
    if (!Number.isFinite(pace) || pace <= 0) continue;
    const seconds = pace * dist;
    weightedSum += hr * seconds;
    totalSeconds += seconds;
  }
  if (totalSeconds <= 0) return 0;
  return Math.round(weightedSum / totalSeconds);
}
