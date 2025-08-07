"use client";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/card";
import {
  Phone,
  Mail,
  MessageSquare,
  Clock,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../components/ui/accordion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
});
type ContactFormValues = z.infer<typeof formSchema>;

interface CustomerSupportClientProps {
  deliveryLocations: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

export default function CustomerSupportClient({ deliveryLocations }: CustomerSupportClientProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(formSchema),
  });

  // Generate delivery location text dynamically
  const deliveryLocationText = deliveryLocations.length > 0 
    ? deliveryLocations
        .map(location => `${location.name}: ₦${location.price.toLocaleString()}`)
        .join(", ")
    : "Mainland delivery ₦2,500 - ₦3,000, Island delivery ₦3,500 - ₦4,000 depending on distance";

  const faqs = [
    {
      question: "Do you deliver on Sundays?",
      answer:
        "We don't deliver on Sundays. Our delivery operates Monday to Saturday only.",
    },
    {
      question: "How fast can I get my items?",
      answer:
        "You get your order 4-6 hours after order has been made.",
    },
    {
      question: "Do you deliver outside Lagos?",
      answer:
        "We don't deliver outside Lagos. Our delivery service is currently limited to Lagos State only.",
    },
    {
      question: "What's the delivery fee to my location?",
      answer:
        `Delivery fees within Lagos are: ${deliveryLocationText}.`,
    },
    {
      question: "Can I get my order same day?",
      answer:
        "Yes! All orders are delivered within 4-6 hours of being placed, so you'll always get your order the same day.",
    },
  ];

  const onSubmit = async (data: ContactFormValues) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/email/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        setResult({ success: true, message: "Message sent successfully!" });
        form.reset();
      } else {
        setResult({
          success: false,
          message: json.error || "Failed to send message.",
        });
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || "Failed to send message.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8 px-0 md:!px-[160px]">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Customer Support
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          We&apos;re here to help you with any questions or concerns you may
          have about your orders or our services.
        </p>
      </div>

      {/* Support Channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto">
        <Card className="shadow-lg border-2 hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Phone className="text-green-600 w-6 h-6" />
            </div>
            <CardTitle className="text-xl">Phone Support</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Speak directly with our support team
            </p>
            <p className="text-lg font-semibold text-[#1B6013]">+234 808 828 2487</p>
            <p className="text-sm text-gray-500 mt-2 flex items-center">
              <Clock className="w-4 h-4 mr-1" /> Mon-Fri: 8am-6pm, Sat:
              9am-4pm
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-2 hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="text-orange-600 w-6 h-6" />
            </div>
            <CardTitle className="text-xl">Live Chat Support</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Get instant help through our live chat
            </p>
            <p className="text-lg font-semibold text-[#1B6013]">Available 24/7</p>
            <p className="text-sm text-gray-500 mt-2">
              Average response time: 2 minutes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section with Accordion */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 flex items-center justify-center">
            <HelpCircle className="text-[#1B6013] w-8 h-8 mr-3" />
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Quick answers to common questions about our delivery service and policies
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-2 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-green-50 text-left">
                  <span className="font-semibold text-lg text-gray-800">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 pt-0 text-gray-600 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {/* Contact Form */}
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
          <p className="text-gray-600">
            Can&apos;t find what you&apos;re looking for? Send us a message and we&apos;ll get back to you quickly.
          </p>
        </div>
        <Card className="shadow-lg border-2 p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {result && (
            <div
              className={`text-sm px-3 py-2 rounded-md border ${result.success ? "bg-green-100 border-green-300 text-green-800" : "bg-red-100 border-red-300 text-red-800"}`}
            >
              {result.message}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium mb-1"
              >
                Full Name
              </label>
              <Input
                id="name"
                {...form.register("name")}
                required
                placeholder="Your name"
                className="rounded-full"
              />
              {form.formState.errors.name && (
                <span className="text-xs text-red-600">
                  {form.formState.errors.name.message as string}
                </span>
              )}
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1"
              >
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                required
                placeholder="your@email.com"
                className="rounded-full"
              />
              {form.formState.errors.email && (
                <span className="text-xs text-red-600">
                  {form.formState.errors.email.message as string}
                </span>
              )}
            </div>
          </div>
          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium mb-1"
            >
              Subject
            </label>
            <Input
              id="subject"
              {...form.register("subject")}
              required
              placeholder="What's this about?"
              className="rounded-full"
            />
            {form.formState.errors.subject && (
              <span className="text-xs text-red-600">
                {form.formState.errors.subject.message as string}
              </span>
            )}
          </div>
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium mb-1"
            >
              Message
            </label>
            <Textarea
              id="message"
              {...form.register("message")}
              required
              rows={5}
              placeholder="How can we help you?"
              className="min-h-[120px] rounded-xl"
            />
            {form.formState.errors.message && (
              <span className="text-xs text-red-600">
                {form.formState.errors.message.message as unknown as string}
              </span>
            )}
          </div>
          <Button
            type="submit"
            className="w-full !bg-[#1B6013] hover:!bg-[#1B6013]/90 py-6 text-lg font-semibold rounded-full"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Message"}
          </Button>
        </form>
        </Card>
      </div>
    </div>
  );
}