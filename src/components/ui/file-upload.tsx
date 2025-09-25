"use client";

import { cn } from "@/lib/utils";
import {
  Dispatch,
  SetStateAction,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useDropzone,
  DropzoneState,
  FileRejection,
  DropzoneOptions,
} from "react-dropzone";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { Button } from "./button";

type DirectionOptions = "rtl" | "ltr" | undefined;

type FileUploaderContextType = {
  dropzoneState: DropzoneState;
  isLOF: boolean;
  isFileTooBig: boolean;
  removeFileFromSet: (index: number) => void;
  activeIndex: number;
  setActiveIndex: Dispatch<SetStateAction<number>>;
  orientation: "horizontal" | "vertical";
  direction: DirectionOptions;
};

const FileUploaderContext = createContext<FileUploaderContextType | null>(null);

export const useFileUpload = () => {
  const context = useContext(FileUploaderContext);
  if (!context) {
    throw new Error("useFileUpload must be used within a FileUploaderProvider");
  }
  return context;
};

type FileUploaderProps = {
  value: File[] | null;
  reSelect?: boolean;
  onValueChange: (value: File[] | null) => void;
  dropzoneOptions: DropzoneOptions;
  orientation?: "horizontal" | "vertical";
  className?: string;
  children?: React.ReactNode;
};

export const FileUploader = forwardRef<
  HTMLDivElement,
  FileUploaderProps & React.HTMLAttributes<HTMLDivElement>
>(
  (
    {
      className,
      dropzoneOptions,
      value,
      onValueChange,
      reSelect,
      orientation = "vertical",
      children,
      ...props
    },
    ref
  ) => {
    const [isFileTooBig, setIsFileTooBig] = useState(false);
    const [isLOF, setIsLOF] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const {
      accept = {
        "application/pdf": [".pdf"],
        "application/msword": [".doc"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          [".docx"],
      },
      maxFiles = 1,
      maxSize = 5 * 1024 * 1024, // 5MB
      multiple = false,
    } = dropzoneOptions;

    const reSelectAll = reSelect;
    const direction: DirectionOptions = "ltr";

    const removeFileFromSet = useCallback(
      (i: number) => {
        if (!value) return;
        const newFiles = value.filter((_, index) => index !== i);
        onValueChange(newFiles.length > 0 ? newFiles : null);
      },
      [value, onValueChange]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!value) return;

        const moveNext = () => {
          const nextIndex = activeIndex + 1;
          setActiveIndex(nextIndex > value.length - 1 ? 0 : nextIndex);
        };

        const movePrev = () => {
          const prevIndex = activeIndex - 1;
          setActiveIndex(prevIndex < 0 ? value.length - 1 : prevIndex);
        };

        const prevKey = direction === "ltr" ? "ArrowLeft" : "ArrowRight";
        const nextKey = direction === "ltr" ? "ArrowRight" : "ArrowLeft";

        if (e.key === nextKey) {
          moveNext();
        } else if (e.key === prevKey) {
          movePrev();
        } else if (e.key === "Enter" || e.key === " ") {
          if (activeIndex === -1) {
            dropzoneState.inputRef.current?.click();
          }
        } else if (e.key === "Delete" || e.key === "Backspace") {
          if (activeIndex !== -1) {
            removeFileFromSet(activeIndex);
            if (value.length - 1 === 0) {
              setActiveIndex(-1);
              return;
            }
            movePrev();
          }
        } else if (e.key === "Escape") {
          setActiveIndex(-1);
        }
      },
      [value, activeIndex, removeFileFromSet, direction]
    );

    const onDrop = useCallback(
      (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
        const files = acceptedFiles;

        if (!files || files.length === 0) {
          setIsFileTooBig(false);
          setIsLOF(false);
          return;
        }

        if (rejectedFiles.length > 0) {
          for (let i = 0; i < rejectedFiles.length; i++) {
            if (rejectedFiles[i].errors[0]?.code === "file-too-large") {
              setIsFileTooBig(true);
              return;
            }
            if (rejectedFiles[i].errors[0]?.code === "too-many-files") {
              setIsLOF(true);
              return;
            }
          }
        }

        if (multiple && reSelectAll) {
          onValueChange(files);
        } else if (multiple) {
          onValueChange((value || []).concat(files));
        } else {
          onValueChange(files);
        }
      },
      [multiple, onValueChange, reSelectAll]
    );

    useEffect(() => {
      if (!value) {
        setActiveIndex(-1);
      }
    }, [value]);

    const opts = dropzoneOptions
      ? dropzoneOptions
      : { accept, maxFiles, maxSize, multiple };

    const dropzoneState = useDropzone({
      ...opts,
      onDrop,
      onDropRejected: () => setIsFileTooBig(false),
      onDropAccepted: () => setIsFileTooBig(false),
    });

    return (
      <FileUploaderContext.Provider
        value={{
          dropzoneState,
          isLOF,
          isFileTooBig,
          removeFileFromSet,
          activeIndex,
          setActiveIndex,
          orientation,
          direction,
        }}
      >
        <div
          ref={ref}
          tabIndex={0}
          onKeyDownCapture={handleKeyDown}
          className={cn(
            "grid w-full focus:outline-none overflow-hidden",
            className,
            {
              "gap-2": value && value.length > 0,
            }
          )}
          {...props}
        >
          {children}
        </div>
      </FileUploaderContext.Provider>
    );
  }
);

FileUploader.displayName = "FileUploader";

export const FileUploaderContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => {
  const { orientation } = useFileUpload();
  const orientationClass =
    orientation === "horizontal" ? "flex-row" : "flex-col";

  return (
    <div
      className={cn("w-full px-3 py-2 h-32", orientationClass, className)}
      ref={ref}
      {...props}
    >
      {children}
    </div>
  );
});

FileUploaderContent.displayName = "FileUploaderContent";

export const FileUploaderItem = forwardRef<
  HTMLDivElement,
  { index: number } & React.HTMLAttributes<HTMLDivElement>
>(({ className, index, children, ...props }, ref) => {
  const { removeFileFromSet, activeIndex, direction } = useFileUpload();
  const isSelected = index === activeIndex;
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex items-center justify-between gap-2 rounded-md border p-2 transition-colors",
        isSelected ? "border-primary bg-primary/10" : "border-gray-200",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {children}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 hover:bg-red-100"
        onClick={() => removeFileFromSet(index)}
      >
        <X className="h-3 w-3 text-red-500" />
        <span className="sr-only">Remove file</span>
      </Button>
    </div>
  );
});

FileUploaderItem.displayName = "FileUploaderItem";

export const FileInput = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { dropzoneState, isFileTooBig, isLOF } = useFileUpload();
  const rootProps = isLOF ? {} : dropzoneState.getRootProps();
  return (
    <div
      ref={ref}
      {...props}
      className={cn(
        "relative w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors",
        dropzoneState.isDragActive && "border-primary bg-primary/5",
        dropzoneState.isDragReject && "border-red-500 bg-red-50",
        dropzoneState.isDragAccept && "border-green-500 bg-green-50",
        className
      )}
      {...rootProps}
    >
      {isFileTooBig ? (
        <div className="text-red-500">
          <Upload className="mx-auto h-8 w-8 mb-2" />
          <p className="text-sm">File too large</p>
        </div>
      ) : isLOF ? (
        <div className="text-red-500">
          <Upload className="mx-auto h-8 w-8 mb-2" />
          <p className="text-sm">Too many files</p>
        </div>
      ) : (
        children
      )}
      <input {...dropzoneState.getInputProps()} />
    </div>
  );
});

FileInput.displayName = "FileInput";
