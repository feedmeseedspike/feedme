"use client";

import { useState, useEffect } from "react";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Plus, Edit, Trash2, Eye, Users } from "lucide-react";
import { Job, getAllJobs, deleteJob, getJobApplications } from "@/lib/actions/careers.actions";
import { useToast } from "@/hooks/useToast";
import JobForm from "./JobForm";
import ApplicationsModal from "./ApplicationsModal";

export default function CareersClient() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [showApplications, setShowApplications] = useState<string | null>(null);
  const [applicationCounts, setApplicationCounts] = useState<Record<string, number>>({});
  const { showToast } = useToast();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const jobsData = await getAllJobs();
      setJobs(jobsData);

      // Fetch application counts for each job
      const counts: Record<string, number> = {};
      for (const job of jobsData) {
        try {
          const applications = await getJobApplications(job.id);
          counts[job.id] = applications.length;
        } catch (error) {
          counts[job.id] = 0;
        }
      }
      setApplicationCounts(counts);
    } catch (error) {
      showToast("Failed to fetch jobs", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job posting?")) return;

    try {
      await deleteJob(jobId);
      setJobs(jobs.filter(job => job.id !== jobId));
      showToast("Job deleted successfully", "success");
    } catch (error) {
      showToast("Failed to delete job", "error");
    }
  };

  const handleJobSaved = () => {
    setShowJobForm(false);
    setEditingJob(null);
    fetchJobs();
  };

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'filled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: Job['type']) => {
    switch (type) {
      case 'full-time': return 'bg-purple-100 text-purple-800';
      case 'part-time': return 'bg-orange-100 text-orange-800';
      case 'contract': return 'bg-yellow-100 text-yellow-800';
      case 'internship': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading jobs...</div>;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Job Postings ({jobs.length})</h2>
        </div>
        <Button
          onClick={() => setShowJobForm(true)}
          className="bg-[#1B6013] hover:bg-[#14510f]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Job
        </Button>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500 mb-4">No job postings yet</p>
            <Button
              onClick={() => setShowJobForm(true)}
              variant="outline"
            >
              Create your first job posting
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg mb-2">{job.title}</CardTitle>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                      <Badge className={getTypeColor(job.type)}>
                        {job.type}
                      </Badge>
                      <Badge variant="outline">{job.department}</Badge>
                      <Badge variant="outline">{job.location}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Posted: {new Date(job.posted_date).toLocaleDateString()}
                      {job.closing_date && (
                        <span className="ml-4">
                          Closes: {new Date(job.closing_date).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowApplications(job.id)}
                    >
                      <Users className="w-4 h-4 mr-1" />
                      {applicationCounts[job.id] || 0}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingJob(job);
                        setShowJobForm(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteJob(job.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 line-clamp-3">{job.description}</p>
                {job.salary_range && (
                  <p className="text-sm text-gray-600 mt-2">
                    Salary: {job.salary_range}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showJobForm && (
        <JobForm
          job={editingJob}
          onClose={() => {
            setShowJobForm(false);
            setEditingJob(null);
          }}
          onSave={handleJobSaved}
        />
      )}

      {showApplications && (
        <ApplicationsModal
          jobId={showApplications}
          onClose={() => setShowApplications(null)}
        />
      )}
    </>
  );
}