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
import { motion } from "framer-motion";
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

type EmailFormValues = z.infer<typeof formSchema>;

export function EmailModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: EmailFormValues) => {
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
        // Close modal after 2 seconds
        setTimeout(() => {
          setOpen(false);
          setResult(null);
        }, 2000);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="relative inline-block text-left bg-transparent border-none p-0 m-0 text-inherit cursor-pointer after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-[#1B6013] after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.65,0.05,0.36,1)] hover:after:origin-bottom-left hover:after:scale-x-100"
        >
          Send An Email
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl text-left flex items-center gap-2">
            <Mail className="text-[#1B6013] w-6 h-6" />
            Send us a message
          </DialogTitle>
        </DialogHeader>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="bg-green-50 text-sm text-gray-800 px-3 py-1 rounded-md border border-green-200">
            All fields are <strong>required</strong> unless marked optional.
          </div>
          
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`text-sm px-3 py-2 rounded-md border ${
                result.success 
                  ? "bg-green-100 border-green-300 text-green-800" 
                  : "bg-red-100 border-red-300 text-red-800"
              }`}
            >
              {result.message}
            </motion.div>
          )}
          
          <div className="flex gap-4">
            <Input
              placeholder="First Name"
              {...form.register("firstName")}
              className="rounded-full"
              disabled={loading}
            />
            <Input
              placeholder="Last Name"
              {...form.register("lastName")}
              className="rounded-full"
              disabled={loading}
            />
          </div>

          <Input
            type="email"
            placeholder="Email"
            {...form.register("email")}
            className="rounded-full"
            disabled={loading}
          />

          <Input
            placeholder="Subject"
            {...form.register("subject")}
            className="rounded-full"
            disabled={loading}
          />

          <Textarea
            placeholder="How can we help you?"
            {...form.register("message")}
            rows={4}
            className="resize-none rounded-xl"
            disabled={loading}
          />

          <Button
            type="submit"
            className="w-full !bg-[#1B6013] hover:!bg-[#1B6013]/90 rounded-full py-4"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Message"}
          </Button>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}