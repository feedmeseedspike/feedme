"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Newspaper, CheckCircle2, AlertCircle, Eye, MailCheck } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ItemSelector } from "@/components/admin/email-campaigns/ItemSelector";

export default function NewsletterCampaignPage() {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<any>({
    subject: "Monthly Newsletter - " + new Date().toLocaleString('default', { month: 'long' }),
    newsletterTitle: "Fresh Updates from FeedMe",
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear().toString(),
    mainContent: "Here are our latest updates and seasonal picks just for you!",
    bannerImage: "",
    recipientEmail: "",
    productsHeading: "🥬 Featured This Month",
    bundlesHeading: "🎁 Bundle Deals",
    selectedProductIds: [],
    selectedBundleIds: [],
  });

  const { showToast } = useToast();

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const response = await fetch("/api/email/campaigns/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignType: "newsletter",
          data: {
            ...formData,
            shopUrl: window.location.origin,
          },
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to generate preview");
      setPreviewHtml(data.html);
    } catch (err: any) {
      showToast(err?.message || "Failed to generate preview", "error");
    } finally {
      setPreviewing(false);
    }
  };

  const handleSend = async (isTest: boolean = false) => {
    if (isTest && !formData.recipientEmail) {
      showToast("Please enter a test email address", "error");
      return;
    }

    if (isTest) setTesting(true);
    else setLoading(true);

    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/email/campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignType: "newsletter",
          subject: formData.subject,
          recipients: isTest ? [formData.recipientEmail] : undefined,
          data: {
            ...formData,
            shopUrl: window.location.origin,
          },
          sendImmediately: true,
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to send campaign");

      if (isTest) {
        showToast(`Test email sent to ${formData.recipientEmail}`, "success");
      } else {
        setSuccess(true);
        showToast("Newsletter campaign sent successfully!", "success");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to process request");
      showToast(err?.message || "Failed to process request", "error");
    } finally {
      setLoading(false);
      setTesting(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Newspaper className="w-8 h-8 text-green-600" />
            Newsletter Campaign
          </h1>
          <p className="text-gray-600">Compose, preview, and send an email newsletter to your subscribers.</p>
        </div>
        <div className="flex gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={handlePreview} disabled={previewing}>
                {previewing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                Live Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Email Preview</DialogTitle>
                <DialogDescription>How your newsletter will look in your customer&apos;s inbox.</DialogDescription>
              </DialogHeader>
              <div className="flex-1 border rounded-md overflow-hidden bg-gray-100">
                {previewHtml ? (
                  <iframe 
                    srcDoc={previewHtml} 
                    className="w-full h-full bg-white shadow-inner" 
                    title="Email Preview"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <p>Generating preview...</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {success && (
        <Card className="mb-6 bg-green-50 border-green-200">
          <CardContent className="pt-6 flex items-center gap-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">Campaign Sent!</h3>
              <p className="text-green-700">Your newsletter is on its way to your subscribers.</p>
            </div>
            <Button variant="outline" className="ml-auto" onClick={() => setSuccess(false)}>
              Send Another
            </Button>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <CardContent className="pt-6 flex items-center gap-4 text-red-700">
            <AlertCircle className="w-6 h-6" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Newsletter Content</CardTitle>
              <CardDescription>Customize the header and message of your newsletter.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <label className="text-sm font-semibold">Email Subject Title</label>
                <Input 
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="e.g. October Newsletter - Seasonal Picks"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold">Display Month</label>
                  <Input 
                    value={formData.month}
                    onChange={(e) => setFormData({...formData, month: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold">Display Year</label>
                  <Input 
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold">Newsletter Headline</label>
                <Input 
                  value={formData.newsletterTitle}
                  onChange={(e) => setFormData({...formData, newsletterTitle: e.target.value})}
                  placeholder="The big bold title at the top"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold">Banner Image URL</label>
                <Input 
                  value={formData.bannerImage}
                  onChange={(e) => setFormData({...formData, bannerImage: e.target.value})}
                  placeholder="https://example.com/images/newsletter-banner.jpg"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold">Message Body</label>
                <Textarea 
                  value={formData.mainContent}
                  onChange={(e) => setFormData({...formData, mainContent: e.target.value})}
                  placeholder="Write a message to your subscribers..."
                  rows={8}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Featured Elements</CardTitle>
              <CardDescription>Select products and bundles to showcase in this newsletter.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4 pt-2">
                <div className="grid gap-2">
                   <label className="text-sm font-semibold">Products Section Heading</label>
                   <Input 
                      value={formData.productsHeading}
                      onChange={(e) => setFormData({...formData, productsHeading: e.target.value})}
                    />
                </div>
                <ItemSelector 
                  type="product"
                  title="Featured Products"
                  selectedIds={formData.selectedProductIds}
                  onChange={(ids) => setFormData({...formData, selectedProductIds: ids})}
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="grid gap-2">
                   <label className="text-sm font-semibold">Bundles Section Heading</label>
                   <Input 
                      value={formData.bundlesHeading}
                      onChange={(e) => setFormData({...formData, bundlesHeading: e.target.value})}
                    />
                </div>
                <ItemSelector 
                  type="bundle"
                  title="Featured Bundles"
                  selectedIds={formData.selectedBundleIds}
                  onChange={(ids) => setFormData({...formData, selectedBundleIds: ids})}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-blue-100 bg-blue-50/30 sticky top-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <MailCheck className="w-5 h-5 text-blue-600" />
                Control Board
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase text-blue-800">Test Recipient</label>
                  <Input 
                    value={formData.recipientEmail}
                    onChange={(e) => setFormData({...formData, recipientEmail: e.target.value})}
                    placeholder="name@example.com"
                    className="bg-white border-blue-200"
                  />
                </div>
                <Button 
                  className="w-full shadow-sm" 
                  variant="secondary"
                  disabled={testing || loading}
                  onClick={() => handleSend(true)}
                >
                  {testing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : "Send Test Run"}
                </Button>
              </div>

              <div className="pt-6 border-t border-blue-100 space-y-4">
                <label className="text-xs font-bold uppercase text-gray-500">Global Campaign</label>
                <Button 
                  className="w-full bg-[#1B6013] hover:bg-[#154d0f] shadow-md" 
                  disabled={loading || testing}
                  onClick={() => handleSend(false)}
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    "Launch to Everyone"
                  )}
                </Button>
                <p className="text-[10px] text-center text-gray-500 italic">
                  * This will email all active newsletter subscribers.
                </p>
              </div>

              <Button variant="ghost" className="w-full text-xs" asChild>
                <Link href="/admin/email-campaigns">Discard & Return</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
