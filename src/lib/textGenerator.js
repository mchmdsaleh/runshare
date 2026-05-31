import { formatDistance, formatPace } from "./formatUtils";

function intervalLine(activity) {
  const summary = activity.intervalSummary;
  if (!summary?.repCount) return "Steady run day.";
  const fastest = summary.fastestRep
    ? `Fastest rep: #${summary.fastestRep.rep} (${summary.fastestRep.avgPace}/km).`
    : "";
  const avg = summary.avgRepPace ? `Avg rep pace: ${summary.avgRepPace}/km.` : "";
  return `${summary.repCount} reps done. ${avg} ${fastest}`.trim();
}

export function generateText(activity, style = "clean") {
  const distance = formatDistance(activity.summary.distanceKm ?? 0);
  const duration = activity.summary.duration || "-";
  const pace = formatPace(activity.summary.avgPace || "");

  if (style === "coach") {
    return [
      `Workout: ${distance} in ${duration} (${pace})`,
      intervalLine(activity),
      `Avg HR: ${activity.summary.avgHr || "-"} bpm, Max HR: ${activity.summary.maxHr || "-"} bpm`
    ].join("\n");
  }

  if (style === "social") {
    return `${distance} today in ${duration}. Held ${pace} overall and finished strong. ${intervalLine(activity)} #running #runshare`;
  }

  return `${distance} • ${duration} • ${pace}`;
}
