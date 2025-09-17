"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Mail, Edit, Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";

interface EmailTemplate {
  id: number;
  name: string;
  type: string;
  subject_template: string;
  html_template: string;
  text_template: string;
  variables: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EmailPreview {
  subject: string;
  html: string;
  text: string;
  templateName: string;
  templateType: string;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<EmailPreview | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/email-templates');
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.templates);
      } else {
        showToast(data.error || 'Failed to fetch templates', 'error');
      }
    } catch (error) {
      showToast('Failed to fetch email templates', 'error');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (template: EmailTemplate) => {
    try {
      setPreviewLoading(true);
      const response = await fetch('/api/admin/email-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: template.id,
          campaignData: {} // Can be extended with campaign-specific data
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSelectedPreview(data.preview);
        setPreviewOpen(true);
      } else {
        showToast(data.error || 'Failed to generate preview', 'error');
      }
    } catch (error) {
      showToast('Failed to generate email preview', 'error');
      console.error('Error:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'newsletter':
        return 'bg-blue-100 text-blue-800';
      case 'promotional':
        return 'bg-green-100 text-green-800';
      case 'transactional':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B6013]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-600">Manage your email templates and preview how they look</p>
        </div>
        <Button className="bg-[#1B6013] hover:bg-[#145010]">
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No email templates found</h3>
            <p className="text-gray-600 text-center mb-4">
              Get started by creating your first email template
            </p>
            <Button className="bg-[#1B6013] hover:bg-[#145010]">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge className={getTypeColor(template.type)} variant="secondary">
                    {template.type}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {template.subject_template}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span>Updated {new Date(template.updated_at).toLocaleDateString()}</span>
                  <Badge variant={template.is_active ? "default" : "secondary"}>
                    {template.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview(template)}
                    disabled={previewLoading}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview: {selectedPreview?.templateName}</DialogTitle>
            <DialogDescription>
              Preview how this {selectedPreview?.templateType} email will look to recipients
            </DialogDescription>
          </DialogHeader>
          
          {selectedPreview && (
            <div className="space-y-6">
              {/* Subject Line */}
              <div className="border-b pb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Line
                </label>
                <div className="bg-gray-50 rounded-md p-3 font-medium">
                  {selectedPreview.subject}
                </div>
              </div>

              {/* Email Preview Tabs */}
              <div className="space-y-4">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button className="border-b-2 border-[#1B6013] py-2 px-1 text-sm font-medium text-[#1B6013]">
                      HTML Preview
                    </button>
                    <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                      Text Version
                    </button>
                  </nav>
                </div>

                {/* HTML Preview */}
                <div className="border rounded-lg">
                  <div className="bg-gray-50 px-4 py-2 border-b">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      <span className="ml-4">Email Preview</span>
                    </div>
                  </div>
                  <div 
                    className="p-4 bg-white"
                    dangerouslySetInnerHTML={{ __html: selectedPreview.html }}
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}