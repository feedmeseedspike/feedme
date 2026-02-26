"use server";

import { sendPushNotification } from "./pushnotification.action";

/**
 * Marketing & Re-engagement Notification Templates
 */
export const MARKETING_TEMPLATES = {
  RE_ENGAGEMENT: {
    title: "We’ve missed you! 🍲",
    body: "It’s been a while since your last order. We’ve stocked up on fresh arrivals just for you. Come see what’s cooking! ✨",
    link: "/shop"
  },
  FRESH_ARRIVALS: {
    title: "New Farm Arrivals! 🚜",
    body: "Freshness just hit the shelves! From crisp greens to premium oils, your kitchen deserves the best. Shop now! 🥬",
    link: "/category/fresh-produce"
  },
  SPECIAL_OFFER: {
    title: "A Little Treat for You 🎁",
    body: "Ready to stock up? Enjoy a special discount on your next order. Only for the next 24 hours! ⏰",
    link: "/deals"
  },
  VALENTINE_SPECIAL: {
    title: "Love is in the Air (and Food) 🌹",
    body: "Treat your special someone (or yourself!) to a premium meal. Fresh ingredients delivered in 3 hours. 🌹",
    link: "/shop"
  }
};

/**
 * Sends a re-engagement push notification to a specific user
 */
export async function sendReEngagementPush(userId: string) {
  const { title, body, link } = MARKETING_TEMPLATES.RE_ENGAGEMENT;
  return await sendPushNotification(title, body, userId, link);
}

/**
 * Sends a custom marketing push notification
 */
export async function sendMarketingPush(userId: string, templateKey: keyof typeof MARKETING_TEMPLATES) {
  const template = MARKETING_TEMPLATES[templateKey];
  if (!template) throw new Error("Invalid template key");
  
  return await sendPushNotification(template.title, template.body, userId, template.link);
}
