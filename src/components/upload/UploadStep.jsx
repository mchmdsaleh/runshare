import { FileUp, LoaderCircle } from "lucide-react";
import { useMemo, useRef, useState } from "react";

const SAMPLE_CSV = `Step Type,Interval,Distance,Time,Avg Pace,Avg HR,Max HR,Calories
Warm Up,1,1.03,7:17.2,7:04,130,145,80
Run,1,0.5,2:39.2,5:18,165,175,55
Rest,1,0.22,2:30,11:36,150,160,20
Run,2,0.5,2:27.0,4:54,168,178,58
Rest,2,0.21,2:28,11:48,152,161,20
Cool Down,1,3.66,30:35.0,8:21,125,135,190
Summary,Summary,8.00,1:01:19,7:40,141,181,552
`;

export default function UploadStep({ onFileParse, status, error, fileName }) {
  const fileRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);

  const statusClass = useMemo(() => {
    if (error) return "status error";
    if (status === "Parsed successfully") return "status success";
    return "status";
  }, [error, status]);

  function triggerPicker() {
    fileRef.current?.click();
  }

  async function handleFile(file) {
    if (!file) return;
    setBusy(true);
    try {
      await onFileParse(file);
    } finally {
      setBusy(false);
    }
  }

  function onInput(event) {
    void handleFile(event.target.files?.[0]);
  }

  function onDrop(event) {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    void handleFile(file);
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "runshare-sample.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="panel upload-card">
      <div
        className={`dropzone ${dragActive ? "active" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
      >
        <div className="dropzone-icon">
          {busy ? <LoaderCircle size={28} className="spin" /> : <FileUp size={28} />}
        </div>
        <p className="dropzone-title">Drop your file here</p>
        <p className="dropzone-subtitle">CSV, FIT, or ZIP (first .fit) is supported.</p>
        <div className="upload-row">
          <button className="button" type="button" onClick={triggerPicker} disabled={busy}>
            Choose File
          </button>
          <button className="button ghost" type="button" onClick={downloadSample} disabled={busy}>
            Download Sample
          </button>
        </div>
        <input
          ref={fileRef}
          id="csv-file"
          className="file-input"
          type="file"
          accept=".csv,.fit,.zip,text/csv,application/zip"
          onChange={onInput}
        />
      </div>

      <p className="mono file-name">{fileName || "No file selected"}</p>
      <p className={statusClass}>
        {status}
        {error ? `: ${error}` : ""}
      </p>
    </section>
  );
}
