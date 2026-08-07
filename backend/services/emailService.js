const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

// Configure nodemailer transporter
const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    return null;
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

/**
 * Function to send OTP via Email with a strict 5-second timeout
 */
const sendOtpToEmail = async (email, otp) => {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`[INFO] EMAIL_USER/EMAIL_PASSWORD not configured. Email OTP for ${email}: ${otp}`);
    return false;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h2 style="color: #075e54;">🔐 Talkative Chat Verification</h2>
      
      <p>Hi there,</p>
      
      <p>Your one-time password (OTP) to verify your Talkative Chat account is:</p>
      
      <h1 style="background: #e0f7fa; color: #000; padding: 10px 20px; display: inline-block; border-radius: 5px; letter-spacing: 2px;">
        ${otp}
      </h1>

      <p><strong>This OTP is valid for the next 10 minutes.</strong> Please do not share this code with anyone.</p>

      <p>If you didn’t request this OTP, please ignore this email.</p>

      <p style="margin-top: 20px;">Thanks & Regards,<br/>Talkative Chat Security Team</p>

      <hr style="margin: 30px 0;" />

      <small style="color: #777;">This is an automated message. Please do not reply.</small>
    </div>
  `;

  try {
    const sendMailPromise = transporter.sendMail({
      from: `"Talkative Chat" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Talkative Verification OTP",
      html: html,
    });

    // 5-second safety timeout to prevent HTTP requests from hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Email server response timeout")), 5000)
    );

    await Promise.race([sendMailPromise, timeoutPromise]);
    console.log(`[EMAIL] OTP email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.warn(`[EMAIL WARNING] Failed to send email to ${email} (${error.message}). OTP: ${otp}`);
    return false;
  }
};

module.exports = { sendOtpToEmail };
