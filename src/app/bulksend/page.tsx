"use client";

import { useState } from "react";

export default function SendBulkEmail() {
  const [message, setMessage] = useState(
    "We are closed between 5th Jan and 10th Jan 2026. We apologize for any inconvenience."
  );
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState("");

  const handlePreview = () => {
    setPreview(true);
  };

  const handleSend = async () => {
    setStatus("Sending...");
    const res = await fetch("/api/send-bulk-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();
    if (data.success) {
      setStatus(`Sent to ${data.sent} users!`);
    } else {
      setStatus(`Error: ${data.error}`);
    }
  };

  return (
    <div>
      <h1>Send Bulk Closure Notice</h1>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={5}
        cols={50}
        placeholder="Enter your message here"
      />
      <button onClick={handlePreview}>Preview</button>
      {preview && (
        <div>
          <h2>Preview:</h2>
          <div dangerouslySetInnerHTML={{ __html: `<p>${message}</p>` }} /> 
        </div>
      )}
      <button onClick={handleSend} disabled={!preview}>
        Send to All
      </button>
      {status && <p>{status}</p>}
    </div>
  );
}
