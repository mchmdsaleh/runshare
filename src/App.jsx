import { useState } from "react";
import { parseCsvFile } from "./lib/csvParser";
import { parseFitFile } from "./lib/fitParser";
import { extractFirstFitFromZip } from "./lib/zipFitParser";
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
    const isZip = lowerName.endsWith(".zip");
    if (!isCsv && !isFit && !isZip) {
      setError("Only .csv, .fit, and .zip files are supported.");
      setActivity(null);
      return;
    }

    setFileName(file.name);
    setStatus("Parsing file...");
    setError("");
    setActivity(null);

    try {
      if (isFit || isZip) {
        const fitFile = isZip ? await extractFirstFitFromZip(file) : file;
        const normalized = await parseFitFile(fitFile);
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

  function handleActivityTypeChange(nextType) {
    setActivity((previous) => {
      if (!previous) return previous;
      const forceInterval = nextType === "interval_run";
      const nextSegments = previous.segments.map((segment) => {
        if (forceInterval && segment.type === "segment") {
          return { ...segment, type: "interval" };
        }
        return segment;
      });
      return rebuildActivityFromSegments(previous, nextSegments, nextType);
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
            onActivityTypeChange={handleActivityTypeChange}
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

function rebuildActivityFromSegments(previous, segments, forcedActivityType) {
  let rep = 0;
  const normalizedSegments = segments.map((segment) => {
    const typeNormalized = normalizeType(segment.type);
    const withType = {
      ...segment,
      type: typeNormalized,
      label:
        typeNormalized === "warmup"
          ? "Warm Up"
          : typeNormalized === "cooldown"
            ? "Cool Down"
            : null
    };
    if (typeNormalized === "interval") {
      rep += 1;
      return { ...withType, rep };
    }
    return { ...withType, rep: null };
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
    activityType:
      forcedActivityType || previous.explicitActivityType || (intervalRows.length ? "interval_run" : "run"),
    explicitActivityType: forcedActivityType || previous.explicitActivityType || null,
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

function normalizeType(type) {
  if (type === "interval" || type === "rest" || type === "warmup" || type === "cooldown") return type;
  return "segment";
}
