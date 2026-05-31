import Papa from "papaparse";

const COLUMN_ALIASES = {
  stepType: ["step type", "step_type", "type"],
  interval: ["interval"],
  distanceKm: ["distance", "distance km", "distance (km)"],
  duration: ["time", "duration", "moving time"],
  avgPace: ["avg pace", "pace", "average pace"],
  avgHr: ["avg hr", "average hr", "average heart rate"],
  maxHr: ["max hr", "maximum hr", "max heart rate"],
  calories: ["calories"],
  elevationGain: ["elevation gain", "total ascent"]
};

function normalizeHeader(header) {
  return String(header ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function detectHeaderMap(headers) {
  const normalized = headers.map((h) => normalizeHeader(h));
  const map = {};

  Object.entries(COLUMN_ALIASES).forEach(([target, aliases]) => {
    const idx = normalized.findIndex((candidate) =>
      aliases.some((alias) => candidate.includes(alias))
    );
    if (idx >= 0) map[target] = headers[idx];
  });

  return map;
}

function cleanRows(rows) {
  return rows.filter((row) =>
    Object.values(row).some((value) => String(value ?? "").trim().length > 0)
  );
}

export function parseCsvFile(file) {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const headers = result.meta?.fields ?? [];
        const rows = cleanRows(result.data ?? []);
        const headerMap = detectHeaderMap(headers);
        resolve({
          rows,
          headers,
          headerMap,
          errors: result.errors ?? []
        });
      },
      error: (error) => {
        resolve({
          rows: [],
          headers: [],
          headerMap: {},
          errors: [error]
        });
      }
    });
  });
}
