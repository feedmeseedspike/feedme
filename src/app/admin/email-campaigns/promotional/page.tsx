"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Percent, CheckCircle2, AlertCircle, Eye, MailCheck, Zap } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ItemSelector } from "@/components/admin/email-campaigns/ItemSelector";

export default function PromotionalCampaignPage() {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<any>({
    subject: "Special Offer: Get 10% Off Your Next Order!",
    saleTitle: "Flash Sale Alert!",
    saleDescription: "Enjoy exclusive discounts on fresh farm produce this weekend only.",
    discountPercentage: 10,
    promoCode: "FLASH10",
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    recipientEmail: "",
    selectedProductIds: [],
  });

  const { showToast } = useToast();

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const response = await fetch("/api/email/campaigns/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignType: "promotional",
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
          campaignType: "promotional",
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
        showToast(`Test promotion sent to ${formData.recipientEmail}`, "success");
      } else {
        setSuccess(true);
        showToast("Promotional campaign sent successfully!", "success");
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
          <h1 className="text-3xl font-bold flex items-center gap-2 text-orange-600">
            <Zap className="w-8 h-8" />
            Flash Promo Campaign
          </h1>
          <p className="text-gray-600">Blast exclusive discount codes and hot deals to your customers.</p>
        </div>
        <div className="flex gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={handlePreview} disabled={previewing}>
                {previewing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                Live Design Tool
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Promotion Live Render</DialogTitle>
                <DialogDescription>Check your discount details and layout before mass-mailing.</DialogDescription>
              </DialogHeader>
              <div className="flex-1 border rounded-md overflow-hidden bg-gray-100">
                {previewHtml ? (
                  <iframe 
                    srcDoc={previewHtml} 
                    className="w-full h-full bg-white shadow-xl" 
                    title="Promo Preview"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <p>Rendering graphics...</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {success && (
        <Card className="mb-6 bg-orange-50 border-orange-200">
          <CardContent className="pt-6 flex items-center gap-4">
            <CheckCircle2 className="w-8 h-8 text-orange-600" />
            <div>
              <h3 className="font-semibold text-orange-800">Promotion Blasted!</h3>
              <p className="text-orange-700">Your special offer is hitting inboxes right now.</p>
            </div>
            <Button variant="outline" className="ml-auto" onClick={() => setSuccess(false)}>
              Launch Another
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
          <Card className="border-orange-100 shadow-sm">
            <CardHeader>
              <CardTitle>Campaign Definition</CardTitle>
              <CardDescription>Define the core parameters of this promotion.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <label className="text-sm font-semibold">In-Inbox Subject</label>
                <Input 
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="e.g. Flash Sale: 20% OFF everything!"
                  className="border-orange-200 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                   <label className="text-sm font-semibold">Sale Header</label>
                   <Input 
                      value={formData.saleTitle}
                      onChange={(e) => setFormData({...formData, saleTitle: e.target.value})}
                      placeholder="e.g. Mid-Week Flash Sale"
                      className="border-orange-200"
                    />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold">Expiry Date Display</label>
                  <Input 
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                    className="border-orange-200"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold">Promotional Offer Message</label>
                <Textarea 
                  value={formData.saleDescription}
                  onChange={(e) => setFormData({...formData, saleDescription: e.target.value})}
                  placeholder="Explain the benefits and details of this offer..."
                  rows={4}
                  className="border-orange-200"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 grid gap-2">
                  <label className="text-sm font-bold text-orange-800">DISCOUNT PERCENTAGE</label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number"
                      value={formData.discountPercentage}
                      onChange={(e) => setFormData({...formData, discountPercentage: parseInt(e.target.value) || 0})}
                      className="text-2xl font-bold border-orange-300"
                    />
                    <span className="text-2xl font-bold text-orange-600">%</span>
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 grid gap-2">
                  <label className="text-sm font-bold text-orange-800">PROMO CODE</label>
                  <Input 
                    value={formData.promoCode}
                    onChange={(e) => setFormData({...formData, promoCode: e.target.value.toUpperCase()})}
                    placeholder="e.g. FLASH20"
                    className="text-2xl font-mono text-center tracking-widest font-bold border-orange-300"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-100 shadow-sm">
            <CardHeader>
              <CardTitle>On-Sale Products</CardTitle>
              <CardDescription>Select specific items to feature in the sale section.</CardDescription>
            </CardHeader>
            <CardContent>
              <ItemSelector 
                type="product"
                title="Search and select items"
                selectedIds={formData.selectedProductIds}
                onChange={(ids) => setFormData({...formData, selectedProductIds: ids})}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-blue-100 bg-blue-50/30 sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MailCheck className="w-5 h-5 text-blue-600" />
                Testing Hub
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase text-blue-600">Admin Email</label>
                  <Input 
                    value={formData.recipientEmail}
                    onChange={(e) => setFormData({...formData, recipientEmail: e.target.value})}
                    placeholder="name@example.com"
                    className="bg-white"
                  />
                </div>
                <Button 
                  className="w-full" 
                  variant="outline"
                  disabled={testing || loading}
                  onClick={() => handleSend(true)}
                >
                  {testing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : "Verify Design (Test)"}
                </Button>
              </div>

              <div className="pt-6 border-t border-blue-100 space-y-4">
                <label className="text-xs font-bold uppercase text-orange-700">Mass Distribution</label>
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white shadow-lg" 
                  disabled={loading || testing}
                  onClick={() => handleSend(false)}
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Disseminating...</>
                  ) : (
                    "Blast to Customers"
                  )}
                </Button>
                <p className="text-[10px] text-center text-gray-500 uppercase tracking-tighter">
                  Sends to all promotional-enabled accounts
                </p>
              </div>

              <Button variant="ghost" className="w-full text-xs" asChild>
                <Link href="/admin/email-campaigns">Back to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
