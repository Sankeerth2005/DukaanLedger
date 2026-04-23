import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.EMAIL_FROM || "DukaanLedger <onboarding@resend.dev>";

/**
 * Service to handle automated business communications.
 */

export async function sendWelcomeEmail(to: string, name: string) {
  if (!resend) return;
  
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Welcome to DukaanLedger! 🏪",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">Welcome, ${name}!</h2>
          <p>Thank you for joining <strong>DukaanLedger</strong>. Your shop is ready to start growing.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Quick Start Tips:</p>
            <ul style="margin-top: 10px; padding-left: 20px;">
              <li>Add your first products in the <strong>Products</strong> tab.</li>
              <li>Configure your shop name and GST in <strong>Settings</strong>.</li>
              <li>Start billing from the <strong>Billing</strong> dashboard.</li>
            </ul>
          </div>
          <p>If you have any questions, just reply to this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">DukaanLedger - The Elite Shop Management System</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send welcome email:", error);
  }
}

export async function sendLoginAlert(to: string, provider: string) {
  if (!resend) return;

  const time = new Date().toLocaleString();
  
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Security Alert: New Login to DukaanLedger",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h3 style="color: #ef4444;">Login Alert</h3>
          <p>A new login was detected for your account.</p>
          <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 10px 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;"><strong>Time:</strong> ${time}</p>
            <p style="margin: 0; font-size: 14px;"><strong>Method:</strong> ${provider}</p>
          </div>
          <p style="font-size: 14px; color: #64748b;">If this wasn't you, please secure your account immediately.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send login alert:", error);
  }
}
export async function sendAccountDeletedEmail(to: string, name: string) {
  if (!resend) return;

  const time = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Your DukaanLedger account has been deleted 👋",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #0f0a1e; border-radius: 16px; color: #e2e8f0;">
          <div style="text-align: center; margin-bottom: 28px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #a855f7, #3b82f6); border-radius: 12px; padding: 12px 24px;">
              <span style="color: white; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">DukaanLedger</span>
            </div>
          </div>

          <h2 style="color: #c084fc; font-size: 22px; margin-bottom: 8px;">Account Deleted</h2>
          <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">
            Hi <strong style="color: #e2e8f0;">${name}</strong>,<br/><br/>
            Your DukaanLedger account and all associated shop data have been <strong style="color: #f87171;">permanently deleted</strong> as requested.
          </p>

          <div style="background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 10px; padding: 16px 20px; margin: 24px 0;">
            <p style="margin: 0; font-size: 13px; color: #94a3b8;"><strong style="color: #c084fc;">Deleted at:</strong> ${time} IST</p>
            <p style="margin: 6px 0 0; font-size: 13px; color: #94a3b8;"><strong style="color: #c084fc;">Data removed:</strong> Account, shop, products, sales, billing history, staff</p>
          </div>

          <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
            If this was a mistake or you change your mind, you can always 
            <a href="https://dukaan-ledger.vercel.app/signup" style="color: #a855f7; text-decoration: none;">create a new account</a> — your new journey starts fresh.
          </p>

          <p style="color: #64748b; font-size: 14px; margin-top: 16px;">
            If you didn't request this deletion, please contact us immediately by replying to this email.
          </p>

          <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 28px 0;" />
          <p style="font-size: 12px; color: #475569; text-align: center; margin: 0;">
            DukaanLedger – The Elite Shop Management System
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send account deletion email:", error);
  }
}
