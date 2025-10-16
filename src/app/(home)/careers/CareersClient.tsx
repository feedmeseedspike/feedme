"use client";

import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import {
  MapPin,
  Clock,
  Briefcase,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import { Job } from "@/lib/actions/careers.actions";
import { useRouter } from "next/navigation";

interface CareersClientProps {
  jobs: Job[];
  userApplications: Record<string, string>;
}

export default function CareersClient({
  jobs,
  userApplications,
}: CareersClientProps) {
  const router = useRouter();

  const handleApply = (job: Job) => {
    router.push(`/careers/apply/${job.id}`);
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

  const getExperienceLevel = (level: Job["experience_level"]) => {
    switch (level) {
      case "entry":
        return "Entry Level";
      case "mid":
        return "Mid Level";
      case "senior":
        return "Senior Level";
      case "executive":
        return "Executive";
      default:
        return level;
    }
  };

  const getApplicationStatus = (jobId: string) => {
    return userApplications[jobId] || null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "reviewing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "interviewed":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "hired":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Application Submitted";
      case "reviewing":
        return "Under Review";
      case "interviewed":
        return "Interviewed";
      case "hired":
        return "Hired";
      case "rejected":
        return "Not Selected";
      default:
        return status;
    }
  };

  if (jobs.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="border border-gray-200 rounded-lg p-12">
          <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Open Positions
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            We don&apos;t have any open positions at the moment. Check back soon
            for new opportunities!
          </p>
          <Button variant="outline" asChild>
            <a href="mailto:support@feedme.com.ng">Send Your Resume</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          Open Positions ({jobs.length})
        </h2>
      </div>

      <div className="space-y-4">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {job.title}
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge className={getTypeColor(job.type)}>
                    {job.type.replace("-", " ")}
                  </Badge>
                  <Badge variant="outline">{job.department}</Badge>
                  <Badge variant="outline">
                    {getExperienceLevel(job.experience_level)}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Posted {new Date(job.posted_date).toLocaleDateString()}
                  </div>
                  {/* {job.salary_range && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">💰</span>
                      {job.salary_range}
                    </div>
                  )} */}
                </div>
                <p className="text-gray-700 mb-4">{job.description}</p>

                {job.closing_date && (
                  <div className="mb-3">
                    <p className="text-sm text-amber-700">
                      <strong>Deadline:</strong>{" "}
                      {new Date(job.closing_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              {(() => {
                const applicationStatus = getApplicationStatus(job.id);

                if (applicationStatus) {
                  return (
                    <div className="ml-6 flex flex-col items-end gap-2">
                      <Badge
                        className={`${getStatusColor(applicationStatus)} border`}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {getStatusText(applicationStatus)}
                      </Badge>
                      {applicationStatus === "rejected" && (
                        <Button
                          onClick={() => handleApply(job)}
                          variant="outline"
                          size="sm"
                          className="text-[#1B6013] border-[#1B6013] hover:bg-[#1B6013] hover:text-white"
                        >
                          Apply Again
                          <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  );
                }

                return (
                  <Button
                    onClick={() => handleApply(job)}
                    className="bg-[#1B6013] hover:bg-[#14510f] ml-6"
                  >
                    Apply
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                );
              })()}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
