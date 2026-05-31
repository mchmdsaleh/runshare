import { useState } from "react";
import { parseCsvFile } from "./lib/csvParser";
import { parseFitFile } from "./lib/fitParser";
import { normalizeActivity } from "./lib/normalizer";
import { parsePaceToSeconds, secondsToPace } from "./lib/formatUtils";
import Header from "./components/layout/Header";
import Stepper from "./components/layout/Stepper";
import UploadStep from "./components/upload/UploadStep";
import PreviewStep from "./components/preview/PreviewStep";
import ExportStep from "./components/export/ExportStep";

function App() {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [activity, setActivity] = useState(null);

  async function handleFileParse(file) {
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const isCsv = lowerName.endsWith(".csv");
    const isFit = lowerName.endsWith(".fit");
    if (!isCsv && !isFit) {
      setError("Only .csv and .fit files are supported.");
      setActivity(null);
      return;
    }

    setFileName(file.name);
    setStatus("Parsing file...");
    setError("");
    setActivity(null);

    try {
      if (isFit) {
        const normalized = await parseFitFile(file);
        setActivity(normalized);
      } else {
        const parsed = await parseCsvFile(file);
        if (parsed.errors.length > 0) {
          setStatus("Parse failed");
          setError(parsed.errors[0]?.message ?? "Unable to parse CSV.");
          return;
        }
        const normalized = normalizeActivity(parsed.rows, parsed.headerMap);
        setActivity(normalized);
      }
      setStep(2);
      setStatus("Parsed successfully");
    } catch (parseError) {
      setStatus("Parse failed");
      setError(parseError?.message ?? "Unable to parse file.");
    }
  }

  function handleSegmentChange(index, key, value) {
    setActivity((previous) => {
      if (!previous) return previous;
      const nextSegments = previous.segments.map((segment, rowIndex) =>
        rowIndex === index
          ? {
              ...segment,
              [key]: key === "distanceKm" ? Number(value) || 0 : value
            }
          : segment
      );
      return rebuildActivityFromSegments(previous, nextSegments);
    });
  }

  function handleSegmentDelete(index) {
    setActivity((previous) => {
      if (!previous) return previous;
      const nextSegments = previous.segments.filter((_, rowIndex) => rowIndex !== index);
      return rebuildActivityFromSegments(previous, nextSegments);
    });
  }

  function handleReset() {
    setStep(1);
    setStatus("Idle");
    setError("");
    setFileName("");
    setActivity(null);
  }

  return (
    <div className="app-shell">
      <Header />
      <Stepper currentStep={step} />

      <main className="step-stage" key={step}>
        {step === 1 ? (
          <UploadStep
            onFileParse={handleFileParse}
            status={status}
            error={error}
            fileName={fileName}
          />
        ) : null}

        {step === 2 && activity ? (
          <PreviewStep
            activity={activity}
            onSegmentChange={handleSegmentChange}
            onSegmentDelete={handleSegmentDelete}
            onConfirm={() => setStep(3)}
            onReset={handleReset}
          />
        ) : null}

        {step === 3 && activity ? (
          <ExportStep activity={activity} onBack={() => setStep(2)} />
        ) : null}
      </main>
    </div>
  );
}

export default App;

function rebuildActivityFromSegments(previous, segments) {
  let rep = 0;
  const normalizedSegments = segments.map((segment) => {
    if (segment.type === "interval") {
      rep += 1;
      return { ...segment, rep };
    }
    return { ...segment, rep: null };
  });

  const intervalRows = normalizedSegments.filter((segment) => segment.type === "interval");
  const paces = intervalRows
    .map((segment) => ({
      rep: segment.rep,
      sec: parsePaceToSeconds(segment.avgPace || "")
    }))
    .filter((row) => Number.isFinite(row.sec));
  const sorted = [...paces].sort((a, b) => a.sec - b.sec);
  const avgSec = paces.length ? paces.reduce((sum, row) => sum + row.sec, 0) / paces.length : null;

  return {
    ...previous,
    activityType: intervalRows.length ? "interval_run" : "run",
    segments: normalizedSegments,
    intervalSummary: {
      repCount: intervalRows.length,
      repDistanceKm: intervalRows[0]?.distanceKm ?? null,
      fastestRep: sorted[0] ? { rep: sorted[0].rep, avgPace: secondsToPace(sorted[0].sec) } : null,
      slowestRep: sorted[sorted.length - 1]
        ? { rep: sorted[sorted.length - 1].rep, avgPace: secondsToPace(sorted[sorted.length - 1].sec) }
        : null,
      avgRepPace: avgSec != null ? secondsToPace(avgSec) : null
    }
  };
}
