import { Copy, Download, ImagePlus, LoaderCircle } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import MinimalOverlay from "../templates/MinimalOverlay";
import IntervalBreakdown from "../templates/IntervalBreakdown";
import ClassicSummary from "../templates/ClassicSummary";
import { generateText } from "../../lib/textGenerator";
import { copyCardImageToClipboard, exportCardAsPng } from "../../lib/exportImage";

const TEMPLATES = [
  { id: "minimal", label: "Minimal Overlay" },
  { id: "interval", label: "Split" },
  { id: "classic", label: "Classic Summary" }
];

const TEXT_STYLES = [
  { id: "clean", label: "Clean" },
  { id: "coach", label: "Coach Mode" },
  { id: "social", label: "Social Caption" }
];

export default function ExportStep({ activity, onBack }) {
  const [selectedTemplate, setSelectedTemplate] = useState("minimal");
  const [classicTitle, setClassicTitle] = useState("Run");
  const [textStyle, setTextStyle] = useState("clean");
  const [sizePreset, setSizePreset] = useState("story");
  const [includeWarmup, setIncludeWarmup] = useState(false);
  const [includeCooldown, setIncludeCooldown] = useState(false);
  const [includeRest, setIncludeRest] = useState(false);
  const [customWidth, setCustomWidth] = useState(1080);
  const [customHeight, setCustomHeight] = useState(1920);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const [exportError, setExportError] = useState("");
  const cardRef = useRef(null);

  const textOutput = useMemo(() => generateText(activity, textStyle), [activity, textStyle]);
  const isIntervalRun = activity?.activityType === "interval_run";
  const canCopyImage = useMemo(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.ClipboardItem && navigator?.clipboard?.write);
  }, []);

  function renderTemplate() {
    if (selectedTemplate === "interval") {
      return (
        <IntervalBreakdown
          activity={activity}
          includeWarmup={includeWarmup}
          includeCooldown={includeCooldown}
          includeRest={includeRest}
        />
      );
    }
    if (selectedTemplate === "classic") {
      return (
        <ClassicSummary
          activity={activity}
          includeWarmup={includeWarmup}
          includeCooldown={includeCooldown}
          includeRest={includeRest}
          title={classicTitle}
        />
      );
    }
    return <MinimalOverlay activity={activity} />;
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(textOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  async function handleCopyImage() {
    if (!cardRef.current) return;
    if (!canCopyImage) {
      await handleDownload();
      return;
    }
    setBusy(true);
    setExportError("");
    try {
      await copyCardImageToClipboard(cardRef.current, {
        templateId: selectedTemplate,
        sizePreset,
        customWidth,
        customHeight
      });
      setImageCopied(true);
      setTimeout(() => setImageCopied(false), 1400);
    } catch (error) {
      setExportError(error?.message || "Failed to copy image.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload() {
    if (!cardRef.current) return;
    setBusy(true);
    setExportError("");
    try {
      await exportCardAsPng(cardRef.current, {
        templateId: selectedTemplate,
        sizePreset,
        customWidth,
        customHeight
      });
    } catch (error) {
      setExportError(error?.message || "Failed to download image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel summary">
      <h2 className="section-title">Export</h2>

      <div className="export-layout">
        <div>
          <div className="template-selector">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                className={`template-chip ${selectedTemplate === template.id ? "active" : ""}`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                {template.label}
              </button>
            ))}
          </div>
          <div className="preview-surface">
            <div ref={cardRef}>{renderTemplate()}</div>
          </div>
        </div>

        <div className="export-controls">
          <p className="stat-label">Text Style</p>
          <div className="template-selector compact">
            {TEXT_STYLES.map((style) => (
              <button
                key={style.id}
                type="button"
                className={`template-chip ${textStyle === style.id ? "active" : ""}`}
                onClick={() => setTextStyle(style.id)}
              >
                {style.label}
              </button>
            ))}
          </div>

          <p className="stat-label">Image Size</p>
          <div className="template-selector compact">
            <button
              type="button"
              className={`template-chip ${sizePreset === "story" ? "active" : ""}`}
              onClick={() => setSizePreset("story")}
            >
              Story 1080x1920
            </button>
            <button
              type="button"
              className={`template-chip ${sizePreset === "square" ? "active" : ""}`}
              onClick={() => setSizePreset("square")}
            >
              Square 1080x1080
            </button>
            <button
              type="button"
              className={`template-chip ${sizePreset === "custom" ? "active" : ""}`}
              onClick={() => setSizePreset("custom")}
            >
              Custom
            </button>
          </div>
          {sizePreset === "custom" ? (
            <div className="custom-size">
              <label>
                W
                <input
                  type="number"
                  value={customWidth}
                  onChange={(event) => setCustomWidth(event.target.value)}
                  min="300"
                />
              </label>
              <label>
                H
                <input
                  type="number"
                  value={customHeight}
                  onChange={(event) => setCustomHeight(event.target.value)}
                  min="300"
                />
              </label>
            </div>
          ) : null}

          {selectedTemplate === "classic" ? (
            <>
              <p className="stat-label">Classic Title</p>
              <input
                className="control-input"
                type="text"
                value={classicTitle}
                onChange={(event) => setClassicTitle(event.target.value)}
                maxLength={24}
                placeholder="Run"
              />
            </>
          ) : null}

          {isIntervalRun && (selectedTemplate === "interval" || selectedTemplate === "classic") ? (
            <>
              <p className="stat-label">Split Rows</p>
              <div className="option-list">
                <label className="toggle-item">
                  <input
                    className="toggle-input"
                    type="checkbox"
                    checked={includeWarmup}
                    onChange={(event) => setIncludeWarmup(event.target.checked)}
                  />
                  <span className="toggle-track" aria-hidden="true">
                    <span className="toggle-thumb" />
                  </span>
                  <span className="toggle-label">Include Warm Up</span>
                </label>
                <label className="toggle-item">
                  <input
                    className="toggle-input"
                    type="checkbox"
                    checked={includeCooldown}
                    onChange={(event) => setIncludeCooldown(event.target.checked)}
                  />
                  <span className="toggle-track" aria-hidden="true">
                    <span className="toggle-thumb" />
                  </span>
                  <span className="toggle-label">Include Cool Down</span>
                </label>
                <label className="toggle-item">
                  <input
                    className="toggle-input"
                    type="checkbox"
                    checked={includeRest}
                    onChange={(event) => setIncludeRest(event.target.checked)}
                  />
                  <span className="toggle-track" aria-hidden="true">
                    <span className="toggle-thumb" />
                  </span>
                  <span className="toggle-label">Include Rest</span>
                </label>
              </div>
            </>
          ) : null}

          <p className="stat-label">Text Preview</p>
          <pre className="text-preview">{textOutput}</pre>
          {exportError ? <p className="status error">{exportError}</p> : null}

          <div className="preview-actions">
            <button className="button ghost" type="button" onClick={onBack}>
              Back to review
            </button>
            <button className="button ghost" type="button" onClick={handleCopy}>
              <Copy size={14} />
              {copied ? "Copied" : "Copy text"}
            </button>
            <button className="button ghost" type="button" onClick={handleCopyImage} disabled={busy}>
              {busy ? <LoaderCircle size={14} className="spin" /> : <ImagePlus size={14} />}
              {imageCopied ? "Copied" : canCopyImage ? "Copy" : "Download"}
            </button>
            <button className="button" type="button" onClick={handleDownload} disabled={busy}>
              {busy ? <LoaderCircle size={14} className="spin" /> : <Download size={14} />}
              Download
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
