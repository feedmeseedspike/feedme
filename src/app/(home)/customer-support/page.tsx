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
import CustomBreadcrumb from "@components/shared/breadcrumb";
import Container from "@components/shared/Container";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../components/ui/accordion";

export default function CustomerServicePage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const faqs = [
    {
      question: "How do I track my order?",
      answer:
        "You can track your order by logging into your account and visiting the 'My Orders' section. You'll receive tracking information via email once your order ships.",
    },
    {
      question: "What is your return policy?",
      answer:
        "We accept returns within 30 days of purchase. Items must be unused and in their original packaging. Please contact our support team to initiate a return.",
    },
    {
      question: "How long does shipping take?",
      answer:
        "Standard shipping takes 3-5 business days within Lagos and 5-7 business days to other states. Express shipping options are available at checkout.",
    },
    {
      question: "Do you offer international shipping?",
      answer:
        "Currently, we only ship within Nigeria. We're working to expand our shipping options in the future.",
    },
    {
      question: "How can I contact seller directly?",
      answer:
        "You can message sellers through the product page or via their store page. All communications are monitored for your safety.",
    },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    // console.log("Form submitted:", formData);
    alert("Thank you for your message! Our team will respond within 24 hours.");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <>
      <div className="bg-white">
        <Container className="py-4">
          <CustomBreadcrumb />
        </Container>
      </div>

      <Container className="py-8 px-0 md:!px-[160px]">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Customer Service
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We&apos;re here to help you with any questions or concerns you may
            have about your orders or our services.
          </p>
        </div>

        {/* Support Channels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="">
            <CardHeader>
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Phone className="text-green-600 w-6 h-6" />
              </div>
              <CardTitle>Phone Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Speak directly with our support team
              </p>
              <p className="text-lg font-semibold">+234 808 828 2487</p>
              <p className="text-sm text-gray-500 mt-2 flex items-center">
                <Clock className="w-4 h-4 mr-1" /> Mon-Fri: 8am-6pm, Sat:
                9am-4pm
              </p>
            </CardContent>
          </Card>

          <Card className="">
            <CardHeader>
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Mail className="text-blue-600 w-6 h-6" />
              </div>
              <CardTitle>Email Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Send us an email and we&apos;ll respond promptly
              </p>
              <p className="text-lg font-semibold">seedspikelimited@gmail.com</p>
              <p className="text-sm text-gray-500 mt-2">
                Average response time: 12 hours
              </p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section with Accordion */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <HelpCircle className="text-green-600 w-6 h-6 mr-2" />
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-4 hover:no-underline hover:bg-gray-50">
                  <span className="font-medium text-left">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-0 text-gray-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Contact Form */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Contact Us</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Your name"
                />
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
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="your@email.com"
                />
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
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                placeholder="What's this about?"
              />
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
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows={5}
                placeholder="How can we help you?"
                className="min-h-[120px]"
              />
            </div>
            <Button type="submit" className="w-full md:w-auto !bg-[#1B6013]">
              Send Message
            </Button>
          </form>
        </div>
      </Container>
    </>
  );
}
