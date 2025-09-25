import { NextResponse } from "next/server";
import { sendMail } from "@/utils/email/mailer";

interface JobApplicationEmailRequest {
  applicantEmail: string;
  applicantName: string;
  jobTitle: string;
  jobDepartment: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as JobApplicationEmailRequest;
    console.log('📧 Job application email request:', body);

    const { applicantEmail, applicantName, jobTitle, jobDepartment } = body;

    // Email to applicant (confirmation)
    const applicantHtml = `
      <div style="font-family: Arial, sans-serif; background: #fff; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png" alt="FeedMe Logo" style="height: 37px; margin-bottom: 8px;" />
        </div>

        <div style="text-align: center; margin-bottom: 24px;">
          <div style="background: #1B6013; color: white; padding: 12px 24px; border-radius: 20px; display: inline-block; font-weight: bold; margin-bottom: 16px;">
            APPLICATION RECEIVED
          </div>
          <h2 style="color: #333; margin: 0;">${jobTitle}</h2>
          <p style="color: #666; margin: 4px 0 0 0;">${jobDepartment} Department</p>
        </div>

        <p style="font-size: 16px; color: #222; margin-bottom: 8px;">Hi ${applicantName},</p>
        <p style="font-size: 16px; color: #222; margin-bottom: 16px;">Thank you for your application for the <strong>${jobTitle}</strong> position at FeedMe!</p>
        <p style="font-size: 15px; color: #555; margin-bottom: 24px;">We've received your application and our team will review it carefully. You should hear back from us within 5 business days.</p>

        <div style="background: #f0f8ff; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <h3 style="color: #0066CC; margin: 0 0 12px 0; font-size: 16px;">Application Details:</h3>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #ddd; margin-bottom: 8px;">
            <span style="color: #333;">Position:</span>
            <span style="color: #666;">${jobTitle}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #ddd; margin-bottom: 8px;">
            <span style="color: #333;">Department:</span>
            <span style="color: #666;">${jobDepartment}</span>
          </div>
        </div>

        <div style="background: #f0fff4; border: 2px solid #22C55E; border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: center;">
          <h3 style="color: #22C55E; margin: 0 0 8px 0;">🚀 What Happens Next?</h3>
          <p style="color: #333; margin: 0; font-size: 14px;">Our hiring team will review your application and reach out if your profile matches our requirements. Thank you for your interest in joining FeedMe!</p>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <p style="color: #666; font-size: 14px; margin-bottom: 8px;">Questions about your application?</p>
          <a href="mailto:orders.feedmeafrica@gmail.com" style="color: #1B6013; text-decoration: none; font-weight: bold;">orders.feedmeafrica@gmail.com</a>
        </div>

        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 24px 0;" />
        <p style="font-size: 13px; color: #888; text-align: center;">Thank you for considering FeedMe as your next career move!</p>
      </div>
    `;

    // Email to admin (notification)
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; background: #fff; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png" alt="FeedMe Logo" style="height: 37px; margin-bottom: 8px;" />
        </div>

        <div style="text-align: center; margin-bottom: 24px;">
          <div style="background: #FF6B35; color: white; padding: 12px 24px; border-radius: 20px; display: inline-block; font-weight: bold; margin-bottom: 16px;">
            NEW APPLICATION
          </div>
          <h2 style="color: #333; margin: 0;">Job Application Received</h2>
        </div>

        <p style="font-size: 16px; color: #222; margin-bottom: 16px;">A new job application has been submitted:</p>

        <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <h3 style="color: #333; margin: 0 0 12px 0; font-size: 16px;">Application Details:</h3>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #ddd; margin-bottom: 8px;">
            <span style="color: #333; font-weight: bold;">Applicant:</span>
            <span style="color: #666;">${applicantName}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #ddd; margin-bottom: 8px;">
            <span style="color: #333; font-weight: bold;">Email:</span>
            <span style="color: #666;">${applicantEmail}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #ddd; margin-bottom: 8px;">
            <span style="color: #333; font-weight: bold;">Position:</span>
            <span style="color: #666;">${jobTitle}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #ddd; margin-bottom: 8px;">
            <span style="color: #333; font-weight: bold;">Department:</span>
            <span style="color: #666;">${jobDepartment}</span>
          </div>
        </div>

        <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: center;">
          <h3 style="color: #856404; margin: 0 0 8px 0;">📋 Action Required</h3>
          <p style="color: #856404; margin: 0; font-size: 14px;">Please review this application in the admin dashboard and update the status accordingly.</p>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/admin/careers"
             style="background: #1B6013; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            View in Admin Dashboard
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 24px 0;" />
        <p style="font-size: 13px; color: #888; text-align: center;">FeedMe Careers Admin System</p>
      </div>
    `;

    console.log('📤 Sending job application emails...');

    // Send confirmation email to applicant
    await sendMail({
      to: applicantEmail,
      subject: `Application Received - ${jobTitle} at FeedMe`,
      html: applicantHtml,
    });

    // Send notification email to admin
    await sendMail({
      to: "oyedelejeremiah.ng@gmail.com", // Using the same email as the mailer for now
      subject: `New Job Application: ${jobTitle} - ${applicantName}`,
      html: adminHtml,
    });

    console.log('✅ Job application emails sent successfully');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Job application email failed:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}