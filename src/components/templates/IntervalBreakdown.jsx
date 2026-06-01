import { formatPace, parsePaceToSeconds } from "../../lib/formatUtils";

export default function IntervalBreakdown({
  activity,
  includeWarmup = false,
  includeCooldown = false,
  includeRest = false,
  showHr = true
}) {
  const aggregateEdgeSplits = activity?.sourceFormat === "fit";
  const isIntervalRun = activity?.activityType === "interval_run";
  let restIndex = 0;
  const allSegments = activity.segments.map((segment, index) => {
    const paceSeconds = parsePaceToSeconds(segment.avgPace || "");
    if (segment.type === "rest") restIndex += 1;
    return {
      index,
      type: segment.type,
      label: segment.label || segment.type,
      km: segment.type === "rest" ? `R${restIndex}` : segment.rep ?? index + 1,
      distanceKm: Number(segment.distanceKm) || 0,
      pace: segment.avgPace || "-",
      paceSeconds,
      hr: Math.round(Number(segment.avgHr) || 0),
    };
  });

  const intervalRows = allSegments.filter((row) => row.type === "interval");
  const rows = isIntervalRun
    ? allSegments.filter((row) => row.type === "interval" || (includeRest && row.type === "rest"))
    : allSegments.filter((row) => row.type !== "rest");

  if (isIntervalRun && includeWarmup) {
    const wuSummary = summarizeSegments(allSegments, "warmup", "WU", aggregateEdgeSplits);
    if (wuSummary) rows.unshift(wuSummary);
  }

  if (isIntervalRun && includeCooldown) {
    const cdSummary = summarizeSegments(allSegments, "cooldown", "CD", aggregateEdgeSplits);
    if (cdSummary) rows.push(cdSummary);
  }

  const scaleRows = isIntervalRun ? intervalRows : rows;
  const paceValues = scaleRows
    .map((row) => row.paceSeconds)
    .filter((v) => Number.isFinite(v));
  const minPace = paceValues.length ? Math.min(...paceValues) : 0;
  const maxPace = paceValues.length ? Math.max(...paceValues) : 0;
  const paceRange = Math.max(maxPace - minPace, 1);

  // Determine fastest rep index (lowest pace = fastest)
  const fastestPaceSeconds = paceValues.length ? Math.min(...paceValues) : null;

  return (
    <div
      className="card-template interval-breakdown splits-card"
      style={{ "--split-rows": rows.length }}
    >
      <div className="splits-content">
        <h3 className="splits-title">Splits</h3>
        <div className={`splits-head${showHr ? "" : " no-hr"}`}>
          <span>{isIntervalRun ? "Interval" : "Run"}</span>
          <span>Dist</span>
          <span>Pace</span>
          <span aria-hidden="true"></span>
          {showHr ? <span>HR</span> : null}
        </div>

        <div className="splits-list">
          {rows.map((row, index) => {
            const isFastest =
              fastestPaceSeconds != null &&
              row.paceSeconds === fastestPaceSeconds;

            // Bar width: fastest rep gets ~100%, slowest gets ~30%
            // Scale: width = 30 + ((maxPace - currentPace) / paceRange) * 70
            const widthRaw =
              row.paceSeconds == null
                ? 22
                : 22 + ((maxPace - row.paceSeconds) / paceRange) * 78;
            const width = Math.max(12, Math.min(100, widthRaw));

            return (
              <div
                key={`${row.km}-${index}`}
                className={`split-row${isFastest ? " split-row-fastest" : ""}${showHr ? "" : " no-hr"}`}
              >
                <span className="split-km">{isIntervalRun ? row.km : index + 1}</span>
                <span className="split-distance">{formatDistance(row.distanceKm)}</span>
                <span className="split-pace">
                  {formatPace(row.pace).replace("/km", "")}
                </span>
                <div className="split-bar-wrap" aria-hidden="true">
                  <div
                    className={`split-bar${isFastest ? " split-bar-fastest" : ""}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
                {showHr ? <span className="split-hr">{row.hr || "-"}</span> : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function formatDistance(distanceKm) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return "-";
  return distanceKm.toFixed(2);
}

function summarizeSegments(rows, type, label, aggregate = false) {
  const matched = rows.filter((row) => row.type === type);
  if (!matched.length) return null;

  const first = matched[0];
  const distanceKm = aggregate
    ? matched.reduce((sum, row) => sum + (Number(row.distanceKm) || 0), 0)
    : Number(first?.distanceKm) || 0;

  const paceSeconds = aggregate
    ? weightedPaceSeconds(matched)
    : (Number.isFinite(first?.paceSeconds) ? first.paceSeconds : null);

  const hr = aggregate
    ? weightedHr(matched)
    : (Number.isFinite(first?.hr) ? first.hr : 0);

  return {
    type,
    label,
    km: label,
    distanceKm,
    pace: paceSeconds != null ? secondsToPace(Math.round(paceSeconds)) : "-",
    paceSeconds,
    hr
  };
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

function secondsToPace(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "-";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
