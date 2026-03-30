const nodemailer = require("nodemailer");

function getTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

async function sendDrawPublishedEmail({ monthKey, winnerCount }) {
  const to = process.env.ADMIN_NOTIFY_EMAIL || process.env.SMTP_USER;
  const transport = getTransport();
  if (!transport || !to) return;
  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM || "noreply@golf-charity.local",
      to,
      subject: `Draw published for ${monthKey}`,
      text: `The monthly draw for ${monthKey} was published. Winners recorded: ${winnerCount}.`,
    });
  } catch (e) {
    console.warn("Email notify skipped:", e.message);
  }
}

async function sendUserEmail(to, subject, text) {
  const transport = getTransport();
  if (!transport) return;
  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM || "noreply@golf-charity.local",
      to,
      subject,
      text,
    });
  } catch (e) {
    console.warn("User email skipped:", e.message);
  }
}

module.exports = { sendDrawPublishedEmail, sendUserEmail };
