import { formatDistance, formatPace } from "../../lib/formatUtils";

export default function MinimalOverlay({ activity }) {
  const timeValue = compactDuration(activity.summary.duration || "-");
  const routePath = buildRoutePath(activity.routePoints);

  return (
    <div className="card-template minimal-overlay">
      <div className="story-content">
        <div className="stacked-stats">
          <div className="stack-item">
            <p>Distance</p>
            <strong>{formatDistance(activity.summary.distanceKm ?? 0)}</strong>
          </div>
          <div className="stack-item">
            <p>Pace</p>
            <strong>{formatPace(activity.summary.avgPace || "")}</strong>
          </div>
          <div className="stack-item">
            <p>Time</p>
            <strong>{timeValue}</strong>
          </div>
        </div>

        <div className="route-line" aria-hidden="true">
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

        <div className="wordmark strava-wordmark">STRAVA</div>
      </div>
    </div>
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
