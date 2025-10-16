import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getJobById } from "@/lib/actions/careers.actions";
import Container from "@components/shared/Container";
import JobApplicationForm from "./JobApplicationForm";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Briefcase,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Metadata } from "next";

interface PageProps {
  params: {
    jobId: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const job = await getJobById(params.jobId);

    if (!job) {
      return {
        title: "Job Not Found | FeedMe Careers",
        description: "The job you're looking for could not be found.",
      };
    }

    const title = `Apply for ${job.title} | FeedMe Careers`;
    const description = job.description
      ? `${job.description.slice(0, 150)}...`
      : `Apply for the ${job.title} position at FeedMe. Join our team in ${job.location} and help build the future of food delivery.`;

    return {
      title,
      description,
      keywords: `${job.title}, ${job.department}, ${job.location}, careers, jobs, FeedMe, ${job.type.replace('-', ' ')}`,
      openGraph: {
        title,
        description,
        url: `https://shopfeedme.com/careers/apply/${params.jobId}`,
        siteName: "FeedMe",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
      alternates: {
        canonical: `https://shopfeedme.com/careers/apply/${params.jobId}`,
      },
    };
  } catch (error) {
    return {
      title: "Job Application | FeedMe Careers",
      description: "Apply for exciting career opportunities at FeedMe and join our growing team.",
    };
  }
}

export default async function JobApplicationPage({ params }: PageProps) {
  let job;

  try {
    job = await getJobById(params.jobId);
  } catch (error) {
    notFound();
  }

  if (!job) {
    notFound();
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "full-time":
        return "bg-green-100 text-green-800 border-green-200";
      case "part-time":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "contract":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "internship":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getExperienceLevel = (level: string) => {
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

  return (
    <div className="min-h-screen bg-white">
      <Container>
        <div className="py-8">
          {/* Back Button */}
          <div className="mb-8">
            <Link
              href="/careers"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-[#1B6013] transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Careers
            </Link>
          </div>

          {/* Job Header */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
            {/* Header Section */}
            <div className="bg-[#1B6013] text-white p-8 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
              <div className="relative z-10">
                <h1 className="text-3xl font-bold mb-4 text-white">
                  {job.title}
                </h1>
                <div className="flex flex-wrap gap-6 text-white/90">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    <span>{job.department}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      Posted {new Date(job.posted_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-4">
                  <Badge className="bg-white text-[#1B6013] hover:bg-gray-50 border-0 font-semibold">
                    {job.type.replace("-", " ")}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                  >
                    {getExperienceLevel(job.experience_level)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-8 space-y-8">
              {/* Job Description */}
              {job.description && (
                <div className="border-l-4 border-[#1B6013] pl-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    About this role
                  </h3>
                  <div className="border border-gray-200 rounded-lg p-6 bg-white">
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {job.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="border-l-4 border-[#1B6013] pl-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Requirements
                  </h3>
                  <div className="border border-gray-200 rounded-lg p-6 bg-white">
                    <ul className="space-y-4">
                      {job.requirements.map((req, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 text-gray-700"
                        >
                          <div className="w-2 h-2 bg-[#1B6013] rounded-full mt-2.5 flex-shrink-0"></div>
                          <span className="leading-relaxed">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Responsibilities */}
              {job.responsibilities && job.responsibilities.length > 0 && (
                <div className="border-l-4 border-[#1B6013] pl-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Responsibilities
                  </h3>
                  <div className="border border-gray-200 rounded-lg p-6 bg-white">
                    <ul className="space-y-4">
                      {job.responsibilities.map((resp, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 text-gray-700"
                        >
                          <div className="w-2 h-2 bg-[#1B6013] rounded-full mt-2.5 flex-shrink-0"></div>
                          <span className="leading-relaxed">{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Benefits */}
              {job.benefits && job.benefits.length > 0 && (
                <div className="border-l-4 border-[#1B6013] pl-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Benefits & Perks
                  </h3>
                  <div className="border border-gray-200 rounded-lg p-6 bg-white">
                    <ul className="space-y-4">
                      {job.benefits.map((benefit, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 text-gray-700"
                        >
                          <div className="w-2 h-2 bg-[#1B6013] rounded-full mt-2.5 flex-shrink-0"></div>
                          <span className="leading-relaxed">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Closing Date */}
              {job.closing_date && (
                <div className="bg-white border-2 border-[#1B6013] rounded-lg p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1B6013] rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#1B6013] text-lg">
                        Application Deadline
                      </p>
                      <p className="text-gray-700 font-medium">
                        {new Date(job.closing_date).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Application Form */}
          <Suspense
            fallback={
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            }
          >
            <JobApplicationForm job={job} />
          </Suspense>
        </div>
      </Container>
    </div>
  );
}
