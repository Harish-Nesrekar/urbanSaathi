
const { Resend } = require("resend");
require("dotenv").config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = async (email, otp) => {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    throw new Error("Missing Resend email configuration");
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "UrbanSathi Email Verification Code",
    text: `Your UrbanSathi verification code is ${otp}. This code will expire in 10 minutes.`,
    html: `
      <div style="
        margin: 0;
        padding: 40px 20px;
        background-color: #f6f9fc;
        font-family: Arial, sans-serif;
      ">
        <div style="
          max-width: 520px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 15px 40px rgba(10, 40, 80, 0.10);
        ">
          <h1 style="margin: 0 0 10px; color: #061d3b; font-size: 28px;">
            UrbanSathi
          </h1>

          <p style="color: #64748b; font-size: 15px; line-height: 1.6;">
            Welcome to UrbanSathi. Please use the verification code below
            to verify your email address.
          </p>

          <div style="
            margin: 30px 0;
            padding: 20px;
            text-align: center;
            background-color: #f1f7fc;
            border-radius: 14px;
          ">
            <span style="
              color: #0875c9;
              font-size: 36px;
              font-weight: 700;
              letter-spacing: 8px;
            ">${otp}</span>
          </div>

          <p style="color: #64748b; font-size: 14px;">
            This code expires in <strong>10 minutes</strong>.
          </p>

          <p style="margin-top: 30px; color: #94a3b8; font-size: 12px;">
            If you did not create an UrbanSathi account, you can safely
            ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  const { data, error } = await resend.emails.send(mailOptions);

  if (error) {
    console.error("Resend verification email failed:", {
      message: error.message,
      statusCode: error.statusCode,
    });

    throw new Error("Could not send verification email");
  }

  console.log("Verification email accepted by Resend:", data?.id);
  return data;
};

// Retained for compatibility with existing imports.
// This checks configuration, not actual email delivery.
const verifyEmailConnection = async () => {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    throw new Error("Missing Resend email configuration");
  }

  console.log("Resend email configuration is present");
};

module.exports = {
  sendVerificationEmail,
  verifyEmailConnection,
};
