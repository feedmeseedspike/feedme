"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import { Job, createJobApplication } from "@/lib/actions/careers.actions";
import { useToast } from "@/hooks/useToast";
import { validateFile } from "@/lib/utils/fileUpload";
import { CheckCircle, Upload, X, FileText } from "lucide-react";
import {
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
  FileInput,
} from "@/components/ui/file-upload";

interface JobApplicationFormProps {
  job: Job;
}

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  resume_url: string;
  cover_letter: string;
}

export default function JobApplicationForm({ job }: JobApplicationFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");
  const [files, setFiles] = useState<File[] | null>(null);
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    resume_url: "",
    cover_letter: "",
  });

  const { showToast } = useToast();
  const router = useRouter();

  const STORAGE_KEY = `job-application-${job.id}`;

  // Load saved form data on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
      } catch (error) {
        console.error("Failed to parse saved form data:", error);
      }
    }
  }, [job.id]);

  // Save form data whenever it changes
  useEffect(() => {
    const hasData = Object.values(formData).some(
      (value) => value.trim() !== ""
    );
    if (hasData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData, STORAGE_KEY]);

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (files: File[] | null) => {
    if (!files || files.length === 0) {
      updateFormData("resume_url", "");
      return;
    }

    const file = files[0];
    try {
      setUploadingFile(true);

      // Validate file first
      const validation = validateFile(file);
      if (!validation.valid) {
        showToast(validation.error!, "error");
        setFiles(null);
        return;
      }

      console.log("Using base64 storage for CV...");

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          updateFormData("resume_url", result);
          showToast("Resume uploaded successfully", "success");
        }
      };

      reader.onerror = () => {
        showToast("Failed to upload resume", "error");
        setFiles(null);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("File upload error:", error);
      showToast("Failed to upload resume", "error");
      setFiles(null);
    } finally {
      setUploadingFile(false);
    }
  };

  // Handle file changes from the new file uploader
  const handleFilesChange = (newFiles: File[] | null) => {
    setFiles(newFiles);
    handleFileUpload(newFiles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.resume_url || !files || files.length === 0) {
      showToast("Please upload your resume", "error");
      return;
    }

    setLoading(true);
    try {
      const application = await createJobApplication({
        job_id: job.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || undefined,
        resume_url: formData.resume_url,
        cover_letter: formData.cover_letter || undefined,
        status: "pending",
      });

      // Send confirmation and notification emails
      try {
        console.log("📧 Sending job application emails...");
        await fetch("/api/email/send-job-application", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            applicantEmail: formData.email,
            applicantName: `${formData.first_name} ${formData.last_name}`,
            jobTitle: job.title,
            jobDepartment: job.department,
          }),
        });
        console.log("✅ Job application emails sent");
      } catch (emailError) {
        console.error("❌ Failed to send emails:", emailError);
        // Don't fail the application if email fails
      }

      // Clear saved form data
      localStorage.removeItem(STORAGE_KEY);
      setStep("success");
    } catch (error) {
      showToast("Failed to submit application", "error");
    } finally {
      setLoading(false);
    }
  };

  const clearSavedData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setFiles(null);
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      resume_url: "",
      cover_letter: "",
    });
    showToast("Form data cleared", "success");
  };

  if (step === "success") {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-16 h-16 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Application Submitted Successfully!
        </h2>
        <p className="text-gray-600 mb-6">
          Thank you for your interest in the {job.title} position. We&apos;ve
          received your application and will review it carefully. You should
          hear back from us within 5 business days.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          A confirmation email has been sent to {formData.email}
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => router.push("/careers")} variant="outline">
            Back to Careers
          </Button>
          <Button
            onClick={() => router.push("/")}
            className="bg-[#1B6013] hover:bg-[#14510f]"
          >
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Apply for {job.title}
          </h2>
          <p className="text-gray-600">
            Fill out the form below to submit your application
          </p>
        </div>
        {Object.values(formData).some((value) => value.trim() !== "") && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearSavedData}
            className="text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4 mr-1" />
            Clear Form
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="first_name">First Name *</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => updateFormData("first_name", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="last_name">Last Name *</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => updateFormData("last_name", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData("email", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => updateFormData("phone", e.target.value)}
              placeholder="+234 123 456 7890"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="resume">Resume/CV *</Label>
          <div className="mt-2">
            <FileUploader
              value={files}
              onValueChange={handleFilesChange}
              dropzoneOptions={{
                accept: {
                  "application/pdf": [".pdf"],
                  "application/msword": [".doc"],
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                    [".docx"],
                },
                maxFiles: 1,
                maxSize: 5 * 1024 * 1024, // 5MB
                multiple: false,
              }}
              className="relative bg-background rounded-lg"
            >
              <FileInput className="outline-dashed outline-1 outline-border">
                <div className="flex items-center justify-center flex-col pt-3 pb-4 w-full">
                  {uploadingFile ? (
                    <div className="space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B6013] mx-auto"></div>
                      <p className="text-sm text-gray-600">
                        Uploading resume...
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="mb-1 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, DOC, DOCX (max 5MB)
                      </p>
                    </>
                  )}
                </div>
              </FileInput>
              {files && files.length > 0 && (
                <FileUploaderContent>
                  {files.map((file, i) => (
                    <FileUploaderItem key={i} index={i}>
                      <FileText className="h-4 w-4 stroke-current" />
                      <span>{file.name}</span>
                    </FileUploaderItem>
                  ))}
                </FileUploaderContent>
              )}
            </FileUploader>
          </div>
        </div>

        <div>
          <Label htmlFor="cover_letter">Cover Letter</Label>
          <Textarea
            id="cover_letter"
            value={formData.cover_letter}
            onChange={(e) => updateFormData("cover_letter", e.target.value)}
            rows={5}
            placeholder="Tell us why you're interested in this position and what makes you a great fit..."
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || uploadingFile}
            className="bg-[#1B6013] hover:bg-[#14510f]"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </Button>
        </div>
      </form>
    </div>
  );
}
