import React, { useState } from "react";
import { API } from "../services/api";

const DisputeSummaryButton = ({ dispute, driverName }) => {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    setLoading(true);
    setSummary("");
    try {
      const res = await API.post("/ai/summarize-dispute", {
        name: driverName || "Driver",
        complaint: dispute.description || dispute.message || dispute.reason || "No description provided." 
      });
      
      if (res.data.success) {
        setSummary(res.data.summary);
      } else {
        setSummary("Could not generate summary.");
      }
    } catch (error) {
      console.error("Error:", error);
      setSummary("Failed to connect to AI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "10px" }}>
      <button 
        onClick={handleSummarize} 
        disabled={loading}
        style={{ backgroundColor: "#6f42c1", color: "white", border: "none", padding: "5px 10px", borderRadius: "5px", cursor: "pointer", fontSize: "12px" }}
      >
        {loading ? "Summarizing..." : "🤖 AI Summary"}
      </button>
      {summary && (
        <div style={{ marginTop: "8px", padding: "10px", backgroundColor: "#f0e6ff", borderLeft: "4px solid #6f42c1", borderRadius: "4px", fontSize: "13px", color: "#333" }}>
          {summary}
        </div>
      )}
    </div>
  );
};

export default DisputeSummaryButton;