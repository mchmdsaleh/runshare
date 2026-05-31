import { Crown, PencilLine, Trash2 } from "lucide-react";
import { parsePaceToSeconds } from "../../lib/formatUtils";

const TYPE_CLASS = {
  warmup: "badge warmup",
  interval: "badge interval",
  rest: "badge rest",
  cooldown: "badge cooldown",
  segment: "badge"
};

export default function SegmentTable({ activityType, segments, onSegmentChange, onSegmentDelete }) {
  const intervalRows = segments.filter((segment) => segment.type === "interval");
  const fastest = intervalRows
    .map((segment) => ({
      rep: segment.rep,
      pace: parsePaceToSeconds(segment.avgPace || "")
    }))
    .filter((entry) => entry.pace != null)
    .sort((a, b) => a.pace - b.pace)[0];

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Rep</th>
            <th>Distance (km)</th>
            <th>Duration</th>
            <th>Pace</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {segments.map((segment, index) => {
            const isFastest = fastest && segment.rep === fastest.rep && segment.type === "interval";
            return (
              <tr key={`${segment.type}-${index}`} className={isFastest ? "row-fastest" : ""}>
                <td>
                  <span className={TYPE_CLASS[segment.type] || TYPE_CLASS.segment}>
                    {displayTypeLabel(segment, activityType)}
                  </span>
                </td>
                <td>{segment.rep ?? "-"}</td>
                <td>
                  <InlineField
                    value={segment.distanceKm ?? ""}
                    onChange={(value) => onSegmentChange(index, "distanceKm", value)}
                  />
                </td>
                <td>
                  <InlineField
                    value={segment.duration ?? ""}
                    onChange={(value) => onSegmentChange(index, "duration", value)}
                  />
                </td>
                <td>
                  <InlineField
                    value={segment.avgPace ?? ""}
                    onChange={(value) => onSegmentChange(index, "avgPace", value)}
                  />
                </td>
                <td>{isFastest ? <Crown size={14} /> : null}</td>
                <td>
                  <button
                    type="button"
                    className="icon-button danger"
                    onClick={() => onSegmentDelete(index)}
                    aria-label="Delete row"
                    title="Delete row"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function displayTypeLabel(segment, activityType) {
  if (segment.label) return segment.label;
  if (segment.type === "segment") return "Run";
  if (segment.type === "interval" && activityType !== "interval_run") return "Run";
  return segment.type;
}

function InlineField({ value, onChange }) {
  return (
    <label className="inline-field">
      <input value={value} onChange={(event) => onChange(event.target.value)} />
      <PencilLine size={12} />
    </label>
  );
}
