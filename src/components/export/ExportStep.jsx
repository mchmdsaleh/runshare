import { Copy, Download, ImagePlus, LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import MinimalOverlay from "../templates/MinimalOverlay";
import IntervalBreakdown from "../templates/IntervalBreakdown";
import ClassicSummary from "../templates/ClassicSummary";
import CustomCanvas from "../templates/CustomCanvas";
import { generateText } from "../../lib/textGenerator";
import { copyCardImageToClipboard, exportCardAsPng } from "../../lib/exportImage";

const TEMPLATES = [
  { id: "minimal", label: "Minimal Overlay" },
  { id: "interval", label: "Split" },
  { id: "classic", label: "Classic Summary" },
  { id: "custom", label: "Custom" }
];

const TEXT_STYLES = [
  { id: "clean", label: "Clean" },
  { id: "coach", label: "Coach Mode" },
  { id: "social", label: "Social Caption" }
];

const STATS_FIELD_OPTIONS = [
  { id: "distance", label: "Distance" },
  { id: "pace", label: "Pace" },
  { id: "time", label: "Time" },
  { id: "calories", label: "Cal" },
  { id: "avgHr", label: "Avg HR" },
  { id: "maxHr", label: "Max HR" }
];

const CUSTOM_LAYER_LIBRARY = {
  title: { type: "title", label: "Title", x: 12, y: 12, width: 142, height: 38, visible: true },
  stats: {
    type: "stats",
    label: "Stats",
    x: 12,
    y: 56,
    width: 194,
    height: 66,
    visible: true,
    statsFields: ["distance", "pace", "time"]
  },
  map: { type: "map", label: "Map", x: 12, y: 198, width: 210, height: 76, visible: true },
  splits: { type: "splits", label: "Splits", x: 12, y: 280, width: 230, height: 168, visible: true },
  logo: { type: "logo", label: "Logo", x: 78, y: 460, width: 96, height: 30, visible: true }
};

const DEFAULT_CUSTOM_LAYERS = [
  createCustomLayer("title"),
  createCustomLayer("stats"),
  createCustomLayer("splits"),
  createCustomLayer("logo")
];

export default function ExportStep({ activity, onBack }) {
  const [selectedTemplate, setSelectedTemplate] = useState("minimal");
  const [classicTitle, setClassicTitle] = useState("Run");
  const [textStyle, setTextStyle] = useState("clean");
  const [sizePreset, setSizePreset] = useState("story");
  const [includeWarmup, setIncludeWarmup] = useState(false);
  const [includeCooldown, setIncludeCooldown] = useState(false);
  const [includeRest, setIncludeRest] = useState(false);
  const [hideHr, setHideHr] = useState(false);
  const [customLayers, setCustomLayers] = useState(DEFAULT_CUSTOM_LAYERS);
  const [selectedLayerId, setSelectedLayerId] = useState(DEFAULT_CUSTOM_LAYERS[0].id);
  const [customWidth, setCustomWidth] = useState(1080);
  const [customHeight, setCustomHeight] = useState(1920);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const [exportError, setExportError] = useState("");
  const [configPanelPos, setConfigPanelPos] = useState({ x: 24, y: 24 });
  const [configDrag, setConfigDrag] = useState(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const cardRef = useRef(null);
  const customStageRef = useRef(null);
  const floatingPanelRef = useRef(null);

  const textOutput = useMemo(() => generateText(activity, textStyle), [activity, textStyle]);
  const isIntervalRun = activity?.activityType === "interval_run";

  useEffect(() => {
    function syncViewport() {
      setIsMobileViewport(window.innerWidth <= 760);
    }
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    if (!configDrag) return;

    function onPointerMove(event) {
      const dx = event.clientX - configDrag.startX;
      const dy = event.clientY - configDrag.startY;
      const panelRect = floatingPanelRef.current?.getBoundingClientRect();
      const panelWidth = panelRect?.width || 420;
      const panelHeight = panelRect?.height || 520;
      const minVisible = 120;

      const rawX = configDrag.originX + dx;
      const rawY = configDrag.originY + dy;

      const minGlobalX = -panelWidth + minVisible;
      const maxGlobalX = window.innerWidth - minVisible;
      const minGlobalY = -panelHeight + minVisible;
      const maxGlobalY = window.innerHeight - minVisible;

      const stageLeft = configDrag.stageLeft;
      const stageTop = configDrag.stageTop;
      const nextX = clamp(rawX + stageLeft, minGlobalX, maxGlobalX) - stageLeft;
      const nextY = clamp(rawY + stageTop, minGlobalY, maxGlobalY) - stageTop;

      setConfigPanelPos({
        x: nextX,
        y: nextY
      });
    }

    function onPointerUp() {
      setConfigDrag(null);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [configDrag]);

  function renderTemplate() {
    if (selectedTemplate === "custom") {
      return (
        <CustomCanvas
          activity={activity}
          layers={customLayers}
          selectedLayerId={selectedLayerId}
          onSelectLayer={setSelectedLayerId}
          onUpdateLayer={handleLayerUpdate}
          onRemoveLayer={removeSelectedLayer}
          includeWarmup={includeWarmup}
          includeCooldown={includeCooldown}
          includeRest={includeRest}
          showHr={!hideHr}
          title={classicTitle}
        />
      );
    }
    if (selectedTemplate === "interval") {
      return (
        <IntervalBreakdown
          activity={activity}
          includeWarmup={includeWarmup}
          includeCooldown={includeCooldown}
          includeRest={includeRest}
          showHr={!hideHr}
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
          showHr={!hideHr}
          title={classicTitle}
        />
      );
    }
    return <MinimalOverlay activity={activity} />;
  }

  function handleLayerUpdate(layerId, patch) {
    setCustomLayers((previous) =>
      previous.map((layer) => (layer.id === layerId ? { ...layer, ...patch } : layer))
    );
  }

  const selectedLayer = customLayers.find((layer) => layer.id === selectedLayerId) || null;
  const availableLayerTypes = Object.keys(CUSTOM_LAYER_LIBRARY);

  async function handleCopy() {
    await navigator.clipboard.writeText(textOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  async function handleCopyImage() {
    if (!cardRef.current) return;
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
      if (shouldFallbackToDownload(error)) {
        try {
          await exportCardAsPng(cardRef.current, {
            templateId: selectedTemplate,
            sizePreset,
            customWidth,
            customHeight
          });
          return;
        } catch (downloadError) {
          setExportError(downloadError?.message || "Failed to download image.");
          return;
        }
      }
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

  function startConfigPanelDrag(event) {
    if (isMobileViewport) return;
    const stage = customStageRef.current;
    if (!stage) return;
    const stageRect = stage.getBoundingClientRect();
    setConfigDrag({
      startX: event.clientX,
      startY: event.clientY,
      originX: configPanelPos.x,
      originY: configPanelPos.y,
      stageLeft: stageRect.left,
      stageTop: stageRect.top
    });
  }

  function addCustomLayer(type) {
    const base = CUSTOM_LAYER_LIBRARY[type];
    if (!base) return;
    const layer = createCustomLayer(type);
    setCustomLayers((previous) => [...previous, layer]);
    setSelectedLayerId(layer.id);
  }

  function removeSelectedLayer() {
    if (!selectedLayer) return;
    setCustomLayers((previous) => {
      const next = previous.filter((layer) => layer.id !== selectedLayer.id);
      if (next.length) setSelectedLayerId(next[0].id);
      return next;
    });
  }

  return (
    <section className="panel summary">
      <h2 className="section-title">Export</h2>

      {selectedTemplate === "custom" ? (
        <>
        <div ref={customStageRef} className="custom-fullstage">
          <div className="custom-stage-canvas">
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
            <div className="preview-surface custom-preview-surface">
              <div ref={cardRef}>{renderTemplate()}</div>
            </div>
          </div>

          {!isMobileViewport ? (
            <div
              ref={floatingPanelRef}
              className="export-controls floating-export-controls"
              style={{ transform: `translate(${configPanelPos.x}px, ${configPanelPos.y}px)` }}
            >
              <div className="floating-controls-handle" onPointerDown={startConfigPanelDrag}>
                Drag Panel
              </div>
              {renderControls()}
            </div>
          ) : null}
        </div>
        {isMobileViewport ? <div className="export-controls mobile-controls">{renderControls()}</div> : null}
        </>
      ) : (
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
            {renderControls()}
          </div>
        </div>
      )}
    </section>
  );

  function renderControls() {
    return (
      <>
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

          {selectedTemplate === "classic" || selectedTemplate === "custom" ? (
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

          {isIntervalRun &&
          (selectedTemplate === "interval" ||
            selectedTemplate === "classic" ||
            selectedTemplate === "custom") ? (
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

          {(selectedTemplate === "interval" ||
            selectedTemplate === "classic" ||
            selectedTemplate === "custom") ? (
            <label className="toggle-item hide-hr-toggle">
              <input
                className="toggle-input"
                type="checkbox"
                checked={hideHr}
                onChange={(event) => setHideHr(event.target.checked)}
              />
              <span className="toggle-track" aria-hidden="true">
                <span className="toggle-thumb" />
              </span>
              <span className="toggle-label">Hide HR</span>
            </label>
          ) : null}

          {selectedTemplate === "custom" ? (
            <>
              <p className="stat-label">Custom Layers</p>
              <div className="template-selector compact custom-layer-list">
                {customLayers.map((layer) => (
                  <button
                    key={layer.id}
                    type="button"
                    className={`template-chip ${selectedLayerId === layer.id ? "active" : ""}`}
                    onClick={() => setSelectedLayerId(layer.id)}
                  >
                    {layer.label}
                  </button>
                ))}
              </div>
              <div className="custom-layer-actions">
                <button
                  type="button"
                  className="button ghost"
                  onClick={removeSelectedLayer}
                  disabled={!selectedLayer}
                >
                  Remove Selected
                </button>
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => setConfigPanelPos({ x: 24, y: 24 })}
                >
                  Reset Panel
                </button>
              </div>
              {availableLayerTypes.length ? (
                <>
                  <p className="stat-label">Add Component</p>
                  <div className="template-selector compact custom-layer-list">
                    {availableLayerTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        className="template-chip"
                        onClick={() => addCustomLayer(type)}
                      >
                        + {CUSTOM_LAYER_LIBRARY[type].label}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
              {selectedLayer ? (
                <div className="custom-size custom-layer-grid">
                  <label>
                    X
                    <input
                      type="number"
                      value={Math.round(selectedLayer.x)}
                      onChange={(event) =>
                        handleLayerUpdate(selectedLayer.id, { x: Number(event.target.value) || 0 })
                      }
                    />
                  </label>
                  <label>
                    Y
                    <input
                      type="number"
                      value={Math.round(selectedLayer.y)}
                      onChange={(event) =>
                        handleLayerUpdate(selectedLayer.id, { y: Number(event.target.value) || 0 })
                      }
                    />
                  </label>
                  <label>
                    W
                    <input
                      type="number"
                      value={Math.round(selectedLayer.width)}
                      min="60"
                      onChange={(event) =>
                        handleLayerUpdate(selectedLayer.id, { width: Math.max(60, Number(event.target.value) || 60) })
                      }
                    />
                  </label>
                  <label>
                    H
                    <input
                      type="number"
                      value={Math.round(selectedLayer.height)}
                      min="30"
                      onChange={(event) =>
                        handleLayerUpdate(selectedLayer.id, { height: Math.max(30, Number(event.target.value) || 30) })
                      }
                    />
                  </label>
                </div>
              ) : null}
              {selectedLayer?.type === "stats" ? (
                <>
                  <p className="stat-label">Stats Fields</p>
                  <div className="option-list">
                    {STATS_FIELD_OPTIONS.map((field) => (
                      <label key={field.id} className="toggle-item">
                        <input
                          className="toggle-input"
                          type="checkbox"
                          checked={selectedLayer.statsFields?.includes(field.id)}
                          onChange={(event) => {
                            const nextSet = new Set(selectedLayer.statsFields || []);
                            if (event.target.checked) nextSet.add(field.id);
                            else nextSet.delete(field.id);
                            if (nextSet.size === 0) nextSet.add("distance");
                            handleLayerUpdate(selectedLayer.id, { statsFields: Array.from(nextSet) });
                          }}
                        />
                        <span className="toggle-track" aria-hidden="true">
                          <span className="toggle-thumb" />
                        </span>
                        <span className="toggle-label">{field.label}</span>
                      </label>
                    ))}
                  </div>
                </>
              ) : null}
              <label className="toggle-item hide-hr-toggle">
                <input
                  className="toggle-input"
                  type="checkbox"
                  checked={selectedLayer ? selectedLayer.visible : true}
                  onChange={(event) =>
                    selectedLayer ? handleLayerUpdate(selectedLayer.id, { visible: event.target.checked }) : null
                  }
                />
                <span className="toggle-track" aria-hidden="true">
                  <span className="toggle-thumb" />
                </span>
                <span className="toggle-label">Show Selected Layer</span>
              </label>
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
              {imageCopied ? "Copied" : "Copy"}
            </button>
            <button className="button" type="button" onClick={handleDownload} disabled={busy}>
              {busy ? <LoaderCircle size={14} className="spin" /> : <Download size={14} />}
              Download
            </button>
          </div>
      </>
    );
  }
}

function shouldFallbackToDownload(error) {
  const message = String(error?.message || "").toLowerCase();
  const name = String(error?.name || "").toLowerCase();
  return (
    name.includes("notallowed") ||
    message.includes("not allowed") ||
    message.includes("denied permission") ||
    message.includes("clipboard image is not supported") ||
    message.includes("clipboard access requires https")
  );
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createCustomLayer(type) {
  const base = CUSTOM_LAYER_LIBRARY[type];
  return {
    ...base,
    id: `${type}-${Math.random().toString(36).slice(2, 9)}`,
    label: `${base.label}`
  };
}
