"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Mail } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";

const formSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(1),
});

type ContactFormValues = z.infer<typeof formSchema>;
export function ContactModal() {
  const [step, setStep] = useState<"default" | "form">("default");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(formSchema),
  });

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
    <Dialog onOpenChange={() => setStep("default")}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="text-sm p-0 h-auto font-semibold hover:underline hover:underline-offset-2 hover:bg-transparent"
        >
          Contact
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl text-left">
            {step === "default" ? "Contact us" : "Send us a message"}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "default" ? (
            <motion.div
              key="default"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4 text-sm text-gray-700"
            >
              <div
                onClick={() => setStep("form")}
                className="cursor-pointer border rounded-md p-4 flex items-center space-x-3 hover:shadow-md transition"
              >
                <Mail className="text-green-700 w-5 h-5" />
                <div className="text-green-700 font-medium hover:underline">
                  Send us a message
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-500">Other ways to reach us</p>
                <a
                  href="/customer-service"
                  className="text-black font-bold underline hover:text-[#1B6013] text-lg underline-offset-4"
                >
                  Visit our Help Center
                </a>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <div className="bg-green-50 text-sm text-gray-800 px-3 py-1 rounded-md border border-green-200">
                All fields are <strong>required</strong> unless marked optional.
              </div>
              {result && (
                <div
                  className={`text-sm px-3 py-2 rounded-md border ${result.success ? "bg-green-100 border-green-300 text-green-800" : "bg-red-100 border-red-300 text-red-800"}`}
                >
                  {result.message}
                </div>
              )}
              <div className="flex gap-4">
                <Input
                  placeholder="First Name"
                  {...form.register("firstName")}
                  className="rounded-full"
                />
                <Input
                  placeholder="Last Name"
                  {...form.register("lastName")}
                  className="rounded-full"
                />
              </div>

              <Input
                type="email"
                placeholder="Email"
                {...form.register("email")}
                className="rounded-full"
              />

              <Input
                placeholder="Subject"
                {...form.register("subject")}
                className="rounded-full"
              />

              <Textarea
                placeholder="How can we help you?"
                {...form.register("message")}
                rows={4}
                className="resize-none rounded-xl"
              />

              <Button
                type="submit"
                className="w-full !bg-[#1B6013] hover:!bg-[#1B6013]/90 rounded-full py-4"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Message"}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
