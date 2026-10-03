const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendVerificationEmail = async (email, otp) => {
  const mailOptions = {
    from: `"UrbanSathi" <${process.env.SMTP_USER}>`,
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
          <h1 style="
            margin: 0 0 10px;
            color: #061d3b;
            font-size: 28px;
          ">
            UrbanSathi
          </h1>

          <p style="
            color: #64748b;
            font-size: 15px;
            line-height: 1.6;
          ">
            Welcome to UrbanSathi. Please use the verification code below
            to verify your email address.
          </p>

          <div style="
            margin: 30px 0;
            padding: 20px;
            text-align: center;
            background: #f1f7fc;
            border-radius: 14px;
          ">
            <span style="
              color: #0875c9;
              font-size: 36px;
              font-weight: 700;
              letter-spacing: 8px;
            ">
              ${otp}
            </span>
          </div>

          <p style="
            color: #64748b;
            font-size: 14px;
          ">
            This verification code expires in <strong>10 minutes</strong>.
          </p>

          <p style="
            margin-top: 30px;
            color: #94a3b8;
            font-size: 12px;
          ">
            If you did not create an UrbanSathi account, you can safely
            ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const verifyEmailConnection = async () => {
  await transporter.verify();
  console.log("Gmail SMTP connection successful");
};

module.exports = {
  sendVerificationEmail,
  verifyEmailConnection,
};