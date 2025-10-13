import { NextResponse } from "next/server";
import { sendMail } from "@/utils/email/mailer";

interface OrderStatusUpdateEmailRequest {
  userEmail: string;
  orderNumber: string;
  customerName: string;
  newStatus: "In transit" | "order delivered" | "order confirmed" | "Cancelled";
  itemsOrdered?: Array<{
    title: string;
    price: number;
    quantity: number;
    optionName?: string;
    customizations?: Record<string, any>;
  }>;
  deliveryAddress?: string;
  estimatedDelivery?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as OrderStatusUpdateEmailRequest;
    
    const { userEmail, orderNumber, customerName, newStatus, itemsOrdered, deliveryAddress, estimatedDelivery } = body;

    // Generate different email content based on status
    let subject = "";
    let statusMessage = "";
    let statusColor = "#1B6013";
    let additionalInfo = "";

    switch (newStatus) {
      case "order confirmed":
        subject = `Order Confirmed! #${orderNumber}`;
        statusMessage = "Your order has been confirmed and is being prepared.";
        statusColor = "#1B6013";
        additionalInfo = "We're getting your fresh produce ready for delivery!";
        break;
        
      case "In transit":
        subject = `Your Order is On Its Way! #${orderNumber}`;
        statusMessage = "Your order is now in transit and heading to you.";
        statusColor = "#0066CC";
        additionalInfo = estimatedDelivery 
          ? `Estimated delivery: ${estimatedDelivery}` 
          : "It should arrive within a few hours. Get ready for fresh goodness!";
        break;
        
      case "order delivered":
        subject = `Order Delivered! #${orderNumber}`;
        statusMessage = "Your order has been successfully delivered!";
        statusColor = "#22C55E";
        additionalInfo = "We hope you enjoy your fresh produce. Thank you for choosing FeedMe!";
        break;
        
      case "Cancelled":
        subject = `Order Cancelled #${orderNumber}`;
        statusMessage = "Your order has been cancelled.";
        statusColor = "#DC2626";
        additionalInfo = "If you have any questions, please contact our support team.";
        break;
        
      default:
        subject = `Order Update #${orderNumber}`;
        statusMessage = `Your order status has been updated to: ${newStatus}`;
        additionalInfo = "Thank you for your patience.";
    }

    const userHtml = `
      <div style="font-family: Arial, sans-serif; background: #fff; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png" alt="FeedMe Logo" style="height: 37px; margin-bottom: 8px;" />
        </div>
        
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="background: ${statusColor}; color: white; padding: 12px 24px; border-radius: 20px; display: inline-block; font-weight: bold; margin-bottom: 16px;">
            ${newStatus.toUpperCase()}
          </div>
          <h2 style="color: #333; margin: 0;">Order #${orderNumber}</h2>
        </div>
        
        <p style="font-size: 16px; color: #222; margin-bottom: 8px;">Hi ${customerName},</p>
        <p style="font-size: 16px; color: #222; margin-bottom: 16px;">${statusMessage}</p>
        <p style="font-size: 15px; color: #555; margin-bottom: 24px; font-style: italic;">${additionalInfo}</p>
        
        ${itemsOrdered && itemsOrdered.length > 0 ? `
          <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 12px 0; font-size: 16px;">Your Items:</h3>
            ${itemsOrdered.map(item => `
              <div style="padding: 4px 0; border-bottom: 1px solid #eee; margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #333;">${item.title} (${item.quantity}x)</span>
                  <span style="color: #666;">₦${item.price.toLocaleString()}</span>
                </div>
                ${item.optionName ? `<div style="font-size: 12px; color: #888; margin-top: 2px;">Variation: ${item.optionName}</div>` : ''}
                ${item.customizations && Object.keys(item.customizations).length > 0 ? 
                  Object.entries(item.customizations).map(([key, value]: [string, any]) => 
                    `<div style="font-size: 12px; color: #888; margin-top: 1px;">• ${key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}: ${value.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</div>`
                  ).join('') : ''
                }
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${deliveryAddress ? `
          <div style="background: #f0f8ff; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <h3 style="color: #0066CC; margin: 0 0 8px 0; font-size: 16px;">Delivery Address:</h3>
            <p style="color: #333; margin: 0;">${deliveryAddress}</p>
          </div>
        ` : ''}
        
        ${newStatus === "order delivered" ? `
          <div style="background: #f0fff4; border: 2px solid #22C55E; border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: center;">
            <h3 style="color: #22C55E; margin: 0 0 8px 0;">🎉 Enjoy Your Fresh Produce!</h3>
            <p style="color: #333; margin: 0; font-size: 14px;">We'd love to hear about your experience. Consider leaving us a review!</p>
          </div>
        ` : ''}
        
        ${newStatus !== "Cancelled" ? `
          <div style="text-align: center; margin-top: 24px;">
            <p style="color: #666; font-size: 14px; margin-bottom: 8px;">Need help? Contact us:</p>
            <a href="mailto:orders.feedmeafrica@gmail.com" style="color: #1B6013; text-decoration: none; font-weight: bold;">orders.feedmeafrica@gmail.com</a>
          </div>
        ` : ''}
        
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 24px 0;" />
        <p style="font-size: 13px; color: #888; text-align: center;">Thank you for choosing FeedMe!</p>
      </div>
    `;


    await sendMail({
      to: userEmail,
      subject: subject,
      html: userHtml,
    });
    
    

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Order status update email failed:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}