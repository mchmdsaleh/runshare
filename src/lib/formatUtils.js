export function parsePaceToSeconds(paceString) {
  if (!paceString || typeof paceString !== "string") return null;
  const cleaned = paceString.trim().replace(/\/km$/i, "");
  const match = cleaned.match(/^(\d{1,2}):(\d{1,2})(?:\.(\d+))?$/);
  if (!match) return null;
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || seconds >= 60) {
    return null;
  }
  return minutes * 60 + seconds;
}

export function secondsToPace(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return null;
  const rounded = Math.round(totalSeconds);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatPace(paceString) {
  const seconds = parsePaceToSeconds(paceString);
  return seconds == null ? "-" : `${secondsToPace(seconds)}/km`;
}

export function formatDuration(durationString) {
  if (!durationString || typeof durationString !== "string") return "-";
  const normalized = durationString.trim().replace(",", ".");
  const parts = normalized.split(":").map((part) => part.trim());
  if (parts.length < 2 || parts.length > 3) return durationString;

  const numericParts = parts.map((part) => Number(part));
  if (numericParts.some((num) => Number.isNaN(num))) return durationString;

  if (parts.length === 2) {
    const [m, s] = numericParts;
    return `${Math.floor(m)}:${String(Math.floor(s)).padStart(2, "0")}`;
  }

  const [h, m, s] = numericParts;
  return `${Math.floor(h)}:${String(Math.floor(m)).padStart(2, "0")}:${String(
    Math.floor(s)
  ).padStart(2, "0")}`;
}

export function formatDistance(km) {
  if (!Number.isFinite(km)) return "-";
  if (km >= 10) return `${km.toFixed(1)} km`;
  return `${km.toFixed(2)} km`;
}
