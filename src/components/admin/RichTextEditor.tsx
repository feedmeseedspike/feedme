"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-sm text-gray-500">
      Loading editor...
    </div>
  ),
});
const ReactQuillAny: any = ReactQuill;

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  showImageUpload?: boolean;
  resizable?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter your content...",
  height = "200px",
  showImageUpload = true,
  resizable = true,
}: RichTextEditorProps) {
  const quillRef = useRef<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Quill CSS is imported globally in other editor module

  const modules = {
    toolbar: [
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ...(showImageUpload ? [["image"]] : []),
      ["clean"],
    ],
    clipboard: {
      matchVisual: false,
    },
  };

  const formats = [
    "bold",
    "italic",
    "underline",
    "list",
    "bullet",
    "link",
    "image",
  ];

  const handleImageUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", "product-images");

        const response = await fetch("/api/upload-product-image", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Upload failed");
        }

        const data = await response.json();

        if (data.url) {
          // Insert image into Quill editor
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection();
            quill.insertEmbed(range?.index || 0, "image", data.url);
          }
        }
      } catch (error) {
        console.error("Image upload failed:", error);
        alert("Failed to upload image. Please try again.");
      } finally {
        setIsUploading(false);
      }
    };

    input.click();
  };

  // Custom image handler
  const imageHandler = () => {
    handleImageUpload();
  };

  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      if (quill && quill.getModule) {
        quill.getModule("toolbar").addHandler("image", imageHandler);
      }
    }
  }, []);

  return (
    <div
      className={`relative ${resizable ? "resize-y overflow-hidden" : ""}`}
      style={{ minHeight: height }}
    >
      {isUploading && (
        <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs z-50">
          Uploading...
        </div>
      )}

      <ReactQuillAny
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{
          height: "100%",
          minHeight: height,
        }}
      />

      <style jsx global>{`
        .ql-editor {
          font-family: inherit;
          font-size: 14px;
          line-height: 1.6;
          min-height: ${height} !important;
        }

        .ql-toolbar {
          border-top: 1px solid #e5e7eb;
          border-left: 1px solid #e5e7eb;
          border-right: 1px solid #e5e7eb;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          position: relative;
          z-index: 1;
        }

        .ql-container {
          border-bottom: 1px solid #e5e7eb;
          border-left: 1px solid #e5e7eb;
          border-right: 1px solid #e5e7eb;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          font-family: inherit;
          position: relative;
          z-index: 1;
        }

        .ql-editor.ql-blank::before {
          font-style: normal;
          color: #9ca3af;
          opacity: 1;
        }

        .ql-snow .ql-tooltip {
          z-index: 50 !important;
          position: absolute !important;
          max-width: 300px;
        }

        .ql-snow .ql-picker {
          display: none !important;
        }

        .ql-snow .ql-picker-options {
          display: none !important;
        }

        .ql-snow .ql-color-picker {
          display: none !important;
        }

        .ql-snow .ql-header {
          display: none !important;
        }

        .ql-snow .ql-align {
          display: none !important;
        }

        /* Add tooltips to toolbar buttons */
        .ql-bold:hover::after {
          content: "Bold";
          position: absolute;
          background: #333;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          z-index: 1000;
        }

        .ql-italic:hover::after {
          content: "Italic";
          position: absolute;
          background: #333;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          z-index: 1000;
        }

        .ql-underline:hover::after {
          content: "Underline";
          position: absolute;
          background: #333;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          z-index: 1000;
        }

        .ql-list[value="ordered"]:hover::after {
          content: "Numbered List";
          position: absolute;
          background: #333;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          z-index: 1000;
        }

        .ql-list[value="bullet"]:hover::after {
          content: "Bullet List";
          position: absolute;
          background: #333;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          z-index: 1000;
        }

        .ql-link:hover::after {
          content: "Insert Link";
          position: absolute;
          background: #333;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          z-index: 1000;
        }

        .ql-image:hover::after {
          content: "Insert Image";
          position: absolute;
          background: #333;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          z-index: 1000;
        }

        .ql-clean:hover::after {
          content: "Clear Formatting";
          position: absolute;
          background: #333;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          z-index: 1000;
        }

        /* Make the editor resizable */
        .resize-y {
          resize: vertical;
          min-height: 200px;
        }

        .ql-container {
          height: calc(100% - 42px) !important;
        }

        .ql-editor {
          height: 100% !important;
          min-height: calc(${height} - 42px) !important;
        }
      `}</style>
    </div>
  );
}
