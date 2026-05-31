import { useEffect, useRef, useState } from "react";
import { formatPace, parsePaceToSeconds } from "../../lib/formatUtils";

export default function CustomCanvas({
  activity,
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onRemoveLayer,
  includeWarmup = false,
  includeCooldown = false,
  includeRest = false,
  showHr = true,
  title = "Run"
}) {
  const stageRef = useRef(null);
  const [gesture, setGesture] = useState(null);
  const isIntervalRun = activity?.activityType === "interval_run";
  const splits = buildSplitRows(activity, includeWarmup, includeCooldown, includeRest);
  const scaleRows = isIntervalRun ? splits.filter((row) => row.type === "interval") : splits;
  const paceValues = scaleRows.map((row) => row.paceSeconds).filter((value) => Number.isFinite(value));
  const fastestPaceSeconds = paceValues.length ? Math.min(...paceValues) : null;
  const maxPace = paceValues.length ? Math.max(...paceValues) : 0;
  const minPace = paceValues.length ? Math.min(...paceValues) : 0;
  const paceRange = Math.max(maxPace - minPace, 1);

  useEffect(() => {
    if (!gesture) return;

    function onPointerMove(event) {
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const layer = layers.find((item) => item.id === gesture.layerId);
      if (!layer) return;

      const dx = event.clientX - gesture.startX;
      const dy = event.clientY - gesture.startY;

      if (gesture.mode === "drag") {
        const x = clamp(gesture.originX + dx, 0, Math.max(0, rect.width - layer.width));
        const y = clamp(gesture.originY + dy, 0, Math.max(0, rect.height - layer.height));
        onUpdateLayer(gesture.layerId, { x, y });
      } else {
        const width = clamp(gesture.originWidth + dx, 40, rect.width - layer.x);
        const height = clamp(gesture.originHeight + dy, 24, rect.height - layer.y);
        onUpdateLayer(gesture.layerId, { width, height });
      }
    }

    function onPointerUp() {
      setGesture(null);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [gesture, layers, onUpdateLayer]);

  useEffect(() => {
    function onKeyDown(event) {
      if (!selectedLayerId) return;
      const targetTag = String(event.target?.tagName || "").toLowerCase();
      if (targetTag === "input" || targetTag === "textarea" || targetTag === "select") return;
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        onRemoveLayer?.();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedLayerId, onRemoveLayer]);

  function startDrag(event, layer) {
    event.preventDefault();
    onSelectLayer(layer.id);
    setGesture({
      mode: "drag",
      layerId: layer.id,
      startX: event.clientX,
      startY: event.clientY,
      originX: layer.x,
      originY: layer.y
    });
  }

  function startResize(event, layer) {
    event.preventDefault();
    event.stopPropagation();
    onSelectLayer(layer.id);
    setGesture({
      mode: "resize",
      layerId: layer.id,
      startX: event.clientX,
      startY: event.clientY,
      originWidth: layer.width,
      originHeight: layer.height
    });
  }

  return (
    <div className="card-template custom-canvas-template">
      <div ref={stageRef} className="custom-canvas-stage">
        {layers
          .filter((layer) => layer.visible)
          .map((layer) => (
            <div
              key={layer.id}
              className={`custom-layer ${selectedLayerId === layer.id ? "active" : ""}`}
              style={{
                transform: `translate(${layer.x}px, ${layer.y}px)`,
                width: `${layer.width}px`,
                height: `${layer.height}px`
              }}
              onPointerDown={(event) => startDrag(event, layer)}
              onClick={() => onSelectLayer(layer.id)}
            >
              <LayerContent
                layer={layer}
                activity={activity}
                splits={splits}
                isIntervalRun={isIntervalRun}
                fastestPaceSeconds={fastestPaceSeconds}
                maxPace={maxPace}
                paceRange={paceRange}
                showHr={showHr}
                title={title}
              />
              {selectedLayerId === layer.id ? (
                <button
                  type="button"
                  className="custom-delete-layer"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemoveLayer?.();
                  }}
                  aria-label={`Delete ${layer.label}`}
                  title="Delete layer"
                >
                  ×
                </button>
              ) : null}
              <button
                type="button"
                className="custom-resize-handle"
                onPointerDown={(event) => startResize(event, layer)}
                aria-label={`Resize ${layer.label}`}
              />
            </div>
          ))}
      </div>
    </div>
  );
}

function LayerContent({
  layer,
  activity,
  splits,
  isIntervalRun,
  fastestPaceSeconds,
  maxPace,
  paceRange,
  showHr,
  title
}) {
  if (layer.type === "title") {
    return <div className="custom-title">{title || "Run"}</div>;
  }

  if (layer.type === "logo") {
    return (
      <div className="custom-logo">
        <img src="/Strava_Logo.svg" alt="Strava" className="custom-logo-img" draggable="false" />
      </div>
    );
  }

  if (layer.type === "stats") {
    const fields = Array.isArray(layer.statsFields) && layer.statsFields.length
      ? layer.statsFields
      : ["distance", "pace", "time"];
    const metrics = {
      distance: { label: "Distance", value: formatDistanceValue(activity.summary.distanceKm ?? 0) },
      pace: { label: "Pace", value: formatPace(activity.summary.avgPace || "") },
      time: { label: "Time", value: activity.summary.duration || "-" },
      calories: { label: "Cal", value: metricOrDash(activity.summary.calories, "Cal") },
      avgHr: { label: "Avg HR", value: metricOrDash(activity.summary.avgHr, "bpm") },
      maxHr: { label: "Max HR", value: metricOrDash(activity.summary.maxHr, "bpm") }
    };
    return (
      <div className="custom-stats">
        {fields.map((key) => {
          const metric = metrics[key];
          if (!metric) return null;
          return (
            <div key={key}>
              <p>{metric.label}</p>
              <strong>{metric.value}</strong>
            </div>
          );
        })}
      </div>
    );
  }

  if (layer.type === "map") {
    const routePath = buildRoutePath(activity.routePoints);
    return (
      <div className="custom-map-layer" aria-hidden="true">
        {routePath ? (
          <svg viewBox="0 0 400 180" preserveAspectRatio="xMidYMid meet">
            <path
              d={routePath}
              fill="none"
              stroke="#ff5a14"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 400 180" preserveAspectRatio="xMidYMid meet">
            <path
              d="M4,90 L4,35 L65,35 L75,28 L145,28 L149,18 L318,18 L332,32 L375,32 C389,32 396,42 396,54 C396,66 389,76 375,76 L286,76 L286,96 L4,96"
              fill="none"
              stroke="#ff5a14"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M102,82 L102,58 L145,58 C151,58 154,53 157,49 L210,49 L226,55 L246,49 L286,49 L286,82"
              fill="none"
              stroke="#ff5a14"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    );
  }

  if (layer.type === "splits") {
    return (
      <div className="custom-splits splits-content custom-splits-content">
        <h3 className="splits-title">Splits</h3>
        <div className={`splits-head${showHr ? "" : " no-hr"}`}>
          <span>{isIntervalRun ? "Interval" : "Run"}</span>
          <span>Dist</span>
          <span>Pace</span>
          <span aria-hidden="true"></span>
          {showHr ? <span>HR</span> : null}
        </div>
        <div className="splits-list">
          {splits.map((row, index) => {
            const isFastest = fastestPaceSeconds != null && row.paceSeconds === fastestPaceSeconds;
            const widthRaw =
              row.paceSeconds == null ? 22 : 22 + ((maxPace - row.paceSeconds) / paceRange) * 78;
            const width = Math.max(12, Math.min(100, widthRaw));
            return (
              <div
                key={`${row.km}-${index}`}
                className={`split-row${isFastest ? " split-row-fastest" : ""}${showHr ? "" : " no-hr"}`}
              >
                <span className="split-km">{isIntervalRun ? row.km : index + 1}</span>
                <span className="split-distance">{formatDistanceValue(row.distanceKm)}</span>
                <span className="split-pace">{formatPace(row.pace).replace("/km", "")}</span>
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
    );
  }

  return null;
}

function buildSplitRows(activity, includeWarmup, includeCooldown, includeRest) {
  const isIntervalRun = activity?.activityType === "interval_run";
  let restIndex = 0;
  const segments = activity.segments.map((segment, index) => ({
    type: segment.type,
    km: segment.type === "rest" ? `R${(restIndex += 1)}` : segment.rep ?? index + 1,
    distanceKm: Number(segment.distanceKm) || 0,
    pace: segment.avgPace || "-",
    paceSeconds: parsePaceToSeconds(segment.avgPace || ""),
    hr: Math.round(Number(segment.avgHr) || 0)
  }));

  const rows = segments
    .filter((segment) =>
      isIntervalRun
        ? segment.type === "interval" || (includeRest && segment.type === "rest")
        : segment.type !== "rest"
    )
    .map((segment) => ({ ...segment }));

  if (isIntervalRun && includeWarmup) {
    const firstWarmup = segments.find((segment) => segment.type === "warmup");
    if (firstWarmup) rows.unshift({ ...firstWarmup, km: "WU" });
  }
  if (isIntervalRun && includeCooldown) {
    const firstCooldown = segments.find((segment) => segment.type === "cooldown");
    if (firstCooldown) rows.push({ ...firstCooldown, km: "CD" });
  }

  return rows;
}

function formatDistanceValue(distanceKm) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return "-";
  return distanceKm.toFixed(2);
}

function metricOrDash(value, unit) {
  if (value == null || value === "" || Number.isNaN(Number(value))) return "-";
  return `${Math.round(Number(value))} ${unit}`;
}

function buildRoutePath(points) {
  if (!Array.isArray(points) || points.length < 2) return null;
  const lats = points.map((point) => point.lat);
  const lons = points.map((point) => point.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const latSpan = maxLat - minLat || 1;
  const lonSpan = maxLon - minLon || 1;
  const padX = 8;
  const padY = 8;
  const width = 400 - padX * 2;
  const height = 180 - padY * 2;

  return points
    .map((point, index) => {
      const x = padX + ((point.lon - minLon) / lonSpan) * width;
      const y = padY + (1 - (point.lat - minLat) / latSpan) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
