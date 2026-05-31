import FitParser from "fit-file-parser";
import { secondsToPace } from "./formatUtils";

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function firstFinite(...values) {
  for (const value of values) {
    const n = toNumber(value);
    if (n != null) return n;
  }
  return null;
}

function enumText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.toLowerCase();
  if (typeof value === "number") return String(value).toLowerCase();
  if (typeof value === "object") {
    if (typeof value.value === "string") return value.value.toLowerCase();
    if (typeof value.name === "string") return value.name.toLowerCase();
  }
  return String(value).toLowerCase();
}

function toKm(distanceMeters) {
  const value = toNumber(distanceMeters);
  if (value == null) return null;
  return value / 1000;
}

function paceFromSpeed(speedMps, distanceMeters, elapsedSeconds) {
  let speed = toNumber(speedMps);
  if (!speed || speed <= 0) {
    const distance = toNumber(distanceMeters);
    const elapsed = toNumber(elapsedSeconds);
    if (distance && elapsed && elapsed > 0) {
      speed = distance / elapsed;
    }
  }
  if (!speed || speed <= 0) return null;
  const secondsPerKm = 1000 / speed;
  return secondsToPace(secondsPerKm);
}

function getStepType(lap, index, total, structuredWorkout) {
  const intensity = enumText(lap?.intensity);
  const trigger = enumText(lap?.lap_trigger);
  const subSport = enumText(lap?.sub_sport);
  const sport = enumText(lap?.sport);

  if (!structuredWorkout) {
    return "segment";
  }

  if (intensity.includes("warmup")) return "warmup";
  if (intensity.includes("cooldown")) return "cooldown";
  if (intensity.includes("rest") || intensity.includes("recovery")) return "rest";
  if (subSport.includes("recovery")) return "rest";
  if (sport.includes("recovery")) return "rest";

  // Common FIT interval pattern fallback:
  // rest laps are often time-triggered between distance-triggered active reps.
  if (trigger === "time" && intensity.includes("active")) return "rest";

  if (index === 0) return "warmup";
  if (index === total - 1) return "cooldown";
  return "interval";
}

function isStructuredWorkout(laps) {
  if (!Array.isArray(laps) || !laps.length) return false;
  const intensities = laps.map((lap) => enumText(lap?.intensity));
  const triggers = laps.map((lap) => enumText(lap?.lap_trigger));

  const hasWorkoutIntensity = intensities.some(
    (value) =>
      value.includes("rest") ||
      value.includes("recovery") ||
      value.includes("warmup") ||
      value.includes("cooldown")
  );

  const hasLikelyRestTrigger = triggers.some((value) => value === "time");
  const hasMixedIntensity = new Set(intensities.filter(Boolean)).size > 1;

  return hasWorkoutIntensity || (hasLikelyRestTrigger && hasMixedIntensity);
}

function summarizeIntervals(intervals) {
  if (!intervals.length) {
    return {
      repCount: 0,
      repDistanceKm: null,
      fastestRep: null,
      slowestRep: null,
      avgRepPace: null
    };
  }

  const paced = intervals
    .map((segment) => ({
      rep: segment.rep,
      pace: segment.avgPace
    }))
    .filter((row) => row.pace);

  if (!paced.length) {
    return {
      repCount: intervals.length,
      repDistanceKm: intervals[0].distanceKm ?? null,
      fastestRep: null,
      slowestRep: null,
      avgRepPace: null
    };
  }

  const paceToSeconds = (pace) => {
    const [m, s] = String(pace).split(":").map(Number);
    if (!Number.isFinite(m) || !Number.isFinite(s)) return null;
    return m * 60 + s;
  };

  const secondsRows = paced
    .map((row) => ({ ...row, sec: paceToSeconds(row.pace) }))
    .filter((row) => Number.isFinite(row.sec));
  const sorted = [...secondsRows].sort((a, b) => a.sec - b.sec);
  const avgSec = secondsRows.reduce((sum, row) => sum + row.sec, 0) / secondsRows.length;

  return {
    repCount: intervals.length,
    repDistanceKm: intervals[0].distanceKm ?? null,
    fastestRep: { rep: sorted[0].rep, avgPace: sorted[0].pace },
    slowestRep: { rep: sorted[sorted.length - 1].rep, avgPace: sorted[sorted.length - 1].pace },
    avgRepPace: secondsToPace(avgSec)
  };
}

function secondsToDuration(totalSeconds) {
  const sec = toNumber(totalSeconds);
  if (!Number.isFinite(sec) || sec < 0) return "-";
  const rounded = Math.round(sec);
  const h = Math.floor(rounded / 3600);
  const m = Math.floor((rounded % 3600) / 60);
  const s = rounded % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function semicirclesToDegrees(value) {
  const n = toNumber(value);
  if (n == null) return null;
  return n * (180 / 2147483648);
}

function buildRoutePoints(records) {
  const points = records
    .map((record) => ({
      lat: semicirclesToDegrees(firstFinite(record.position_lat, record.enhanced_position_lat)),
      lon: semicirclesToDegrees(firstFinite(record.position_long, record.enhanced_position_long))
    }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lon));

  if (points.length <= 180) return points;
  const step = Math.ceil(points.length / 180);
  return points.filter((_, index) => index % step === 0);
}

export function parseFitFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const parser = new FitParser({
        force: true,
        speedUnit: "m/s",
        lengthUnit: "m",
        temperatureUnit: "celsius",
        elapsedRecordField: true,
        mode: "list"
      });

      parser.parse(reader.result, (error, data) => {
        if (error) {
          reject(error);
          return;
        }

        const laps = Array.isArray(data?.laps) ? data.laps : [];
        const records = Array.isArray(data?.records) ? data.records : [];
        const session = Array.isArray(data?.sessions) ? data.sessions[0] || {} : {};
        const structuredWorkout = isStructuredWorkout(laps);
        let rep = 0;

        const segments = laps.map((lap, index) => {
          const type = getStepType(lap, index, laps.length, structuredWorkout);
          if (type === "interval") rep += 1;
          const elapsed = firstFinite(lap.total_elapsed_time, lap.total_timer_time);
          const distance = firstFinite(lap.total_distance, lap.distance);
          const avgSpeed = firstFinite(lap.avg_speed, lap.enhanced_avg_speed);
          return {
            type,
            label: type === "warmup" ? "Warm Up" : type === "cooldown" ? "Cool Down" : null,
            rep: type === "interval" ? rep : null,
            distanceKm: toKm(distance),
            duration: secondsToDuration(elapsed),
            avgPace: paceFromSpeed(avgSpeed, distance, elapsed),
            avgHr: firstFinite(lap.avg_heart_rate, lap.heart_rate),
            maxHr: toNumber(lap.max_heart_rate)
          };
        });

        const sessionDistance = firstFinite(session.total_distance, session.distance);
        const sessionElapsed = firstFinite(session.total_elapsed_time, session.total_timer_time);
        const sessionSpeed = firstFinite(session.avg_speed, session.enhanced_avg_speed);
        const summary = {
          distanceKm: toKm(sessionDistance),
          duration: secondsToDuration(sessionElapsed),
          avgPace: paceFromSpeed(sessionSpeed, sessionDistance, sessionElapsed),
          avgHr: firstFinite(session.avg_heart_rate, session.heart_rate),
          maxHr: toNumber(session.max_heart_rate),
          calories: toNumber(session.total_calories),
          elevationGain: null
        };

        const intervals = segments.filter((segment) => segment.type === "interval");

        resolve({
          sourceFormat: "fit",
          activityType: intervals.length ? "interval_run" : "run",
          summary,
          segments,
          intervalSummary: summarizeIntervals(intervals),
          routePoints: buildRoutePoints(records)
        });
      });
    };
    reader.onerror = () => reject(new Error("Failed to read FIT file."));
    reader.readAsArrayBuffer(file);
  });
}
