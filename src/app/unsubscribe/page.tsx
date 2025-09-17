"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type ApiResponse = {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
};

export default function UnsubscribePage() {
  const params = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMsg("Missing unsubscribe token.");
      return;
    }
    const run = async () => {
      try {
        setStatus("loading");
        const res = await fetch("/api/email/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, type: "all" }),
        });
        const data: ApiResponse = await res.json();
        if (!res.ok || !data.success) {
          setStatus("error");
          setMsg(data.error || "Failed to process unsubscribe");
          return;
        }
        setStatus("done");
        setMsg(data.message || "You have been unsubscribed.");
      } catch (e: any) {
        setStatus("error");
        setMsg(e?.message || "Unexpected error");
      }
    };
    run();
  }, [token]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-6 text-center">
        <img
          src="https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png"
          alt="FeedMe"
          style={{ height: 37, width: "auto", margin: "0 auto 12px" }}
        />
        <h1 className="text-xl font-semibold text-[#1B6013] mb-2">
          Unsubscribe
        </h1>
        {status === "loading" && (
          <p className="text-gray-600">Processing your request…</p>
        )}
        {status === "done" && <p className="text-green-700">{msg}</p>}
        {status === "error" && <p className="text-red-600">{msg}</p>}
      </div>
    </main>
  );
}
