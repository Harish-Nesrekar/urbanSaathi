
require("dotenv").config();

const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const gmail = google.gmail({
  version: "v1",
  auth: oauth2Client,
});

function encodeEmail(message) {
  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sendVerificationEmail(email, otp) {
  const sender = process.env.GOOGLE_EMAIL;

  if (
    !sender ||
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !process.env.GOOGLE_REFRESH_TOKEN
  ) {
    throw new Error("Missing Gmail API environment variables");
  }

  const subject = "UrbanSathi Email Verification Code";
  const text = `Your UrbanSathi verification code is ${otp}. This code expires in 10 minutes.`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px">
      <h2 style="color:#15803d">UrbanSathi</h2>
      <p>Use this code to verify your email address:</p>
      <div style="font-size:32px;font-weight:bold;letter-spacing:8px;padding:16px 0">${otp}</div>
      <p>This code expires in 10 minutes. If you did not request it, ignore this email.</p>
    </div>
  `;

  const boundary = "urbanSathiEmailBoundary";

  const message = [
    `From: "UrbanSathi" <${sender}>`,
    `To: ${email}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "",
    text,
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "",
    html,
    `--${boundary}--`,
    "",
  ].join("\r\n");

  try {
    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encodeEmail(message) },
    });

    console.log("Gmail accepted verification email:", response.data.id);
    return response.data;
  } catch (error) {
    console.error("Gmail API email error:", {
      message: error.message,
      status: error.response?.status,
      details: error.response?.data?.error?.message,
    });

    throw new Error("Could not send verification email");
  }
}

async function verifyEmailConnection() {
  const profile = await gmail.users.getProfile({ userId: "me" });
  console.log("Gmail API connected:", profile.data.emailAddress);
  return profile.data;
}

module.exports = {
  sendVerificationEmail,
  verifyEmailConnection,
};
