import {
  parsePaceToSeconds,
  secondsToPace,
  formatDuration
} from "./formatUtils";

function toNumber(value) {
  if (value == null || value === "") return null;
  const num = Number(String(value).replace(",", "."));
  return Number.isFinite(num) ? num : null;
}

function readField(row, headerMap, key) {
  const mappedHeader = headerMap[key];
  if (mappedHeader && row[mappedHeader] != null) return row[mappedHeader];
  return null;
}

function mapStepType(raw) {
  const value = String(raw ?? "").trim().toLowerCase();
  if (value.includes("warm")) return "warmup";
  if (value.includes("cool")) return "cooldown";
  if (value.includes("rest") || value.includes("recover")) return "rest";
  if (value.includes("run")) return "interval";
  return "segment";
}

function buildIntervalSummary(intervalSegments) {
  if (!intervalSegments.length) {
    return {
      repCount: 0,
      repDistanceKm: null,
      fastestRep: null,
      slowestRep: null,
      avgRepPace: null
    };
  }

  const paces = intervalSegments
    .map((segment) => ({
      rep: segment.rep,
      paceSeconds: parsePaceToSeconds(segment.avgPace)
    }))
    .filter((entry) => entry.paceSeconds != null);

  const repDistanceKm = intervalSegments[0].distanceKm ?? null;
  if (!paces.length) {
    return {
      repCount: intervalSegments.length,
      repDistanceKm,
      fastestRep: null,
      slowestRep: null,
      avgRepPace: null
    };
  }

  const sorted = [...paces].sort((a, b) => a.paceSeconds - b.paceSeconds);
  const avg = paces.reduce((sum, row) => sum + row.paceSeconds, 0) / paces.length;

  return {
    repCount: intervalSegments.length,
    repDistanceKm,
    fastestRep: {
      rep: sorted[0].rep,
      avgPace: secondsToPace(sorted[0].paceSeconds)
    },
    slowestRep: {
      rep: sorted[sorted.length - 1].rep,
      avgPace: secondsToPace(sorted[sorted.length - 1].paceSeconds)
    },
    avgRepPace: secondsToPace(avg)
  };
}

export function normalizeActivity(rows, headerMap) {
  let intervalRep = 0;
  const segments = [];
  let summaryRow = null;

  for (const row of rows) {
    const intervalValue = String(readField(row, headerMap, "interval") ?? "")
      .trim()
      .toLowerCase();
    const stepType = mapStepType(readField(row, headerMap, "stepType"));

    if (intervalValue === "summary") {
      summaryRow = row;
      continue;
    }

    const segment = {
      type: stepType,
      label: null,
      rep: null,
      distanceKm: toNumber(readField(row, headerMap, "distanceKm")),
      duration: formatDuration(String(readField(row, headerMap, "duration") ?? "")),
      avgPace: readField(row, headerMap, "avgPace") || null,
      avgHr: toNumber(readField(row, headerMap, "avgHr")),
      maxHr: toNumber(readField(row, headerMap, "maxHr"))
    };

    if (stepType === "interval") {
      intervalRep += 1;
      segment.rep = intervalRep;
    } else if (stepType === "warmup") {
      segment.label = "Warm Up";
    } else if (stepType === "cooldown") {
      segment.label = "Cool Down";
    }

    segments.push(segment);
  }

  const summarySource = summaryRow ?? rows[rows.length - 1] ?? {};
  const summary = {
    distanceKm: toNumber(readField(summarySource, headerMap, "distanceKm")),
    duration: formatDuration(String(readField(summarySource, headerMap, "duration") ?? "")),
    avgPace: readField(summarySource, headerMap, "avgPace") || null,
    avgHr: toNumber(readField(summarySource, headerMap, "avgHr")),
    maxHr: toNumber(readField(summarySource, headerMap, "maxHr")),
    calories: toNumber(readField(summarySource, headerMap, "calories")),
    elevationGain: toNumber(readField(summarySource, headerMap, "elevationGain"))
  };

  const intervalSegments = segments.filter((segment) => segment.type === "interval");
  const intervalSummary = buildIntervalSummary(intervalSegments);

  return {
    sourceFormat: "csv",
    activityType: intervalSegments.length > 0 ? "interval_run" : "run",
    summary,
    segments,
    intervalSummary
  };
}
