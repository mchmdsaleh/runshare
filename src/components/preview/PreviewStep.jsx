import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatDistance, formatPace } from "../../lib/formatUtils";
import SegmentTable from "./SegmentTable";

export default function PreviewStep({
  activity,
  onSegmentChange,
  onSegmentDelete,
  onConfirm,
  onReset
}) {
  const hasIntervals = activity.intervalSummary.repCount > 0;

  return (
    <section className="panel summary">
      <div className="preview-head">
        <h2 className="section-title">Review Parsed Activity</h2>
        <div className={`notice ${hasIntervals ? "ok" : "warn"}`}>
          {hasIntervals ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          {hasIntervals ? "Intervals detected" : "No intervals detected"}
        </div>
      </div>

      <div className="grid">
        <article className="stat">
          <p className="stat-label">Activity Type</p>
          <p className="stat-value">{activity.activityType}</p>
        </article>
        <article className="stat">
          <p className="stat-label">Distance</p>
          <p className="stat-value">{formatDistance(activity.summary.distanceKm ?? 0)}</p>
        </article>
        <article className="stat">
          <p className="stat-label">Duration</p>
          <p className="stat-value">{activity.summary.duration || "-"}</p>
        </article>
        <article className="stat">
          <p className="stat-label">Average Pace</p>
          <p className="stat-value">{formatPace(activity.summary.avgPace || "")}</p>
        </article>
      </div>

      <SegmentTable
        activityType={activity.activityType}
        segments={activity.segments}
        onSegmentChange={onSegmentChange}
        onSegmentDelete={onSegmentDelete}
      />

      <div className="preview-actions">
        <button className="button ghost" type="button" onClick={onReset}>
          Re-upload
        </button>
        <button className="button" type="button" onClick={onConfirm}>
          Looks good
        </button>
      </div>
    </section>
  );
}
