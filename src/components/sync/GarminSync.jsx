import { useState } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function GarminSync({ onActivityLoad }) {
  const [garminUser, setGarminUser] = useState("");
  const [garminPassword, setGarminPassword] = useState("");
  const [syncStatus, setSyncStatus] = useState({ status: "Idle", message: "" });
  const [showCreds, setShowCreds] = useState(false);

  const handleUpdateCredentials = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/garmin/credentials`, {
        garmin_user: garminUser,
        garmin_password: garminPassword
      });
      alert("Credentials updated!");
      setShowCreds(false);
    } catch (err) {
      alert("Failed to update credentials");
    }
  };

  const handleLoadLatest = async () => {
    setSyncStatus({ status: "Loading", message: "Fetching latest running activity from Garmin Connect..." });
    try {
      const response = await axios.get(`${API_BASE_URL}/garmin/latest-activity-file`, {
        responseType: 'blob'
      });
      
      const contentDisposition = response.headers['content-disposition'];
      let fileName = "activity.fit";
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename=(.+)/);
        if (fileNameMatch) fileName = fileNameMatch[1];
      }

      const fitFile = new File([response.data], fileName, { type: "application/octet-stream" });
      onActivityLoad(fitFile);
      setSyncStatus({ status: "Idle", message: "Latest activity loaded" });
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to download latest .fit file.");
      setSyncStatus({ status: "Idle", message: "" });
    }
  };

  return (
    <div className="garmin-sync-container card">
      <div className="sync-header">
        <h3>Garmin Connect</h3>
        {syncStatus.status !== "Idle" && (
          <span className={`status-badge status-${syncStatus.status.toLowerCase()}`}>
            {syncStatus.status}: {syncStatus.message}
          </span>
        )}
      </div>
      
      <div className="button-group">
        <button 
          onClick={handleLoadLatest} 
          className="btn-primary"
          disabled={syncStatus.status === "Loading"}
        >
          {syncStatus.status === "Loading" ? "Loading..." : "Load Latest Activity"}
        </button>

      </div>

      <button onClick={() => setShowCreds(!showCreds)} className="btn-text">
        {showCreds ? "Hide Credentials" : "Setup Garmin Account"}
      </button>

      {showCreds && (
        <form onSubmit={handleUpdateCredentials} className="cred-form">
          <div className="form-group">
            <label>Garmin Email</label>
            <input 
              type="email" 
              value={garminUser} 
              onChange={(e) => setGarminUser(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Garmin Password</label>
            <input 
              type="password" 
              value={garminPassword} 
              onChange={(e) => setGarminPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn-small">Save Garmin Account</button>
        </form>
      )}
    </div>
  );
}

export default GarminSync;
