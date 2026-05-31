import { Activity } from "lucide-react";

export default function Header() {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-icon" aria-hidden="true">
          <Activity size={18} />
        </span>
        <div>
          <h1 className="title">RunShare</h1>
          <p className="subtitle">Share your runs, your way</p>
        </div>
      </div>
    </header>
  );
}
