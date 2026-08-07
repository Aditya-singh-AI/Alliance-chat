const twilio = require("twilio");

/**
 * Reads credentials dynamically to support hot-reloading & production env configs.
 */
const getTwilioConfig = () => {
  const accountSid = (
    process.env.TWILIO_ACCOUNT_SID ||
    process.env.TWILLO_ACCOUT_SID ||
    process.env.TWILLO_ACCOUNT_SID ||
    ""
  ).trim();
  const authToken = (
    process.env.TWILIO_AUTH_TOKEN ||
    process.env.TWILLO_AUTH_TOKEN ||
    ""
  ).trim();
  const serviceSid = (
    process.env.TWILIO_SERVICE_SID ||
    process.env.TWILLO_SERVICE_SID ||
    ""
  ).trim();

  return { accountSid, authToken, serviceSid };
};

const sendOtpToPhoneNumber = async (phoneNumber) => {
  if (!phoneNumber) {
    throw new Error("Phone number is required");
  }

  const { accountSid, authToken, serviceSid } = getTwilioConfig();

  if (!accountSid || !authToken || !serviceSid) {
    console.log("[INFO] Twilio credentials incomplete. Skipping real SMS dispatch.");
    return false;
  }

  try {
    const client = twilio(accountSid, authToken);
    console.log(`[TWILIO] Sending real SMS OTP to ${phoneNumber}...`);
    const response = await client.verify.v2.services(serviceSid).verifications.create({
      to: phoneNumber,
      channel: "sms",
    });
    console.log(`[TWILIO] SMS sent successfully to ${phoneNumber}. Status: ${response.status}`);
    return response;
  } catch (error) {
    console.error("[TWILIO ERROR] Real SMS send failed:", error.message || error);
    return false;
  }
};

const verifyOtp = async (phoneNumber, otp) => {
  const { accountSid, authToken, serviceSid } = getTwilioConfig();

  if (!accountSid || !authToken || !serviceSid) {
    return null;
  }

  try {
    const client = twilio(accountSid, authToken);
    const response = await client.verify.v2.services(serviceSid).verificationChecks.create({
      to: phoneNumber,
      code: otp,
    });
    console.log(`[TWILIO] Verification check status for ${phoneNumber}: ${response.status}`);
    return response;
  } catch (error) {
    console.warn("[TWILIO ERROR] Verification check failed:", error.message || error);
    return null;
  }
};

module.exports = { sendOtpToPhoneNumber, verifyOtp };