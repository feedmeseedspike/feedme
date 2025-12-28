import { NextResponse } from "next/server";
import { sendMail } from "@/utils/email/mailer";

interface OrderEmailRequestBody {
  adminEmail: string;
  userEmail: string;
  adminOrderProps: any;
  userOrderProps: any;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as OrderEmailRequestBody;
    console.log('📧 Order email request:', body);
    const { adminEmail, userEmail, adminOrderProps, userOrderProps } = body;

    // Simple admin HTML (like the working contact form)
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; background: #fff; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png" alt="FeedMe Logo" style="height: 37px; margin-bottom: 8px;" />
        </div>
        <h2 style="color: #1B6013; margin-bottom: 12px;">New Order Received - ${adminOrderProps.orderNumber}</h2>
        
        <div style="font-size: 15px; color: #222; margin-bottom: 18px;">
          <p><strong>Customer:</strong> ${adminOrderProps.customerName}</p>
          <p><strong>Phone:</strong> ${adminOrderProps.customerPhone}</p>
          <p><strong>Address:</strong> ${adminOrderProps.deliveryAddress}</p>
          <p><strong>Local Government:</strong> ${adminOrderProps.localGovernment}</p>
        </div>
        
        <h3 style="color: #1B6013; margin-bottom: 8px;">Items Ordered:</h3>
        <div style="background: #f6f6f6; border-radius: 6px; padding: 14px 16px; margin-bottom: 18px;">
          ${adminOrderProps.itemsOrdered?.map((item: any) => `
            <div style="margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #ddd;">
              <p style="margin: 2px 0;">
                <strong>${item.title}</strong> - Qty: ${item.quantity} - ₦${item.price?.toLocaleString()}
              </p>
              ${item.optionName ? `<p style="margin: 2px 0; font-size: 13px; color: #666;">Variation: ${item.optionName}</p>` : ''}
              ${item.customizations && Object.keys(item.customizations).length > 0 ? 
                Object.entries(item.customizations).map(([key, value]: [string, any]) => 
                  `<p style="margin: 1px 0; font-size: 13px; color: #666;">• ${key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}: ${value.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</p>`
                ).join('') : ''
              }
            </div>
          `).join('') || '<p>No items</p>'}
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 12px 0;" />
          
           ${adminOrderProps.discount > 0 ? `
              <p style="margin: 4px 0; color: #B42318;"><strong>Discount:</strong> -₦${adminOrderProps.discount?.toLocaleString()}</p>
          ` : ''}

          <p style="margin: 4px 0;"><strong>Total Paid:</strong> ₦${adminOrderProps.totalAmount?.toLocaleString()}</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 24px 0;" />
        <p style="font-size: 13px; color: #888; text-align: center;">FeedMe Order Notification</p>
      </div>
    `;

    // Fetch store settings for "Closed" check
    let closedMessageHtml = '';
    try {
        const { getStoreSettings } = await import("@/lib/actions/settings.actions"); // Dynamic import to avoid build issues if any
        const settings = await getStoreSettings();
        
        if (settings) {
            // Check status (Server-side logic, assuming Nigeria is target market => UTC+1)
            // Implementation mirrors StoreStatusProvider but with explicit timezone handling
            const now = new Date();
             // Shift to WAT (UTC+1)
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const nigeriaTime = new Date(utc + (3600000 * 1));
            
            const day = nigeriaTime.getDay();
            const currentMinutes = nigeriaTime.getHours() * 60 + nigeriaTime.getMinutes();
            
            const parseTime = (t: string) => {
                const [h, m] = t.split(":").map(Number);
                return h * 60 + (m || 0);
            };

            let isClosed = false;
            let statusMsg = "";

            if (settings.is_store_enabled === false) {
                 isClosed = true;
                 statusMsg = "Our store is currently offline.";
            } else if (settings.closed_days && settings.closed_days.includes(day)) {
                 isClosed = true;
                 statusMsg = "We are closed today.";
            } else if (settings.open_time && settings.close_time) {
                 const openM = parseTime(settings.open_time);
                 const closeM = parseTime(settings.close_time);
                 if (currentMinutes < openM || currentMinutes >= closeM) {
                     isClosed = true;
                     statusMsg = `We are currently closed (Open ${settings.open_time} - ${settings.close_time}).`;
                 }
            }

            if (isClosed) {
                closedMessageHtml = `
                    <div style="background-color: #fff4e5; border: 1px solid #ffeacc; color: #663c00; padding: 12px; border-radius: 6px; margin-bottom: 20px; text-align: center;">
                        <p style="margin: 0; font-weight: bold;">⚠️ Note: ${statusMsg}</p>
                        <p style="margin: 5px 0 0 0; font-size: 14px;">Your order has been received and will be processed immediately when we reopen.</p>
                    </div>
                `;
            }
        }
    } catch (err) {
        console.error("Error checking store settings for email:", err);
    }

    // Simple user HTML
    const userHtml = `
      <div style="font-family: Arial, sans-serif; background: #fff; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png" alt="FeedMe Logo" style="height: 37px; margin-bottom: 8px;" />
        </div>
        <h2 style="color: #1B6013; margin-bottom: 12px;">Order Confirmed! #${userOrderProps.orderNumber}</h2>
        
        ${closedMessageHtml}
        
        <p style="font-size: 15px; color: #222;">Hi ${userOrderProps.customerName},</p>
        <p style="font-size: 15px; color: #222;">Thank you for your order! We're preparing your fresh produce and it will be delivered soon.</p>
        
        <h3 style="color: #1B6013; margin-bottom: 8px;">Order Summary:</h3>
        <div style="background: #f6f6f6; border-radius: 6px; padding: 14px 16px; margin-bottom: 18px;">
          ${userOrderProps.itemsOrdered?.map((item: any) => `
            <div style="margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #ddd;">
              <p style="margin: 2px 0;">
                <strong>${item.title}</strong> - Qty: ${item.quantity} - ₦${item.price?.toLocaleString()}
              </p>
              ${item.optionName ? `<p style="margin: 2px 0; font-size: 13px; color: #666;">Variation: ${item.optionName}</p>` : ''}
              ${item.customizations && Object.keys(item.customizations).length > 0 ? 
                Object.entries(item.customizations).map(([key, value]: [string, any]) => 
                  `<p style="margin: 1px 0; font-size: 13px; color: #666;">• ${key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}: ${value.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</p>`
                ).join('') : ''
              }
            </div>
          `).join('') || '<p>No items</p>'}
          <hr style="border: none; border-top: 1px solid #ddd; margin: 12px 0;" />
          <p style="margin: 4px 0;"><strong>Delivery Fee:</strong> ₦${userOrderProps.deliveryFee?.toLocaleString()}</p>
          <p style="margin: 4px 0;"><strong>Total Paid:</strong> ₦${userOrderProps.totalAmountPaid?.toLocaleString()}</p>
        </div>
        
        <p style="font-size: 15px; color: #222;"><strong>Delivery Address:</strong><br>${userOrderProps.deliveryAddress}</p>
        
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 24px 0;" />
        <p style="font-size: 13px; color: #888; text-align: center;">Thank you for choosing FeedMe!</p>
      </div>
    `;

    console.log('📤 Sending order emails...');

    // Send to admin
    await sendMail({
      to: adminEmail,
      subject: `New Order Received - ${adminOrderProps.orderNumber}`,
      html: adminHtml,
    });
    console.log('✅ Admin email sent');

    // Send to user
    await sendMail({
      to: userEmail,
      subject: `Order Confirmed! Your Fresh Produce is On Its Way`,
      html: userHtml,
    });
    console.log('✅ User email sent');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Order email failed:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
