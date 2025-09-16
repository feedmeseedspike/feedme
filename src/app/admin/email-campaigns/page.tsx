"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ImageUploadZone from "@/components/admin/ImageUploadZone";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Send,
  Users,
  BarChart3,
  Plus,
  Calendar,
  Eye,
  MousePointer,
  UserX,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Campaign {
  id: string;
  name: string;
  type: string;
  subject: string;
  status: string;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  created_at: string;
}

interface CampaignStats {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalUnsubscribed: number;
}

export default function EmailCampaignsAdmin() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<CampaignStats>({
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalUnsubscribed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [availableBundles, setAvailableBundles] = useState<any[]>([]);
  const [testSending, setTestSending] = useState(false);
  // Recipients state
  const [recipients, setRecipients] = useState<any[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientsPage, setRecipientsPage] = useState(1);
  const recipientsPageSize = 10;
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [editingEmailValue, setEditingEmailValue] = useState<string>("");

  // New campaign form state
  const [campaignData, setCampaignData] = useState({
    type: "newsletter",
    subject: "",
    sendImmediately: true,
    scheduledDate: "",
    scheduledTime: "",
    // Newsletter data
    month: new Date().toLocaleString("default", { month: "long" }),
    year: new Date().getFullYear().toString(),
    selectedProductIds: [] as string[], // Just store product IDs
    selectedBundleIds: [] as string[], // Just store bundle IDs
    newsletterTitle: "",
    mainContent: "", // Single rich text field for all content
    bannerImage: "",
    productsHeading: "🥬 Featured This Month", // Customizable products heading
    bundlesHeading: "🎁 Bundle Deals", // Customizable bundles heading
    // Promotional data
    discountPercentage: 10,
    promoCode: "",
    expiryDate: "",
    saleTitle: "",
    saleDescription: "",
  });

  useEffect(() => {
    fetchCampaigns();
    fetchStats();
    fetchProducts();
    fetchBundles();
    // Preload recipients so the table shows immediately
    loadRecipients();
  }, []);

  const fetchProducts = async () => {
    try {
      // Use the existing products API with "new-arrival" tag to get recent products
      const response = await fetch("/api/products?tag=new-arrival&limit=50");
      const result = await response.json();
      if (result.products) {
        setAvailableProducts(result.products);
      } else {
        console.log("No products found or API returned:", result);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchBundles = async () => {
    try {
      // Use the existing bundles API (note: it returns 'products' field for bundles)
      const response = await fetch("/api/bundles");
      const result = await response.json();
      if (result.products) {
        setAvailableBundles(
          result.products.filter((b: any) => b.is_active !== false)
        );
      }
    } catch (error) {
      console.error("Error fetching bundles:", error);
    }
  };

  const loadRecipients = async () => {
    setRecipientsLoading(true);
    try {
      const res = await fetch("/api/admin/recipients");
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setRecipients(data.recipients);
      setRecipientsPage(1);
    } catch (e: any) {
      alert(e?.message || "Failed to load recipients");
    } finally {
      setRecipientsLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch("/api/admin/campaigns");
      const result = await response.json();

      if (result.success) {
        setCampaigns(result.campaigns);
      } else {
        console.error("Error fetching campaigns:", result.error);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      const result = await response.json();

      if (result.success) {
        const { stats: apiStats } = result;
        setStats({
          totalSent: apiStats.totalSent,
          totalOpened: apiStats.totalOpened,
          totalClicked: apiStats.totalClicked,
          totalUnsubscribed: apiStats.totalUnsubscribed,
        });
      } else {
        console.error("Error fetching stats:", result.error);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const previewCampaign = async () => {
    setPreviewLoading(true);
    try {
      // Get the appropriate template ID based on campaign type
      const templateType = campaignData.type;

      // First get templates to find the right one
      const templatesResponse = await fetch("/api/admin/email-templates");
      const templatesResult = await templatesResponse.json();

      if (!templatesResult.success) {
        alert("Error fetching templates");
        return;
      }

      const template = templatesResult.templates.find(
        (t: any) => t.type === templateType
      );
      if (!template) {
        alert(`No template found for ${templateType} campaigns`);
        return;
      }

      // Generate preview with current campaign data
      const previewResponse = await fetch("/api/admin/email-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: template.id,
          campaignData:
            campaignData.type === "newsletter"
              ? {
                  month: campaignData.month,
                  year: campaignData.year,
                  selectedProductIds: campaignData.selectedProductIds,
                  selectedBundleIds: campaignData.selectedBundleIds,
                  newsletterTitle: campaignData.newsletterTitle,
                  mainContent: campaignData.mainContent,
                  bannerImage: campaignData.bannerImage,
                  productsHeading: campaignData.productsHeading,
                  bundlesHeading: campaignData.bundlesHeading,
                  customSubject: campaignData.subject, // Override template subject
                }
              : {
                  discountPercentage:
                    campaignData.discountPercentage.toString(),
                  promoCode: campaignData.promoCode,
                  expiryDate: campaignData.expiryDate,
                  saleTitle: campaignData.saleTitle,
                  saleDescription: campaignData.saleDescription,
                },
        }),
      });

      const previewResult = await previewResponse.json();

      if (previewResult.success) {
        setPreviewData(previewResult.preview);
        setPreviewOpen(true);
      } else {
        alert(`Error generating preview: ${previewResult.error}`);
      }
    } catch (error) {
      console.error("Error generating preview:", error);
      alert("Failed to generate preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const sendTestNewsletter = async () => {
    if (campaignData.type !== "newsletter") return;

    setTestSending(true);
    try {
      const response = await fetch("/api/email/test-newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignData: {
            subject: campaignData.subject,
            month: campaignData.month,
            year: campaignData.year,
            selectedProductIds: campaignData.selectedProductIds,
            selectedBundleIds: campaignData.selectedBundleIds,
            newsletterTitle: campaignData.newsletterTitle,
            mainContent: campaignData.mainContent,
            bannerImage: campaignData.bannerImage,
            productsHeading: campaignData.productsHeading,
            bundlesHeading: campaignData.bundlesHeading,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(
          "Test newsletter sent to oyedelejeremiah.ng@gmail.com! Check your email (including spam folder)."
        );
      } else {
        alert(`Error sending test: ${result.error}`);
      }
    } catch (error) {
      console.error("Error sending test newsletter:", error);
      alert("Failed to send test newsletter");
    } finally {
      setTestSending(false);
    }
  };

  const sendCampaign = async () => {
    setSending(true);
    try {
      const payload = {
        campaignType: campaignData.type,
        subject: campaignData.subject,
        sendImmediately: campaignData.sendImmediately,
        scheduledAt: !campaignData.sendImmediately
          ? `${campaignData.scheduledDate}T${campaignData.scheduledTime}:00Z`
          : undefined,
        data:
          campaignData.type === "newsletter"
            ? {
                month: campaignData.month,
                year: campaignData.year,
                selectedProductIds: campaignData.selectedProductIds,
                selectedBundleIds: campaignData.selectedBundleIds,
                newsletterTitle: campaignData.newsletterTitle,
                mainContent: campaignData.mainContent,
                bannerImage: campaignData.bannerImage,
              }
            : {
                discountPercentage: campaignData.discountPercentage,
                promoCode: campaignData.promoCode,
                expiryDate: campaignData.expiryDate,
                saleTitle: campaignData.saleTitle,
                saleDescription: campaignData.saleDescription,
              },
      };

      const response = await fetch("/api/email/campaigns/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        alert(
          `Campaign ${campaignData.sendImmediately ? "sent" : "scheduled"} successfully!`
        );
        fetchCampaigns();
        fetchStats();
        // Reset form
        setCampaignData({
          ...campaignData,
          subject: "",
          selectedProductIds: [],
          selectedBundleIds: [],
          newsletterTitle: "",
          mainContent: "",
          bannerImage: "",
          productsHeading: "🥬 Featured This Month",
          bundlesHeading: "🎁 Bundle Deals",
          promoCode: "",
          saleTitle: "",
          saleDescription: "",
        });
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error sending campaign:", error);
      alert("Failed to send campaign");
    } finally {
      setSending(false);
    }
  };

  const toggleProductSelection = (productId: string) => {
    const isSelected = campaignData.selectedProductIds.includes(productId);
    setCampaignData({
      ...campaignData,
      selectedProductIds: isSelected
        ? campaignData.selectedProductIds.filter((id) => id !== productId)
        : [...campaignData.selectedProductIds, productId],
    });
  };

  const toggleBundleSelection = (bundleId: string) => {
    const isSelected = campaignData.selectedBundleIds.includes(bundleId);
    setCampaignData({
      ...campaignData,
      selectedBundleIds: isSelected
        ? campaignData.selectedBundleIds.filter((id) => id !== bundleId)
        : [...campaignData.selectedBundleIds, bundleId],
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section - matching order email style */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto p-6">
          <div className="text-center">
            <img
              src="https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png"
              alt="FeedMe Logo"
              className="h-10 mx-auto mb-3"
            />
            <h1 className="text-2xl font-bold text-[#1B6013] mb-2">
              Email Campaign Manager
            </h1>
            <p className="text-gray-600">
              Send newsletters and promotional emails to your customers
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Stats Cards - order email style */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-[#1B6013] mb-6">
            📊 Campaign Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">📧</div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalSent.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Sent</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">👁️</div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalOpened.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Opened</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalSent > 0
                  ? ((stats.totalOpened / stats.totalSent) * 100).toFixed(1)
                  : "0.0"}
                % open rate
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">🔗</div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalClicked.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Clicked</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalOpened > 0
                  ? ((stats.totalClicked / stats.totalOpened) * 100).toFixed(1)
                  : "0.0"}
                % click rate
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">❌</div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalUnsubscribed}
              </p>
              <p className="text-sm text-gray-600">Unsubscribed</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalSent > 0
                  ? ((stats.totalUnsubscribed / stats.totalSent) * 100).toFixed(
                      2
                    )
                  : "0.00"}
                % unsub rate
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="create" className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger
                value="create"
                className="text-[#1B6013] data-[state=active]:bg-[#1B6013] data-[state=active]:text-white"
              >
                📝 Create Campaign
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="text-[#1B6013] data-[state=active]:bg-[#1B6013] data-[state=active]:text-white"
              >
                📋 Campaign History
              </TabsTrigger>
              <TabsTrigger
                value="recipients"
                className="text-[#1B6013] data-[state=active]:bg-[#1B6013] data-[state=active]:text-white"
              >
                📧 Recipients
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="create" className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-[#1B6013] mb-2">
                  ✉️ Create New Email Campaign
                </h2>
                <p className="text-gray-600">
                  Send newsletters or promotional emails to your customers
                </p>
              </div>

              <div className="space-y-6">
                {/* Campaign Type */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    📧 Campaign Type
                  </h3>
                  <Select
                    value={campaignData.type}
                    onValueChange={(value) =>
                      setCampaignData({ ...campaignData, type: value })
                    }
                  >
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="Select campaign type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newsletter">📰 Newsletter</SelectItem>
                      <SelectItem value="promotional">
                        🎯 Promotional
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Subject Line */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <label className="text-sm font-semibold text-gray-900">
                    ✏️ Email Subject Line
                  </label>

                  {/* Quick Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCampaignData({
                          ...campaignData,
                          subject: `🌿 Your fresh products of the day - ${campaignData.month} ${campaignData.year}`,
                        })
                      }
                      className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-[#1B6013] text-sm"
                    >
                      🌿 Your fresh products of the day - {campaignData.month}{" "}
                      {campaignData.year}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCampaignData({
                          ...campaignData,
                          subject: `🥬 Fresh updates from FeedMe - ${campaignData.month}`,
                        })
                      }
                      className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-[#1B6013] text-sm"
                    >
                      🥬 Fresh updates from FeedMe - {campaignData.month}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCampaignData({
                          ...campaignData,
                          subject: `🌱 What’s fresh this ${campaignData.month}?`,
                        })
                      }
                      className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-[#1B6013] text-sm"
                    >
                      🌱 What’s fresh this {campaignData.month}?
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCampaignData({
                          ...campaignData,
                          subject: `🛒 Fresh produce just arrived - ${campaignData.month}`,
                        })
                      }
                      className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-[#1B6013] text-sm"
                    >
                      🛒 Fresh produce just arrived - {campaignData.month}
                    </button>
                  </div>

                  {/* Custom Input */}
                  <div className="space-y-2">
                    <label className="text-xs text-gray-600">
                      Or write your own:
                    </label>
                    <Input
                      placeholder="Enter custom subject line..."
                      value={campaignData.subject}
                      onChange={(e) =>
                        setCampaignData({
                          ...campaignData,
                          subject: e.target.value,
                        })
                      }
                      className="border-gray-300"
                    />
                  </div>
                </div>

                {/* Newsletter Fields */}
                {campaignData.type === "newsletter" && (
                  <div className="space-y-6">
                    {/* Basic Newsletter Info */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-[#1B6013] mb-4">
                        📝 Basic Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Month
                          </label>
                          <Input
                            value={campaignData.month}
                            onChange={(e) =>
                              setCampaignData({
                                ...campaignData,
                                month: e.target.value,
                              })
                            }
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Year
                          </label>
                          <Input
                            value={campaignData.year}
                            onChange={(e) =>
                              setCampaignData({
                                ...campaignData,
                                year: e.target.value,
                              })
                            }
                            className="w-full"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Newsletter Title{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <Input
                            placeholder="e.g., Fresh Updates from FeedMe"
                            value={campaignData.newsletterTitle}
                            onChange={(e) =>
                              setCampaignData({
                                ...campaignData,
                                newsletterTitle: e.target.value,
                              })
                            }
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Newsletter Content */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-[#1B6013] mb-6">
                        📝 Newsletter Content
                      </h3>

                      <div className="space-y-8">
                        {/* Banner Image */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Newsletter Banner
                          </label>
                          <p className="text-xs text-gray-500 mb-3">
                            Optional header image for your newsletter
                          </p>
                          <ImageUploadZone
                            onImageUploaded={(url) =>
                              setCampaignData({
                                ...campaignData,
                                bannerImage: url,
                              })
                            }
                            onImageRemoved={() =>
                              setCampaignData({
                                ...campaignData,
                                bannerImage: "",
                              })
                            }
                            initialImage={campaignData.bannerImage}
                            title="Upload Banner Image"
                            description="Recommended: 600x200px for best results"
                            className="w-full"
                          />
                        </div>

                        {/* Main Content with Rich Text */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Newsletter Content{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <p className="text-xs text-gray-500 mb-3">
                            Write your complete newsletter content - supports
                            rich text, images, links, lists, recipes, cooking
                            tips, etc.
                          </p>
                          <RichTextEditor
                            value={campaignData.mainContent}
                            onChange={(value) =>
                              setCampaignData({
                                ...campaignData,
                                mainContent: value,
                              })
                            }
                            placeholder="Write your complete newsletter content here... You can include:
• Welcome message
• Product highlights
• Cooking tips and recipes
• Storage advice
• Seasonal information
• Special announcements

Use the toolbar to format text, add images, create lists, and insert links!"
                            height="300px"
                            showImageUpload={true}
                            resizable={true}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section Headings */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-[#1B6013] mb-4">
                        🏷️ Section Headings
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Products Section Title
                          </label>
                          <Input
                            placeholder="e.g., 🥬 Featured This Month"
                            value={campaignData.productsHeading}
                            onChange={(e) =>
                              setCampaignData({
                                ...campaignData,
                                productsHeading: e.target.value,
                              })
                            }
                            className="border-gray-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Bundles Section Title
                          </label>
                          <Input
                            placeholder="e.g., 🎁 Bundle Deals"
                            value={campaignData.bundlesHeading}
                            onChange={(e) =>
                              setCampaignData({
                                ...campaignData,
                                bundlesHeading: e.target.value,
                              })
                            }
                            className="border-gray-300"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Product & Bundle Selection */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-[#1B6013] mb-6">
                        🛒 Featured Items
                      </h3>

                      <div className="space-y-8">
                        {/* Products Section */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <label className="text-sm font-medium text-gray-700">
                              Select Products to Feature
                            </label>
                            <span className="text-xs text-gray-500">
                              Optional - Selected:{" "}
                              {campaignData.selectedProductIds.length}
                            </span>
                          </div>
                          <div className="border border-gray-200 rounded-lg">
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-1 max-h-80 overflow-y-auto p-4">
                              {availableProducts.length > 0 ? (
                                availableProducts.map((product) => (
                                  <div
                                    key={product.id}
                                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                      campaignData.selectedProductIds.includes(
                                        product.id
                                      )
                                        ? "bg-green-50 border-green-300 shadow-sm"
                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                    onClick={() =>
                                      toggleProductSelection(product.id)
                                    }
                                  >
                                    <input
                                      type="checkbox"
                                      checked={campaignData.selectedProductIds.includes(
                                        product.id
                                      )}
                                      readOnly
                                      className="rounded text-[#1B6013] focus:ring-[#1B6013]"
                                    />
                                    <img
                                      src={
                                        product.images?.[0] ||
                                        "/placeholder-product.jpg"
                                      }
                                      alt={product.name}
                                      className="w-16 h-16 object-cover rounded-lg shadow-sm"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-gray-900 truncate">
                                        {product.name}
                                      </p>
                                      <p className="text-sm font-medium text-[#1B6013]">
                                        ₦{product.price?.toLocaleString()}
                                      </p>
                                      <p className="text-xs text-gray-500 truncate">
                                        {product.description ||
                                          "No description"}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-full text-center py-8 text-gray-500">
                                  <p>No products available</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bundles Section */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <label className="text-sm font-medium text-gray-700">
                              Select Bundles to Feature
                            </label>
                            <span className="text-xs text-gray-500">
                              Optional - Selected:{" "}
                              {campaignData.selectedBundleIds.length}
                            </span>
                          </div>
                          <div className="border border-gray-200 rounded-lg">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 max-h-64 overflow-y-auto p-4">
                              {availableBundles.length > 0 ? (
                                availableBundles.map((bundle) => (
                                  <div
                                    key={bundle.id}
                                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                      campaignData.selectedBundleIds.includes(
                                        bundle.id
                                      )
                                        ? "bg-green-50 border-green-300 shadow-sm"
                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                    onClick={() =>
                                      toggleBundleSelection(bundle.id)
                                    }
                                  >
                                    <input
                                      type="checkbox"
                                      checked={campaignData.selectedBundleIds.includes(
                                        bundle.id
                                      )}
                                      readOnly
                                      className="rounded text-[#1B6013] focus:ring-[#1B6013]"
                                    />
                                    <img
                                      src={
                                        bundle.images?.[0] ||
                                        bundle.image_url ||
                                        "/placeholder-bundle.jpg"
                                      }
                                      alt={bundle.name}
                                      className="w-16 h-16 object-cover rounded-lg shadow-sm"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-gray-900 truncate">
                                        {bundle.name}
                                      </p>
                                      <p className="text-sm font-medium text-[#1B6013]">
                                        ₦{bundle.price?.toLocaleString()}
                                      </p>
                                      <p className="text-xs text-gray-500 truncate">
                                        {bundle.description || "Bundle deal"}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-full text-center py-8 text-gray-500">
                                  <p>No bundles available</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Promotional Fields */}
                {campaignData.type === "promotional" && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#1B6013] mb-6">
                      🎯 Promotional Details
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            💰 Discount Percentage
                          </label>
                          <Input
                            type="number"
                            value={campaignData.discountPercentage}
                            onChange={(e) =>
                              setCampaignData({
                                ...campaignData,
                                discountPercentage: Number(e.target.value),
                              })
                            }
                            className="border-gray-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            🏷️ Promo Code
                          </label>
                          <Input
                            placeholder="e.g., FRESH20"
                            value={campaignData.promoCode}
                            onChange={(e) =>
                              setCampaignData({
                                ...campaignData,
                                promoCode: e.target.value,
                              })
                            }
                            className="border-gray-300"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          📢 Sale Title
                        </label>
                        <Input
                          placeholder="e.g., Fresh Farm Sale"
                          value={campaignData.saleTitle}
                          onChange={(e) =>
                            setCampaignData({
                              ...campaignData,
                              saleTitle: e.target.value,
                            })
                          }
                          className="border-gray-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          📝 Sale Description
                        </label>
                        <Textarea
                          placeholder="Describe your sale..."
                          value={campaignData.saleDescription}
                          onChange={(e) =>
                            setCampaignData({
                              ...campaignData,
                              saleDescription: e.target.value,
                            })
                          }
                          className="border-gray-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          📅 Expiry Date
                        </label>
                        <Input
                          placeholder="e.g., December 31, 2024"
                          value={campaignData.expiryDate}
                          onChange={(e) =>
                            setCampaignData({
                              ...campaignData,
                              expiryDate: e.target.value,
                            })
                          }
                          className="border-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Scheduling */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-[#1B6013] mb-4">
                    ⏰ Campaign Scheduling
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="sendImmediately"
                        checked={campaignData.sendImmediately}
                        onChange={(e) =>
                          setCampaignData({
                            ...campaignData,
                            sendImmediately: e.target.checked,
                          })
                        }
                        className="rounded text-[#1B6013] focus:ring-[#1B6013]"
                      />
                      <label
                        htmlFor="sendImmediately"
                        className="text-sm font-medium text-gray-700"
                      >
                        📤 Send immediately
                      </label>
                    </div>

                    {!campaignData.sendImmediately && (
                      <div className="grid grid-cols-2 gap-4 bg-white rounded-lg p-4 border border-gray-200">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            📅 Schedule Date
                          </label>
                          <Input
                            type="date"
                            value={campaignData.scheduledDate}
                            onChange={(e) =>
                              setCampaignData({
                                ...campaignData,
                                scheduledDate: e.target.value,
                              })
                            }
                            className="border-gray-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            🕐 Schedule Time
                          </label>
                          <Input
                            type="time"
                            value={campaignData.scheduledTime}
                            onChange={(e) =>
                              setCampaignData({
                                ...campaignData,
                                scheduledTime: e.target.value,
                              })
                            }
                            className="border-gray-300"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-white border-t border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-[#1B6013] mb-4">
                    🚀 Campaign Actions
                  </h3>
                  <div className="flex gap-3">
                    <Button
                      onClick={previewCampaign}
                      disabled={previewLoading || !campaignData.subject}
                      variant="outline"
                      className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      {previewLoading ? "⏳ Generating..." : "👁️ Preview Email"}
                    </Button>

                    {campaignData.type === "newsletter" && (
                      <Button
                        onClick={sendTestNewsletter}
                        disabled={
                          testSending ||
                          !campaignData.newsletterTitle ||
                          !campaignData.mainContent
                        }
                        variant="outline"
                        className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        {testSending ? "⏳ Sending Test..." : "🧪 Send Test"}
                      </Button>
                    )}

                    <Button
                      onClick={sendCampaign}
                      disabled={sending || !campaignData.subject}
                      className="flex-1 bg-[#1B6013] hover:bg-[#1B6013]/90 text-white"
                    >
                      {sending
                        ? "⏳ Sending..."
                        : campaignData.sendImmediately
                          ? "📤 Send Campaign"
                          : "📅 Schedule Campaign"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-[#1B6013] mb-2">
                  📋 Campaign History
                </h2>
                <p className="text-gray-600">
                  View past email campaigns and their performance
                </p>
              </div>

              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">
                            {campaign.subject}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              campaign.type === "newsletter"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {campaign.type === "newsletter" ? "📰" : "🎯"}{" "}
                            {campaign.type}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              campaign.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {campaign.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          📅 Sent on{" "}
                          {new Date(campaign.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="grid grid-cols-4 gap-6 text-sm">
                        <div className="text-center bg-white rounded-lg p-3 border">
                          <p className="font-medium text-gray-900">
                            {campaign.sent_count}
                          </p>
                          <p className="text-xs text-gray-600">📧 Sent</p>
                        </div>
                        <div className="text-center bg-white rounded-lg p-3 border">
                          <p className="font-medium text-gray-900">
                            {campaign.opened_count}
                          </p>
                          <p className="text-xs text-gray-600">👁️ Opened</p>
                        </div>
                        <div className="text-center bg-white rounded-lg p-3 border">
                          <p className="font-medium text-gray-900">
                            {campaign.clicked_count}
                          </p>
                          <p className="text-xs text-gray-600">🔗 Clicked</p>
                        </div>
                        <div className="text-center bg-white rounded-lg p-3 border">
                          <p className="font-medium text-[#1B6013]">
                            {(
                              (campaign.opened_count / campaign.sent_count) *
                              100
                            ).toFixed(1)}
                            %
                          </p>
                          <p className="text-xs text-gray-600">📊 Open Rate</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="recipients" className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-[#1B6013]">
                    📧 Recipients
                  </h2>
                  <p className="text-gray-600 text-sm">
                    List of users opted into emails
                  </p>
                </div>
                <button
                  className="px-3 py-2 text-sm border rounded-md"
                  onClick={loadRecipients}
                >
                  {recipientsLoading ? "Loading..." : "Refresh"}
                </button>
              </div>
              {/* Controls */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <Input
                  placeholder="Search by email or name..."
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  className="max-w-sm border-gray-300"
                />
                <span className="text-xs text-gray-500">
                  Total: {recipients.length}
                </span>
              </div>

              {/* Content */}
              {recipientsLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading
                  recipients...
                </div>
              ) : recipients.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Click Refresh to load recipients.
                </p>
              ) : (
                <>
                  {/* Table */}
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Newsletter
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Promotional
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Transactional
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Updated
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(() => {
                          const filtered = recipients.filter((r: any) => {
                            const q = recipientSearch.toLowerCase();
                            return (
                              r.email?.toLowerCase().includes(q) ||
                              r.name?.toLowerCase().includes(q)
                            );
                          });
                          const totalPages = Math.max(
                            1,
                            Math.ceil(filtered.length / recipientsPageSize)
                          );
                          const pageStart =
                            (recipientsPage - 1) * recipientsPageSize;
                          const pageItems = filtered.slice(
                            pageStart,
                            pageStart + recipientsPageSize
                          );
                          return (
                            <>
                              {pageItems.map((r: any) => (
                                <tr key={r.userId}>
                                  <td className="px-4 py-2 text-sm text-gray-900">
                                    {editingEmailId === r.userId ? (
                                      <div className="flex items-center gap-2">
                                        <Input
                                          value={editingEmailValue}
                                          onChange={(e) =>
                                            setEditingEmailValue(e.target.value)
                                          }
                                          className="h-8"
                                        />
                                        <button
                                          className="px-2 py-1 text-xs border rounded"
                                          onClick={async () => {
                                            try {
                                              const res = await fetch(
                                                "/api/admin/recipients",
                                                {
                                                  method: "PATCH",
                                                  headers: {
                                                    "Content-Type":
                                                      "application/json",
                                                  },
                                                  body: JSON.stringify({
                                                    userId: r.userId,
                                                    email: editingEmailValue,
                                                  }),
                                                }
                                              );
                                              const data = await res.json();
                                              if (!data.success)
                                                throw new Error(data.error);
                                              setRecipients((prev) =>
                                                prev.map((x: any) =>
                                                  x.userId === r.userId
                                                    ? {
                                                        ...x,
                                                        email:
                                                          editingEmailValue,
                                                      }
                                                    : x
                                                )
                                              );
                                              setEditingEmailId(null);
                                            } catch (e: any) {
                                              alert(
                                                e?.message ||
                                                  "Failed to update email"
                                              );
                                            }
                                          }}
                                        >
                                          Save
                                        </button>
                                        <button
                                          className="px-2 py-1 text-xs border rounded"
                                          onClick={() =>
                                            setEditingEmailId(null)
                                          }
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      r.email
                                    )}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-700">
                                    {editingEmailId === `name-${r.userId}` ? (
                                      <div className="flex items-center gap-2">
                                        <Input
                                          value={editingEmailValue}
                                          onChange={(e) =>
                                            setEditingEmailValue(e.target.value)
                                          }
                                          className="h-8"
                                        />
                                        <button
                                          className="px-2 py-1 text-xs border rounded"
                                          onClick={async () => {
                                            try {
                                              const res = await fetch(
                                                "/api/admin/recipients",
                                                {
                                                  method: "PATCH",
                                                  headers: {
                                                    "Content-Type":
                                                      "application/json",
                                                  },
                                                  body: JSON.stringify({
                                                    userId: r.userId,
                                                    display_name:
                                                      editingEmailValue,
                                                  }),
                                                }
                                              );
                                              const data = await res.json();
                                              if (!data.success)
                                                throw new Error(data.error);
                                              setRecipients((prev) =>
                                                prev.map((x: any) =>
                                                  x.userId === r.userId
                                                    ? {
                                                        ...x,
                                                        name: editingEmailValue,
                                                      }
                                                    : x
                                                )
                                              );
                                              setEditingEmailId(null);
                                            } catch (e: any) {
                                              alert(
                                                e?.message ||
                                                  "Failed to update name"
                                              );
                                            }
                                          }}
                                        >
                                          Save
                                        </button>
                                        <button
                                          className="px-2 py-1 text-xs border rounded"
                                          onClick={() =>
                                            setEditingEmailId(null)
                                          }
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <span>{r.name || "-"}</span>
                                        <button
                                          className="px-2 py-1 text-xs border rounded"
                                          onClick={() => {
                                            setEditingEmailId(
                                              `name-${r.userId}`
                                            );
                                            setEditingEmailValue(r.name || "");
                                          }}
                                        >
                                          Edit Name
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                      <button
                                        className="px-2 py-1 text-xs border rounded"
                                        onClick={() => {
                                          setEditingEmailId(r.userId);
                                          setEditingEmailValue(r.email || "");
                                        }}
                                      >
                                        Edit Email
                                      </button>
                                      <button
                                        className="px-2 py-1 text-xs border rounded"
                                        onClick={async () => {
                                          try {
                                            const res = await fetch(
                                              "/api/admin/recipients",
                                              {
                                                method: "PATCH",
                                                headers: {
                                                  "Content-Type":
                                                    "application/json",
                                                },
                                                body: JSON.stringify({
                                                  userId: r.userId,
                                                  preferences: {
                                                    newsletter_enabled:
                                                      !r.preferences
                                                        ?.newsletter_enabled,
                                                  },
                                                }),
                                              }
                                            );
                                            const data = await res.json();
                                            if (!data.success)
                                              throw new Error(data.error);
                                            await loadRecipients();
                                          } catch (e: any) {
                                            alert(
                                              e?.message || "Failed to toggle"
                                            );
                                          }
                                        }}
                                      >
                                        Toggle Newsletter
                                      </button>
                                      <button
                                        className="px-2 py-1 text-xs border rounded"
                                        onClick={async () => {
                                          try {
                                            const res = await fetch(
                                              "/api/admin/recipients",
                                              {
                                                method: "PATCH",
                                                headers: {
                                                  "Content-Type":
                                                    "application/json",
                                                },
                                                body: JSON.stringify({
                                                  userId: r.userId,
                                                  preferences: {
                                                    promotional_enabled:
                                                      !r.preferences
                                                        ?.promotional_enabled,
                                                  },
                                                }),
                                              }
                                            );
                                            const data = await res.json();
                                            if (!data.success)
                                              throw new Error(data.error);
                                            await loadRecipients();
                                          } catch (e: any) {
                                            alert(
                                              e?.message || "Failed to toggle"
                                            );
                                          }
                                        }}
                                      >
                                        Toggle Promotional
                                      </button>
                                      <button
                                        className="px-2 py-1 text-xs border rounded"
                                        onClick={async () => {
                                          try {
                                            const res = await fetch(
                                              "/api/admin/recipients",
                                              {
                                                method: "PATCH",
                                                headers: {
                                                  "Content-Type":
                                                    "application/json",
                                                },
                                                body: JSON.stringify({
                                                  userId: r.userId,
                                                  preferences: {
                                                    transactional_enabled:
                                                      !r.preferences
                                                        ?.transactional_enabled,
                                                  },
                                                }),
                                              }
                                            );
                                            const data = await res.json();
                                            if (!data.success)
                                              throw new Error(data.error);
                                            await loadRecipients();
                                          } catch (e: any) {
                                            alert(
                                              e?.message || "Failed to toggle"
                                            );
                                          }
                                        }}
                                      >
                                        Toggle Transactional
                                      </button>
                                      <button
                                        className="px-2 py-1 text-xs border rounded text-red-700"
                                        onClick={async () => {
                                          if (
                                            !confirm(
                                              "Remove this recipient (disable all emails)?"
                                            )
                                          )
                                            return;
                                          try {
                                            const res = await fetch(
                                              "/api/admin/recipients",
                                              {
                                                method: "DELETE",
                                                headers: {
                                                  "Content-Type":
                                                    "application/json",
                                                },
                                                body: JSON.stringify({
                                                  userId: r.userId,
                                                }),
                                              }
                                            );
                                            const data = await res.json();
                                            if (!data.success)
                                              throw new Error(data.error);
                                            await loadRecipients();
                                          } catch (e: any) {
                                            alert(
                                              e?.message ||
                                                "Failed to remove recipient"
                                            );
                                          }
                                        }}
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2">
                                    <Badge
                                      variant={
                                        r.preferences?.newsletter_enabled
                                          ? "default"
                                          : "secondary"
                                      }
                                    >
                                      {r.preferences?.newsletter_enabled
                                        ? "Yes"
                                        : "No"}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-2">
                                    <Badge
                                      variant={
                                        r.preferences?.promotional_enabled
                                          ? "default"
                                          : "secondary"
                                      }
                                    >
                                      {r.preferences?.promotional_enabled
                                        ? "Yes"
                                        : "No"}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-2">
                                    <Badge
                                      variant={
                                        r.preferences?.transactional_enabled
                                          ? "default"
                                          : "secondary"
                                      }
                                    >
                                      {r.preferences?.transactional_enabled
                                        ? "Yes"
                                        : "No"}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-500">
                                    {r.preferences?.updated_at
                                      ? new Date(
                                          r.preferences.updated_at
                                        ).toLocaleDateString()
                                      : "-"}
                                  </td>
                                </tr>
                              ))}
                              {/* Pagination controls */}
                              <tr>
                                <td colSpan={7} className="px-4 py-3">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">
                                      Page {recipientsPage} of {totalPages}
                                    </span>
                                    <div className="space-x-2">
                                      <button
                                        className="px-3 py-1 border rounded disabled:opacity-50"
                                        disabled={recipientsPage <= 1}
                                        onClick={() =>
                                          setRecipientsPage((p) =>
                                            Math.max(1, p - 1)
                                          )
                                        }
                                      >
                                        Previous
                                      </button>
                                      <button
                                        className="px-3 py-1 border rounded disabled:opacity-50"
                                        disabled={recipientsPage >= totalPages}
                                        onClick={() =>
                                          setRecipientsPage((p) => p + 1)
                                        }
                                      >
                                        Next
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            </>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Email Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Email Campaign Preview</DialogTitle>
              <DialogDescription>
                This is how your {campaignData.type} email will look to
                recipients
              </DialogDescription>
            </DialogHeader>

            {previewData && (
              <div className="space-y-6">
                {/* Subject Line */}
                <div className="border-b pb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Line
                  </label>
                  <div className="bg-gray-50 rounded-md p-3 font-medium">
                    {previewData.subject}
                  </div>
                </div>

                {/* Email Preview */}
                <div className="space-y-4">
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                      <button className="border-b-2 border-[#1B6013] py-2 px-1 text-sm font-medium text-[#1B6013]">
                        Email Preview
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
                        <span className="ml-4">Customer Email View</span>
                      </div>
                    </div>
                    <div
                      className="p-4 bg-white"
                      dangerouslySetInnerHTML={{ __html: previewData.html }}
                    />
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
