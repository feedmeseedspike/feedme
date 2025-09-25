"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import { Badge } from "@components/ui/badge";
import { Job, createJobApplication } from "@/lib/actions/careers.actions";
import { useToast } from "@/hooks/useToast";
import { uploadResume, validateFile } from "@/lib/utils/fileUpload";
import {
  Upload,
  MapPin,
  Briefcase,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface JobApplicationModalProps {
  job: Job;
  open: boolean;
  onClose: () => void;
}

export default function JobApplicationModal({
  job,
  open,
  onClose,
}: JobApplicationModalProps) {
  const [step, setStep] = useState<"details" | "apply" | "success">("details");
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    resume_url: "",
    cover_letter: "",
  });

  const { showToast } = useToast();

  const handleFileUpload = async (file: File) => {
    try {
      setUploadingFile(true);

      // Validate file first
      const validation = validateFile(file);
      if (!validation.valid) {
        showToast(validation.error!, "error");
        return;
      }

      console.log("Starting file upload process...");

      // For now, skip Supabase Storage and go directly to base64 fallback
      // This will work immediately while storage is being set up
      console.log("Using base64 storage (Supabase Storage not configured)...");

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          setFormData({ ...formData, resume_url: result });
          showToast("Resume uploaded successfully", "success");
          console.log("Upload successful via base64");
          setUploadingFile(false);
        }
      };

      reader.onerror = () => {
        showToast("Failed to upload resume", "error");
        console.error("Base64 upload failed");
        setUploadingFile(false);
      };

      reader.readAsDataURL(file);
      return;

      // TODO: Uncomment below when Supabase Storage bucket is properly configured
      /*
      // Try uploading to Supabase Storage first
      const candidateName = `${formData.first_name} ${formData.last_name}` || 'candidate';
      const result = await uploadResume(file, candidateName);

      if (result.success && result.url) {
        setFormData({ ...formData, resume_url: result.url });
        showToast("Resume uploaded successfully", "success");
        console.log('Upload successful via Supabase Storage');
        return;
      }

      // If Supabase Storage fails, fall back to base64
      console.log('Supabase Storage failed, falling back to base64...', result.error);

      if (result.error?.includes('Storage bucket not configured') || result.error?.includes('Bucket not found')) {
        // Fallback to base64 storage
        console.log('Using base64 fallback...');

        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result;
          if (typeof result === 'string') {
            setFormData({ ...formData, resume_url: result });
            showToast("Resume uploaded successfully (local storage)", "success");
            console.log('Upload successful via base64 fallback');
          }
        };

        reader.onerror = () => {
          showToast("Failed to upload resume", "error");
          console.error('Base64 fallback also failed');
        };

        reader.readAsDataURL(file);
      } else {
        showToast(result.error || "Failed to upload resume", "error");
      }
      */
    } catch (error) {
      console.error("File upload error:", error);
      showToast("Failed to upload resume", "error");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.resume_url) {
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

      setStep("success");
    } catch (error) {
      showToast("Failed to submit application", "error");
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: Job["type"]) => {
    switch (type) {
      case "full-time":
        return "bg-green-100 text-green-800";
      case "part-time":
        return "bg-blue-100 text-blue-800";
      case "contract":
        return "bg-yellow-100 text-yellow-800";
      case "internship":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderJobDetails = () => (
    <div className="space-y-6">
      {/* Job Header */}
      <div className="border-b pb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{job.title}</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge className={getTypeColor(job.type)}>
            {job.type.replace("-", " ")}
          </Badge>
          <Badge variant="outline">{job.department}</Badge>
          <Badge variant="outline">{job.experience_level}</Badge>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {job.location}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Posted {new Date(job.posted_date).toLocaleDateString()}
          </div>
          {job.salary_range && (
            <div className="flex items-center gap-1">
              <span className="font-medium">💰</span>
              {job.salary_range}
            </div>
          )}
        </div>
      </div>

      {/* Job Description */}
      <div>
        <h3 className="text-lg font-semibold mb-3">About This Role</h3>
        <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
      </div>

      {/* Requirements */}
      {job.requirements.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Requirements</h3>
          <ul className="space-y-2">
            {job.requirements.map((req, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="w-2 h-2 bg-[#1B6013] rounded-full mt-2 flex-shrink-0"></span>
                <span className="text-gray-700">{req}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Responsibilities */}
      {job.responsibilities.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Responsibilities</h3>
          <ul className="space-y-2">
            {job.responsibilities.map((resp, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="w-2 h-2 bg-[#1B6013] rounded-full mt-2 flex-shrink-0"></span>
                <span className="text-gray-700">{resp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Benefits */}
      {job.benefits.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">What We Offer</h3>
          <ul className="space-y-2">
            {job.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="w-2 h-2 bg-[#1B6013] rounded-full mt-2 flex-shrink-0"></span>
                <span className="text-gray-700">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {job.closing_date && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-800">
            <strong>Application Deadline:</strong>{" "}
            {new Date(job.closing_date).toLocaleDateString()}
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button
          onClick={() => setStep("apply")}
          className="bg-[#1B6013] hover:bg-[#14510f]"
        >
          Apply for This Position
        </Button>
      </div>
    </div>
  );

  const renderApplicationForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Apply for {job.title}</h3>
        <p className="text-gray-600 mb-6">
          Fill out the form below to submit your application. We&apos;ll get back to
          you within 5 business days.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) =>
              setFormData({ ...formData, first_name: e.target.value })
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) =>
              setFormData({ ...formData, last_name: e.target.value })
            }
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
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            placeholder="+234 123 456 7890"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="resume">Resume/CV *</Label>
        <div className="mt-2">
          {formData.resume_url ? (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800">
                Resume uploaded successfully
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData({ ...formData, resume_url: "" })}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {uploadingFile ? (
                <div className="space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B6013] mx-auto"></div>
                  <p className="text-sm text-gray-600">Uploading resume...</p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Upload your resume in PDF or Word format (max 5MB)
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    Accepted formats: .pdf, .doc, .docx
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    className="hidden"
                    id="resume-upload"
                    disabled={uploadingFile}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("resume-upload")?.click()
                    }
                    disabled={uploadingFile}
                  >
                    Choose File
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="cover_letter">Cover Letter</Label>
        <Textarea
          id="cover_letter"
          value={formData.cover_letter}
          onChange={(e) =>
            setFormData({ ...formData, cover_letter: e.target.value })
          }
          rows={5}
          placeholder="Tell us why you're interested in this position and what makes you a great fit..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep("details")}
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-[#1B6013] hover:bg-[#14510f]"
        >
          {loading ? "Submitting..." : "Submit Application"}
        </Button>
      </div>
    </form>
  );

  const renderSuccess = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <CheckCircle className="w-16 h-16 text-green-600" />
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Application Submitted Successfully!
        </h3>
        <p className="text-gray-600 mb-6">
          Thank you for your interest in the {job.title} position. We&apos;ve
          received your application and will review it carefully. You should
          hear back from us within 5 business days.
        </p>
        <p className="text-sm text-gray-500">
          A confirmation email has been sent to {formData.email}
        </p>
      </div>
      <Button onClick={onClose} className="bg-[#1B6013] hover:bg-[#14510f]">
        Close
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "details" && "Job Details"}
            {step === "apply" && "Submit Application"}
            {step === "success" && "Application Submitted"}
          </DialogTitle>
        </DialogHeader>

        {step === "details" && renderJobDetails()}
        {step === "apply" && renderApplicationForm()}
        {step === "success" && renderSuccess()}
      </DialogContent>
    </Dialog>
  );
}
