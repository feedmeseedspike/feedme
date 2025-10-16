"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { JobApplication, getJobApplications, updateApplicationStatus } from "@/lib/actions/careers.actions";
import { useToast } from "@/hooks/useToast";
import { Download, Mail, Phone, Calendar, Eye, X, AlertCircle } from "lucide-react";

interface ApplicationsModalProps {
  jobId: string;
  onClose: () => void;
}

export default function ApplicationsModal({ jobId, onClose }: ApplicationsModalProps) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, [jobId]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await getJobApplications(jobId);
      setApplications(data);
    } catch (error) {
      showToast("Failed to fetch applications", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: JobApplication['status']) => {
    try {
      await updateApplicationStatus(applicationId, newStatus);
      setApplications(applications.map(app =>
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));
      showToast("Application status updated", "success");
    } catch (error) {
      showToast("Failed to update status", "error");
    }
  };

  const getStatusColor = (status: JobApplication['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewing': return 'bg-blue-100 text-blue-800';
      case 'interviewed': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'hired': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isTestResumeUrl = (url: string) => {
    return url.includes('storage.example.com') || url.includes('example.com') || url.includes('fake');
  };

  const isDataUrl = (url: string) => {
    return url.startsWith('data:');
  };

  const isStorageUrl = (url: string) => {
    return url.includes('supabase') && url.includes('job-applications');
  };

  const handleDownloadResume = (url: string, candidateName: string) => {
    if (isDataUrl(url)) {
      // Handle data URL download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${candidateName.replace(/\s+/g, '_')}_resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (isStorageUrl(url) || !isTestResumeUrl(url)) {
      // Handle Supabase Storage or other real URLs
      window.open(url, '_blank');
    } else {
      // Test URLs - should not be downloadable
      showToast("This is a test resume URL and cannot be downloaded", "error");
    }
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[80vh]">
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B6013]"></div>
            <span className="ml-2">Loading applications...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl">
              Job Applications ({applications.length})
              {applications.length > 0 && applications[0].job && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  - {applications[0].job.title}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {applications.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-400 mb-4">
                  <Mail className="w-16 h-16 mx-auto" />
                </div>
                <p className="text-gray-500 text-lg">No applications yet for this job.</p>
                <p className="text-gray-400 text-sm mt-2">Applications will appear here once candidates apply.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((application) => (
                      <TableRow key={application.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {application.first_name} {application.last_name}
                            </div>
                            {application.cover_letter && (
                              <div className="text-xs text-gray-500 mt-1">
                                Cover letter provided
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3 h-3" />
                              <a
                                href={`mailto:${application.email}`}
                                className="text-blue-600 hover:underline"
                              >
                                {application.email}
                              </a>
                            </div>
                            {application.phone && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Phone className="w-3 h-3" />
                                <a
                                  href={`tel:${application.phone}`}
                                  className="hover:underline"
                                >
                                  {application.phone}
                                </a>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {new Date(application.applied_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={application.status}
                            onValueChange={(value: JobApplication['status']) =>
                              handleStatusChange(application.id, value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <Badge className={getStatusColor(application.status)}>
                                {application.status}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="reviewing">Reviewing</SelectItem>
                              <SelectItem value="interviewed">Interviewed</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="hired">Hired</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedApplication(application)}
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {application.resume_url && (isStorageUrl(application.resume_url) || isDataUrl(application.resume_url)) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadResume(application.resume_url, `${application.first_name} ${application.last_name}`)}
                                title="Download resume"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                            {application.resume_url && isTestResumeUrl(application.resume_url) && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled
                                title="Test resume URL"
                              >
                                <AlertCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detailed View Modal */}
      {selectedApplication && (
        <Dialog open={true} onOpenChange={() => setSelectedApplication(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>
                  {selectedApplication.first_name} {selectedApplication.last_name}
                </DialogTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedApplication(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              {/* Contact Info */}
              <div>
                <h3 className="font-semibold mb-3">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <a
                      href={`mailto:${selectedApplication.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {selectedApplication.email}
                    </a>
                  </div>
                  {selectedApplication.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <a
                        href={`tel:${selectedApplication.phone}`}
                        className="hover:underline"
                      >
                        {selectedApplication.phone}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>Applied: {new Date(selectedApplication.applied_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="font-semibold mb-3">Application Status</h3>
                <Select
                  value={selectedApplication.status}
                  onValueChange={(value: JobApplication['status']) => {
                    handleStatusChange(selectedApplication.id, value);
                    setSelectedApplication({ ...selectedApplication, status: value });
                  }}
                >
                  <SelectTrigger className="w-48">
                    <Badge className={getStatusColor(selectedApplication.status)}>
                      {selectedApplication.status}
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="interviewed">Interviewed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cover Letter */}
              <div>
                <h3 className="font-semibold mb-3">Cover Letter</h3>
                {selectedApplication.cover_letter ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedApplication.cover_letter}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No cover letter provided</p>
                )}
              </div>

              {/* Resume */}
              <div>
                <h3 className="font-semibold mb-3">Resume</h3>
                {selectedApplication.resume_url ? (
                  isTestResumeUrl(selectedApplication.resume_url) ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                          <p className="text-amber-800 text-sm font-medium">
                            Demo Resume File
                          </p>
                          <p className="text-amber-700 text-sm mt-1">
                            This is a test/demo resume URL. In production, implement proper file upload to a storage service like AWS S3, Cloudinary, or Supabase Storage.
                          </p>
                          <p className="text-xs text-amber-600 mt-2 font-mono break-all bg-amber-100 p-2 rounded">
                            {selectedApplication.resume_url}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadResume(selectedApplication.resume_url, `${selectedApplication.first_name} ${selectedApplication.last_name}`)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Resume
                    </Button>
                  )
                ) : (
                  <p className="text-gray-500 italic">No resume uploaded</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}