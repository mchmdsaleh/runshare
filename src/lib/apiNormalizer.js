import { secondsToPace } from "./formatUtils";

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function secondsToDuration(durationStr) {
  // durationStr is expected to be "HH:MM:SS" or similar from str(elapsed_time)
  if (!durationStr) return "-";
  return durationStr.replace(/^00:/, ""); // Remove leading 00: if present
}

function buildRoutePoints(records) {
  const points = records
    .map((record) => ({
      lat: toNumber(record.lat),
      lon: toNumber(record.lon)
    }))
    .filter((point) => point.lat != null && point.lon != null);

  if (points.length <= 180) return points;
  const step = Math.ceil(points.length / 180);
  return points.filter((_, index) => index % step === 0);
}

export function normalizeApiActivity(data) {
  const { activity, records } = data;
  
  // GarminDB doesn't easily provide structured workout segments in the basic 'activities' table
  // without more complex queries. For now, we'll treat it as a single segment.
  const summary = {
    distanceKm: toNumber(activity.distance),
    duration: secondsToDuration(activity.duration),
    avgPace: secondsToPace(1000 / (activity.avg_speed / 3.6)) || null, // avg_speed is in km/h
    avgHr: toNumber(activity.avg_hr),
    maxHr: null, // Need more data if wanted
    calories: null,
    elevationGain: null
  };

  const segments = [
    {
      type: "segment",
      label: null,
      rep: null,
      distanceKm: summary.distanceKm,
      duration: summary.duration,
      avgPace: summary.avgPace,
      avgHr: summary.avg_hr,
      maxHr: null
    }
  ];

  return {
    sourceFormat: "api",
    activityType: "run",
    summary,
    segments,
    intervalSummary: {
      repCount: 0,
      repDistanceKm: null,
      fastestRep: null,
      slowestRep: null,
      avgRepPace: null
    },
    routePoints: buildRoutePoints(records)
  };
}
