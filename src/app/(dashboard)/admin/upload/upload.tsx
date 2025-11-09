// components/UploadExcel.tsx
"use client";

import { useState, useRef } from "react";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";

interface Props {
  onSuccess?: (total: number) => void;
}

export default function UploadExcel({ onSuccess }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".xlsx")) {
      setMessage({ type: "error", text: "Only .xlsx files" });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/update-prices", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage({
        type: "success",
        text: `Uploaded! ${data.total} products.`,
      });
      onSuccess?.(data.total);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className={`
          border-4 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
          ${isUploading ? "border-green-300 bg-green-50" : "border-green-400 hover:border-green-500"}
        `}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {isUploading ? (
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
            <p className="text-lg font-semibold text-green-700">Uploading...</p>
          </div>
        ) : (
          <>
            <Upload className="w-16 h-16 mx-auto text-green-600 mb-4" />
            <p className="text-2xl font-bold text-green-700">
              Upload Excel Sheet
            </p>
            <p className="text-gray-600 mt-2">Drag & drop or click</p>
          </>
        )}
      </div>

      {message?.type === "success" && (
        <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-300 text-center">
          <p className="text-green-800 font-medium">{message.text}</p>
        </div>
      )}

      {message?.type === "error" && (
        <div className="mt-4 p-3 bg-red-100 rounded-lg border border-red-300 text-center">
          <p className="text-red-800 font-medium">{message.text}</p>
        </div>
      )}
    </div>
  );
}
