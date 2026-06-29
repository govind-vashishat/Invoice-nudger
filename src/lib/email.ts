import { Resend } from "resend";
import { render } from "@react-email/render";
import { NudgeEmail, nudgeSubject, type NudgeTone } from "@/emails/nudge";
import { FreelancerNotifyEmail, freelancerNotifySubject } from "@/emails/freelancer-notify";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set");
}
if (!process.env.RESEND_FROM_EMAIL) {
  throw new Error("RESEND_FROM_EMAIL is not set");
}

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL;

export async function sendEmail({
  to,
  subject,
  html,
  from,
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  const { data, error } = await resend.emails.send({
    from: from ?? FROM,
    to,
    subject,
    html,
  });
  if (error) throw new Error(`Resend: ${error.message}`);
  return data;
}

export async function sendNudgeEmail(args: {
  to: string;
  tone: NudgeTone;
  clientName: string;
  amountFormatted: string;
  daysOverdue: number;
  payNowUrl: string | null;
  senderName: string;
  fromName?: string;
}) {
  const html = await render(
    NudgeEmail({
      tone: args.tone,
      clientName: args.clientName,
      amountFormatted: args.amountFormatted,
      daysOverdue: args.daysOverdue,
      payNowUrl: args.payNowUrl,
      senderName: args.senderName,
    }),
  );
  const subject = nudgeSubject(args.tone, args.amountFormatted, args.daysOverdue);
  const from = args.fromName ? `${args.fromName} <${FROM}>` : FROM;
  return sendEmail({ to: args.to, subject, html, from });
}

export async function sendFreelancerNotify(args: {
  to: string;
  freelancerName: string;
  clientName: string;
  amountFormatted: string;
  daysOverdue: number;
  tone: NudgeTone;
}) {
  const html = await render(FreelancerNotifyEmail(args));
  return sendEmail({
    to: args.to,
    subject: freelancerNotifySubject(args.clientName),
    html,
  });
}

export function magicLinkEmail({ url, appName }: { url: string; appName: string }) {
  return `
<!doctype html>
<html>
  <body style="font-family: -apple-system, system-ui, sans-serif; background: #fafafa; padding: 32px; color: #111;">
    <div style="max-width: 480px; margin: 0 auto; background: #fff; border: 1px solid #eee; border-radius: 12px; padding: 32px;">
      <h1 style="font-size: 20px; margin: 0 0 16px;">Sign in to ${appName}</h1>
      <p style="font-size: 14px; line-height: 1.6; color: #444;">Click the button below to sign in. This link expires in 5 minutes.</p>
      <a href="${url}" style="display: inline-block; margin-top: 16px; padding: 12px 20px; background: #111; color: #fff; text-decoration: none; border-radius: 8px; font-size: 14px;">Sign in</a>
      <p style="font-size: 12px; color: #888; margin-top: 24px;">If you didn't request this, you can ignore this email.</p>
    </div>
  </body>
</html>`;
}
