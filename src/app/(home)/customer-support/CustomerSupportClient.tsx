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
  MessageSquare,
  Clock,
  HelpCircle,
  Send,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
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
import { motion, AnimatePresence, type Variants } from "framer-motion";

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

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

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
        .map((location) => `${location.name}: ₦${location.price.toLocaleString()}`)
        .join(", ")
    : "Mainland delivery ₦2,500 - ₦3,000, Island delivery ₦3,500 - ₦4,000 depending on distance";

  const faqs = [
    {
      question: "Do you deliver on Sundays?",
      answer: "We don't deliver on Sundays. Our delivery operates Monday to Saturday only.",
    },
    {
      question: "How fast can I get my items?",
      answer: "You get your order 4-6 hours after order has been made.",
    },
    {
      question: "Do you deliver outside Lagos?",
      answer: "We don't deliver outside Lagos. Our delivery service is currently limited to Lagos State only.",
    },
    {
      question: "What's the delivery fee to my location?",
      answer: `Delivery fees within Lagos are: ${deliveryLocationText}.`,
    },
    {
      question: "Can I get my order same day?",
      answer: "Yes! All orders are delivered within 4-6 hours of being placed, so you'll always get your order the same day.",
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
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="py-12 w-full"
    >
      {/* Hero Section */}
      <motion.div variants={fadeInUp} className="text-center mb-20 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-[#1B6013] tracking-tight">
          How can we help you?
        </h1>
        <p className="text-xl text-gray-500 font-light leading-relaxed">
          We&apos;re here to answer your questions and ensure your experience is nothing short of exceptional.
        </p>
      </motion.div>

      {/* Support Channels */}
      <motion.div 
        variants={staggerContainer}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24 max-w-5xl mx-auto"
      >
        <motion.div variants={fadeInUp} className="h-full">
          <Card className="h-full border border-gray-100 shadow-lg hover:shadow-xl hover:border-[#1B6013]/30 transition-all duration-300 rounded-[2rem] overflow-hidden group bg-white">
            <CardContent className="p-8 md:p-10 flex flex-col items-center text-center h-full justify-between">
              <div>
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-8 transition-transform duration-300 mx-auto">
                  <Phone className="text-[#1B6013] w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Phone Support</h3>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  Speak directly with our friendly support team for immediate assistance.
                </p>
              </div>
              <div className="w-full">
                <a href="tel:+2348088282487" className="block w-full">
                  <Button variant="outline" className="w-full py-6 text-lg rounded-xl border-[#1B6013]/20 text-[#1B6013] hover:bg-[#1B6013] hover:text-white transition-colors duration-300 group-hover:border-[#1B6013]">
                    +234 808 828 2487
                  </Button>
                </a>
                <div className="flex items-center justify-center mt-6 text-sm text-gray-400">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Mon-Fri: 8am-6pm • Sat: 9am-4pm</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp} className="h-full">
          <Card className="h-full border border-gray-100 shadow-lg hover:shadow-xl hover:border-[#25D366]/50 transition-all duration-300 rounded-[2rem] overflow-hidden group bg-white">
            <CardContent className="p-8 md:p-10 flex flex-col items-center text-center h-full justify-between">
              <div>
                <div className="w-20 h-20 bg-[#25D366]/10 rounded-full flex items-center justify-center mb-8 transition-transform duration-300 mx-auto">
                  <MessageSquare className="text-[#25D366] w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">WhatsApp Support</h3>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  Chat with us on WhatsApp for quick responses and instant updates.
                </p>
              </div>
              <div className="w-full">
                <a 
                  href="https://wa.me/2348088282487" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full"
                >
                  <Button className="w-full py-6 text-lg rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white border-none transition-colors duration-300 shadow-lg shadow-[#25D366]/20">
                    Chat on WhatsApp
                  </Button>
                </a>
                <div className="flex items-center justify-center mt-6 text-sm text-gray-400">
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                    Available 24/7
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* FAQ Section */}
      <motion.div variants={fadeInUp} className="mb-24 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[#1B6013] font-semibold tracking-wider text-sm uppercase mb-3 block">Common Questions</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Frequently Asked Questions</h2>
        </div>
        
        <div className="space-y-4">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-b border-gray-100 last:border-0 mb-4"
              >
                <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-gray-50/50 rounded-2xl text-left group transition-all duration-200">
                  <span className="font-semibold text-lg text-gray-800 group-hover:text-[#1B6013] transition-colors">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-2 text-gray-600 leading-relaxed text-base">
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    {faq.answer}
                  </motion.div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </motion.div>

      {/* Contact Form */}
      <motion.div variants={fadeInUp} className="max-w-3xl mx-auto">
        <div className="bg-[#1B6013] rounded-[2.5rem] p-8 md:p-16 overflow-hidden relative shadow-2xl shadow-[#1B6013]/20">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10">
            <div className="text-center mb-12 text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Send us a message</h2>
              <p className="text-white/80 text-lg font-light">
                Fill out the form below and we&apos;ll get back to you within 24 hours.
              </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`rounded-2xl px-6 py-4 flex items-center ${
                      result.success 
                        ? "bg-white/20 text-white backdrop-blur-sm" 
                        : "bg-red-500/20 text-red-100 backdrop-blur-sm"
                    }`}
                  >
                    {result.success ? <CheckCircle2 className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
                    {result.message}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/90 ml-1">Full Name</label>
                  <Input
                    {...form.register("name")}
                    placeholder="Your name"
                    className="bg-white/10 border-white/10 text-white placeholder:text-white/40 h-14 rounded-xl focus:bg-white/20 focus:border-white/30 transition-all duration-300"
                  />
                  {form.formState.errors.name && (
                    <span className="text-xs text-red-300 ml-1">
                      {form.formState.errors.name.message as string}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/90 ml-1">Email Address</label>
                  <Input
                    type="email"
                    {...form.register("email")}
                    placeholder="your@email.com"
                    className="bg-white/10 border-white/10 text-white placeholder:text-white/40 h-14 rounded-xl focus:bg-white/20 focus:border-white/30 transition-all duration-300"
                  />
                  {form.formState.errors.email && (
                    <span className="text-xs text-red-300 ml-1">
                      {form.formState.errors.email.message as string}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90 ml-1">Subject</label>
                <Input
                  {...form.register("subject")}
                  placeholder="What's this about?"
                  className="bg-white/10 border-white/10 text-white placeholder:text-white/40 h-14 rounded-xl focus:bg-white/20 focus:border-white/30 transition-all duration-300"
                />
                {form.formState.errors.subject && (
                  <span className="text-xs text-red-300 ml-1">
                    {form.formState.errors.subject.message as string}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90 ml-1">Message</label>
                <Textarea
                  {...form.register("message")}
                  rows={5}
                  placeholder="How can we help you?"
                  className="bg-white/10 border-white/10 text-white placeholder:text-white/40 min-h-[150px] rounded-xl focus:bg-white/20 focus:border-white/30 resize-none transition-all duration-300"
                />
                {form.formState.errors.message && (
                  <span className="text-xs text-red-300 ml-1">
                    {form.formState.errors.message.message as unknown as string}
                  </span>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-[#1B6013] hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] py-8 text-lg font-bold rounded-xl transition-all duration-300 mt-4 shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-[#1B6013] border-t-transparent rounded-full animate-spin mr-3"></div>
                    Sending...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    Send Message <Send className="w-5 h-5 ml-2" />
                  </div>
                )}
              </Button>
            </form>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}