"use client";

import React, { useState } from "react";
import { useToast } from "src/hooks/useToast";

const Waitlist = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/email/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          "Thank you for joining our community! Check your email.",
          "success"
        );
        setEmail("");
      } else {
        showToast("Something went wrong. Please try again.", "error");
      }
    } catch (err) {
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className="flex flex-col md:flex-row gap-6 justify-between md:items-center my-12">
        <div className="flex flex-col gap-3">
          <h1 className="text-xl font-semibold">Join The FeedMe Community</h1>
          <p className="text-sm">
            Sign up and be the first to learn about updates from FeedMe
          </p>
        </div>
        <form className="relative w-full md:w-[28rem]" onSubmit={handleSubmit}>
          <input
            className="p-5 rounded-[8px] w-full border border-[#D0D5DD] placeholder:text-xs sm:placeholder:text-sm"
            placeholder="Enter your email address..."
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <button
            type="submit"
            className="text-white bg-[#1B6013] rounded-[8px] px-3 sm:px-[20px] py-3 absolute right-3 top-1/2 transform -translate-y-1/2 text-xs lg:text-[16px] disabled:opacity-60"
            disabled={loading || !email}
          >
            {loading ? "Joining..." : "Join Our Community"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default Waitlist;
