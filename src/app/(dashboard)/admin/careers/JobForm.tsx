"use client";

import { useState, useEffect } from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import {
  Job,
  createJob,
  updateJob,
  getDepartments,
} from "@/lib/actions/careers.actions";
import { useToast } from "@/hooks/useToast";
import { X, Plus, Trash2 } from "lucide-react";

interface JobFormProps {
  job?: Job | null;
  onClose: () => void;
  onSave: () => void;
}

export default function JobForm({ job, onClose, onSave }: JobFormProps) {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "",
    type: "full-time" as Job["type"],
    experience_level: "mid" as Job["experience_level"],
    description: "",
    requirements: [""],
    responsibilities: [""],
    benefits: [""],
    salary_range: "",
    status: "active" as Job["status"],
    closing_date: "",
  });

  const { showToast } = useToast();

  useEffect(() => {
    // Load departments
    const loadDepartments = async () => {
      try {
        const depts = await getDepartments();
        setDepartments(depts);
      } catch (error) {
        console.error("Failed to load departments:", error);
        showToast("Failed to load departments", "error");
      }
    };

    loadDepartments();
  }, [showToast]);

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title,
        department: job.department,
        location: job.location,
        type: job.type,
        experience_level: job.experience_level,
        description: job.description,
        requirements: job.requirements.length > 0 ? job.requirements : [""],
        responsibilities:
          job.responsibilities.length > 0 ? job.responsibilities : [""],
        benefits: job.benefits.length > 0 ? job.benefits : [""],
        salary_range: job.salary_range || "",
        status: job.status,
        closing_date: job.closing_date ? job.closing_date.split("T")[0] : "",
      });
    }
  }, [job]);

  const handleArrayChange = (
    field: "requirements" | "responsibilities" | "benefits",
    index: number,
    value: string
  ) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayItem = (
    field: "requirements" | "responsibilities" | "benefits"
  ) => {
    setFormData({
      ...formData,
      [field]: [...formData[field], ""],
    });
  };

  const removeArrayItem = (
    field: "requirements" | "responsibilities" | "benefits",
    index: number
  ) => {
    if (formData[field].length > 1) {
      const newArray = formData[field].filter((_, i) => i !== index);
      setFormData({ ...formData, [field]: newArray });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Filter out empty strings from arrays
      const cleanedData = {
        ...formData,
        requirements: formData.requirements.filter((req) => req.trim() !== ""),
        responsibilities: formData.responsibilities.filter(
          (resp) => resp.trim() !== ""
        ),
        benefits: formData.benefits.filter((ben) => ben.trim() !== ""),
        closing_date: formData.closing_date || undefined,
        posted_date: job?.posted_date || new Date().toISOString(),
      };

      if (job) {
        await updateJob(job.id, cleanedData);
        showToast("Job updated successfully", "success");
      } else {
        await createJob(cleanedData);
        showToast("Job created successfully", "success");
      }

      onSave();
    } catch (error) {
      showToast(`Failed to ${job ? "update" : "create"} job`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{job ? "Edit Job" : "Create New Job"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="department">Department *</Label>
              <Select
                value={formData.department}
                onValueChange={(value) =>
                  setFormData({ ...formData, department: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                required
                placeholder="e.g., Lagos, Nigeria"
              />
            </div>

            <div>
              <Label htmlFor="type">Job Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: Job["type"]) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="experience_level">Experience Level *</Label>
              <Select
                value={formData.experience_level}
                onValueChange={(value: Job["experience_level"]) =>
                  setFormData({ ...formData, experience_level: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entry Level</SelectItem>
                  <SelectItem value="mid">Mid Level</SelectItem>
                  <SelectItem value="senior">Senior Level</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: Job["status"]) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="filled">Filled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="salary_range">Salary Range</Label>
              <Input
                id="salary_range"
                value={formData.salary_range}
                onChange={(e) =>
                  setFormData({ ...formData, salary_range: e.target.value })
                }
                placeholder="e.g., ₦200,000 - ₦400,000"
              />
            </div>

            <div>
              <Label htmlFor="closing_date">Closing Date</Label>
              <Input
                id="closing_date"
                type="date"
                value={formData.closing_date}
                onChange={(e) =>
                  setFormData({ ...formData, closing_date: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Job Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              required
            />
          </div>

          {/* Requirements */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Requirements</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem("requirements")}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            {formData.requirements.map((req, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  value={req}
                  onChange={(e) =>
                    handleArrayChange("requirements", index, e.target.value)
                  }
                  placeholder="Enter requirement"
                />
                {formData.requirements.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayItem("requirements", index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Responsibilities */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Responsibilities</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem("responsibilities")}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            {formData.responsibilities.map((resp, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  value={resp}
                  onChange={(e) =>
                    handleArrayChange("responsibilities", index, e.target.value)
                  }
                  placeholder="Enter responsibility"
                />
                {formData.responsibilities.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayItem("responsibilities", index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Benefits</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem("benefits")}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            {formData.benefits.map((benefit, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  value={benefit}
                  onChange={(e) =>
                    handleArrayChange("benefits", index, e.target.value)
                  }
                  placeholder="Enter benefit"
                />
                {formData.benefits.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayItem("benefits", index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#1B6013] hover:bg-[#14510f]"
            >
              {loading ? "Saving..." : job ? "Update Job" : "Create Job"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
