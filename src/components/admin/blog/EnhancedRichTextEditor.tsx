"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import ProductAutocomplete from "./ProductAutocomplete";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded animate-pulse" />,
});
const ReactQuillAny: any = ReactQuill;
import "react-quill/dist/quill.snow.css";

interface EnhancedRichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  className?: string;
}

// Custom image formats for different layouts
const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "blockquote",
  "code-block",
  "link",
  "image",
  "imageBlot",
];

// Custom image modal component
const ImageCustomizationModal = ({
  isOpen,
  onClose,
  onInsert,
  imageUrl,
}: {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (config: {
    layout: "single" | "grid-2" | "gallery";
    size: "small" | "medium" | "large" | "full";
    alignment: "left" | "center" | "right";
    caption: string;
    alt: string;
  }) => void;
  imageUrl: string;
}) => {
  const [config, setConfig] = useState<{
    layout: "single" | "grid-2" | "gallery";
    size: "small" | "medium" | "large" | "full";
    alignment: "left" | "center" | "right";
    caption: string;
    alt: string;
  }>({
    layout: "single",
    size: "medium",
    alignment: "center",
    caption: "",
    alt: "",
  });

  console.log(
    "ImageCustomizationModal render - isOpen:",
    isOpen,
    "imageUrl:",
    imageUrl
  );

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        // Only close if clicking the overlay, not the modal content
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Customize Image</h3>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700 p-1"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Image Preview */}
        <div className="mb-6">
          <img
            src={imageUrl}
            alt="Preview"
            className="max-w-full h-auto rounded border"
            style={{ maxHeight: "200px" }}
          />
        </div>

        {/* Layout Options */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Layout</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "single", label: "Single Image", icon: "🖼️" },
              { value: "grid-2", label: "2x2 Grid", icon: "⚏" },
              { value: "gallery", label: "Gallery", icon: "🎨" },
            ].map((layout) => (
              <button
                key={layout.value}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setConfig({
                    ...config,
                    layout: layout.value as "single" | "grid-2" | "gallery",
                  });
                }}
                className={`p-3 border rounded text-center ${
                  config.layout === layout.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300"
                }`}
              >
                <div className="text-2xl mb-1">{layout.icon}</div>
                <div className="text-xs">{layout.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Size Options */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Size</label>
          <div className="flex gap-2">
            {[
              { value: "small", label: "Small (25%)" },
              { value: "medium", label: "Medium (50%)" },
              { value: "large", label: "Large (75%)" },
              { value: "full", label: "Full Width" },
            ].map((size) => (
              <button
                key={size.value}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setConfig({
                    ...config,
                    size: size.value as "small" | "medium" | "large" | "full",
                  });
                }}
                className={`px-3 py-2 border rounded text-sm ${
                  config.size === size.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300"
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>

        {/* Alignment Options */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Alignment</label>
          <div className="flex gap-2">
            {[
              { value: "left", label: "Left", icon: "⬅️" },
              { value: "center", label: "Center", icon: "🔛" },
              { value: "right", label: "Right", icon: "➡️" },
            ].map((align) => (
              <button
                key={align.value}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setConfig({
                    ...config,
                    alignment: align.value as "left" | "center" | "right",
                  });
                }}
                className={`px-3 py-2 border rounded text-sm ${
                  config.alignment === align.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300"
                }`}
              >
                {align.icon} {align.label}
              </button>
            ))}
          </div>
        </div>

        {/* Caption */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Caption (optional)
          </label>
          <input
            type="text"
            value={config.caption}
            onChange={(e) => setConfig({ ...config, caption: e.target.value })}
            placeholder="Enter image caption"
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        {/* Alt Text */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Alt Text (accessibility)
          </label>
          <input
            type="text"
            value={config.alt}
            onChange={(e) => setConfig({ ...config, alt: e.target.value })}
            placeholder="Describe the image for screen readers"
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onInsert(config);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Insert Image
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal outside of the current DOM tree
  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
};

export default function EnhancedRichTextEditor({
  value,
  onChange,
  className = "",
}: EnhancedRichTextEditorProps) {
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompletePosition, setAutocompletePosition] = useState({
    top: 0,
    left: 0,
  });
  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const [currentRange, setCurrentRange] = useState<any>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [pendingImageUrl, setPendingImageUrl] = useState("");
  const [pendingImageRange, setPendingImageRange] = useState<{
    index: number;
    length: number;
  } | null>(null);
  const quillRef = useRef<any>(null);
  const quillInstanceRef = useRef<any>(null);

  // Custom image handler for uploading files
  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // Validate file
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert("File size must be less than 5MB");
        return;
      }

      const acceptedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (!acceptedTypes.includes(file.type)) {
        alert("Please select a valid image file (JPEG, PNG, WebP, or GIF)");
        return;
      }

      try {
        console.log("Image upload started:", file.name, file.size, file.type);

        // Get the actual Quill instance (not the read-only wrapper)
        let quill = quillRef.current?.getEditor();

        if (!quill || typeof quill.insertText !== "function") {
          // Try getting from DOM - the real Quill instance
          const editorElement = document.querySelector(".ql-editor");
          if (editorElement) {
            // Look for Quill instance in parent container
            const container = editorElement.closest(".ql-container");
            if (container && (container as any).__quill) {
              quill = (container as any).__quill;
            } else if ((editorElement.parentElement as any).__quill) {
              quill = (editorElement.parentElement as any).__quill;
            } else if ((editorElement as any).__quill) {
              quill = (editorElement as any).__quill;
            }
          }
        }

        console.log("Quill methods available:", {
          insertText: typeof quill?.insertText,
          deleteText: typeof quill?.deleteText,
          insertEmbed: typeof quill?.insertEmbed,
          getSelection: typeof quill?.getSelection,
        });

        if (!quill || typeof quill.insertText !== "function") {
          console.error("Quill editor not available or missing methods");
          alert("Editor not ready. Please try again in a moment.");
          return;
        }

        console.log("Found Quill instance:", !!quill);

        const range = quill.getSelection(true);
        console.log("Cursor position:", range);
        quill.insertText(range.index, "Uploading image...", "user");

        // Upload the file
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", "product-images"); // Use existing product-images bucket

        const response = await fetch("/api/upload-product-image", {
          method: "POST",
          body: formData,
        });

        console.log("Upload response status:", response.status);
        const result = await response.json();
        console.log("Upload result:", result);

        if (response.ok && result.url) {
          console.log(
            "Upload successful, showing customization modal:",
            result.url
          );
          // Remove loading text
          quill.deleteText(range.index, "Uploading image...".length);

          // Store image URL and range for modal
          setPendingImageUrl(result.url);
          setPendingImageRange(range);
          console.log("Setting modal state to true...");
          setShowImageModal(true);
          console.log("Modal state set, should be visible now");
        } else {
          console.error("Upload failed:", result);
          // Remove loading text on error
          quill.deleteText(range.index, "Uploading image...".length);
          alert(
            `Failed to upload image: ${result.error || "Please try again."}`
          );
        }
      } catch (error) {
        console.error("Image upload error:", error);
        // Clean up loading text
        const quill = quillInstanceRef.current || quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection();
          if (range)
            quill.deleteText(
              range.index - "Uploading image...".length,
              "Uploading image...".length
            );
        }
        alert("Failed to upload image. Please try again.");
      }
    };
  }, []);

  // Add click handler for existing images
  useEffect(() => {
    const handleImageClick = (e: globalThis.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG" && target.closest(".ql-editor")) {
        e.preventDefault();
        const img = target as HTMLImageElement;
        const src = img.src;

        // Get Quill instance and selection
        let quill = quillRef.current?.getEditor();
        if (!quill) {
          const editorElement = document.querySelector(".ql-editor");
          if (editorElement && (editorElement.parentElement as any).__quill) {
            quill = (editorElement.parentElement as any).__quill;
          }
        }

        if (quill) {
          // Find the image position in the editor
          const range = quill.getSelection();
          setPendingImageUrl(src);
          setPendingImageRange(range || { index: 0, length: 0 });
          setShowImageModal(true);
        }
      }
    };

    // Add click listener to the editor
    const editor = document.querySelector(".ql-editor");
    if (editor) {
      editor.addEventListener("click", handleImageClick as EventListener);
    }

    return () => {
      if (editor) {
        editor.removeEventListener("click", handleImageClick as EventListener);
      }
    };
  }, []);

  // Configure quill modules with custom image handler
  const quillModules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["blockquote", "code-block"],
        ["link", "image"],
        ["clean"],
      ],
      handlers: {
        image: imageHandler,
      },
    },
  };

  const handleTextChange = useCallback(
    (content: string, delta: any, source: any, editor: any) => {
      onChange(content);

      // Always store the quill instance when available
      if (editor && !quillInstanceRef.current) {
        quillInstanceRef.current = editor;
        console.log("Stored Quill instance from handleTextChange");
      }

      // Don't process autocomplete if modal is open
      if (showImageModal) {
        console.log("Image modal is open, skipping text change processing");
        return;
      }

      if (source === "user") {
        const selection = editor.getSelection();
        if (selection) {
          const text = editor.getText(Math.max(0, selection.index - 10), 10);
          const bracketMatch = text.match(/\[\[([^\]]*?)$/);

          if (bracketMatch) {
            const query = bracketMatch[1] || "";
            const quill = editor;
            quillInstanceRef.current = quill;

            if (quill) {
              const bounds = quill.getBounds(selection.index);

              let container = quill.container;
              if (!container) {
                container =
                  quill.root?.parentElement ||
                  document.querySelector(".ql-editor")?.parentElement;
              }

              if (!container) {
                return;
              }

              const editorRect = container.getBoundingClientRect();
              const viewportWidth = window.innerWidth;
              const viewportHeight = window.innerHeight;
              const dropdownWidth = 384;
              const dropdownHeight = 400;

              let top =
                editorRect.top +
                bounds.top +
                bounds.height +
                window.scrollY +
                8;
              let left = editorRect.left + bounds.left + window.scrollX;

              if (left + dropdownWidth > viewportWidth) {
                left = viewportWidth - dropdownWidth - 16;
              }

              if (top + dropdownHeight > viewportHeight + window.scrollY) {
                top =
                  editorRect.top +
                  bounds.top +
                  window.scrollY -
                  dropdownHeight -
                  8;
              }

              left = Math.max(16, left);
              top = Math.max(16, top);

              setAutocompletePosition({ top, left });
              setAutocompleteQuery(query);

              const bracketStart = selection.index - bracketMatch[0].length;
              const bracketLength = bracketMatch[0].length;

              setCurrentRange({
                index: bracketStart,
                length: bracketLength,
              });
              setShowAutocomplete(true);
            }
          } else if (showAutocomplete) {
            const textBefore = editor.getText(
              Math.max(0, selection.index - 20),
              20
            );
            if (!textBefore.includes("[[") || textBefore.includes("]]")) {
              setShowAutocomplete(false);
            }
          }
        }
      }
    },
    [onChange, showAutocomplete, showImageModal]
  );

  const handleProductSelect = useCallback(
    (slug: string, name: string, customText?: string) => {
      let quill = quillRef.current?.getEditor();

      if (!quill) {
        const editorElement = document.querySelector(".ql-editor");
        if (editorElement && (editorElement.parentElement as any).__quill) {
          quill = (editorElement.parentElement as any).__quill;
        } else if (editorElement && (editorElement as any).__quill) {
          quill = (editorElement as any).__quill;
        }
      }

      if (!quill) {
        const container = document.querySelector(".ql-container");
        if (container && (container as any).__quill) {
          quill = (container as any).__quill;
        }
      }

      if (quill && currentRange) {
        const textToInsert = customText
          ? `[[${slug}|${customText}]]`
          : `[[${slug}]]`;

        try {
          if (
            typeof quill.deleteText === "function" &&
            typeof quill.insertText === "function"
          ) {
            quill.deleteText(currentRange.index, currentRange.length);
            quill.insertText(currentRange.index, textToInsert);
            const newPosition = currentRange.index + textToInsert.length;
            quill.setSelection(newPosition);
          } else if (typeof quill.updateContents === "function") {
            const delta = quill.constructor.import("delta")();
            delta
              .retain(currentRange.index)
              .delete(currentRange.length)
              .insert(textToInsert);
            quill.updateContents(delta);
          }
        } catch (error) {
          console.error("Error modifying Quill content:", error);
        }
      }

      setShowAutocomplete(false);
      setCurrentRange(null);
      setAutocompleteQuery("");
    },
    [currentRange]
  );

  const handleCloseAutocomplete = useCallback(() => {
    setShowAutocomplete(false);
    setCurrentRange(null);
    setAutocompleteQuery("");
  }, []);

  const handleInsertCustomImage = useCallback(
    (config: {
      layout: "single" | "grid-2" | "gallery";
      size: "small" | "medium" | "large" | "full";
      alignment: "left" | "center" | "right";
      caption: string;
      alt: string;
    }) => {
      let quill = quillRef.current?.getEditor();

      if (!quill) {
        // Fallback methods to get quill instance
        const editorElement = document.querySelector(".ql-editor");
        if (editorElement && (editorElement.parentElement as any).__quill) {
          quill = (editorElement.parentElement as any).__quill;
        } else if (editorElement && (editorElement as any).__quill) {
          quill = (editorElement as any).__quill;
        }
      }

      if (!quill) {
        const container = document.querySelector(".ql-container");
        if (container && (container as any).__quill) {
          quill = (container as any).__quill;
        }
      }

      if (quill && pendingImageRange && pendingImageUrl) {
        try {
          // Create custom HTML based on configuration
          let customImageHtml = "";

          const sizeClasses: Record<
            "small" | "medium" | "large" | "full",
            string
          > = {
            small: "max-w-sm mx-auto",
            medium: "max-w-md mx-auto",
            large: "max-w-2xl mx-auto",
            full: "w-full",
          };

          const alignClasses: Record<"left" | "center" | "right", string> = {
            left: "mr-auto",
            center: "mx-auto",
            right: "ml-auto",
          };

          if (config.layout === "single") {
            customImageHtml = `
            <div class="not-prose my-8 ${alignClasses[config.alignment]}">
              <img 
                src="${pendingImageUrl}" 
                alt="${config.alt || ""}"
                class="${sizeClasses[config.size]} h-auto rounded-xl shadow-lg"
                loading="lazy"
              />
              ${config.caption ? `<p class="text-sm text-gray-600 mt-3 text-center italic">${config.caption}</p>` : ""}
            </div>
          `;
          } else if (config.layout === "grid-2") {
            customImageHtml = `
            <div class="not-prose my-8 ${alignClasses[config.alignment]}" style="all: revert;">
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;" class="${sizeClasses[config.size]}">
                <img src="${pendingImageUrl}" alt="${config.alt || ""}" style="width: 100%; height: auto; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); object-fit: cover; aspect-ratio: 1;" loading="lazy" />
                <div style="aspect-ratio: 1; background-color: #f3f4f6; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 0.875rem; border: 2px dashed #d1d5db;">
                  <span style="text-align: center;">
                    <span style="display: block; font-size: 1.5rem; margin-bottom: 0.25rem;">📷</span>
                    <span style="font-size: 0.75rem;">Add Image</span>
                  </span>
                </div>
                <div style="aspect-ratio: 1; background-color: #f3f4f6; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 0.875rem; border: 2px dashed #d1d5db;">
                  <span style="text-align: center;">
                    <span style="display: block; font-size: 1.5rem; margin-bottom: 0.25rem;">📷</span>
                    <span style="font-size: 0.75rem;">Add Image</span>
                  </span>
                </div>
                <div style="aspect-ratio: 1; background-color: #f3f4f6; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 0.875rem; border: 2px dashed #d1d5db;">
                  <span style="text-align: center;">
                    <span style="display: block; font-size: 1.5rem; margin-bottom: 0.25rem;">📷</span>
                    <span style="font-size: 0.75rem;">Add Image</span>
                  </span>
                </div>
              </div>
              ${config.caption ? `<p style="font-size: 0.875rem; color: #4b5563; margin-top: 0.75rem; text-align: center; font-style: italic;">${config.caption}</p>` : ""}
            </div>
          `;
          } else if (config.layout === "gallery") {
            customImageHtml = `
            <div class="not-prose my-8 ${alignClasses[config.alignment]}" style="all: revert;">
              <div style="display: flex; gap: 0.75rem; overflow-x: auto; padding-bottom: 0.5rem; scrollbar-width: thin;" class="${sizeClasses[config.size]}">
                <img src="${pendingImageUrl}" alt="${config.alt || ""}" style="height: 12rem; width: auto; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); flex-shrink: 0;" loading="lazy" />
                <div style="height: 12rem; width: 8rem; background-color: #f3f4f6; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 0.75rem; border: 2px dashed #d1d5db;">
                  <span style="text-align: center;">
                    <span style="display: block; font-size: 1.25rem; margin-bottom: 0.25rem;">📷</span>
                    <span style="font-size: 0.75rem;">Add</span>
                  </span>
                </div>
                <div style="height: 12rem; width: 8rem; background-color: #f3f4f6; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 0.75rem; border: 2px dashed #d1d5db;">
                  <span style="text-align: center;">
                    <span style="display: block; font-size: 1.25rem; margin-bottom: 0.25rem;">📷</span>
                    <span style="font-size: 0.75rem;">Add</span>
                  </span>
                </div>
              </div>
              ${config.caption ? `<p style="font-size: 0.875rem; color: #4b5563; margin-top: 0.75rem; text-align: center; font-style: italic;">${config.caption}</p>` : ""}
            </div>
          `;
          }

          // Insert the HTML at the saved position
          quill.clipboard.dangerouslyPasteHTML(
            pendingImageRange.index,
            customImageHtml
          );
          quill.setSelection(pendingImageRange.index + 1);
        } catch (error) {
          console.error("Error inserting custom image:", error);
          // Fallback to simple image insert
          quill.insertEmbed(pendingImageRange.index, "image", pendingImageUrl);
          quill.setSelection(pendingImageRange.index + 1);
        }
      }

      // Clean up modal state
      setShowImageModal(false);
      setPendingImageUrl("");
      setPendingImageRange(null);
    },
    [pendingImageUrl, pendingImageRange]
  );

  const handleCloseImageModal = useCallback(() => {
    console.log("handleCloseImageModal called - closing modal");
    setShowImageModal(false);
    setPendingImageUrl("");
    setPendingImageRange(null);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <ReactQuillAny
        ref={quillRef}
        value={value}
        onChange={handleTextChange}
        modules={quillModules}
        formats={quillFormats}
        theme="snow"
        className="bg-white"
      />

      {/* Enhanced tips */}
      <div className="mt-2 text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded px-3 py-2 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold">💡 Product Linking:</span>
          <span>
            Type <code className="bg-blue-100 px-1 rounded">[[</code> to search
            and link products, bundles, or offers
          </span>
        </div>
        <div className="text-blue-600">
          Example: Type <code className="bg-blue-100 px-1 rounded">[[rice</code>{" "}
          → select &quot;White Rice&quot; → inserts{" "}
          <code className="bg-blue-100 px-1 rounded">[[white-rice]]</code>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-blue-200">
          <span className="font-semibold">📸 Image Upload:</span>
          <span>
            Click the <strong>image icon</strong> in toolbar to upload and
            customize images with layouts, sizes, and captions
          </span>
        </div>
        <div className="text-blue-600">
          Features: Single images, 2x2 grids, gallery layouts • Custom sizes
          (25%-100%) • Left/Center/Right alignment • Captions & Alt text
        </div>
      </div>

      {/* Image Customization Modal */}
      <ImageCustomizationModal
        isOpen={showImageModal}
        onClose={handleCloseImageModal}
        onInsert={handleInsertCustomImage}
        imageUrl={pendingImageUrl}
      />

      {/* Autocomplete Dropdown */}
      {showAutocomplete && (
        <ProductAutocomplete
          onSelect={handleProductSelect}
          onClose={handleCloseAutocomplete}
          position={autocompletePosition}
          initialQuery={autocompleteQuery}
        />
      )}
    </div>
  );
}
