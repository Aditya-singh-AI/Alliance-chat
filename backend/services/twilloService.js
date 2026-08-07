const twilio = require("twilio");

// Support both TWILIO_ and TWILLO_ typo variations from env files
const accountSid = (process.env.TWILIO_ACCOUNT_SID || process.env.TWILLO_ACCOUT_SID || process.env.TWILLO_ACCOUNT_SID || "").trim();
const authToken = (process.env.TWILIO_AUTH_TOKEN || process.env.TWILLO_AUTH_TOKEN || "").trim();
const serviceSid = (process.env.TWILIO_SERVICE_SID || process.env.TWILLO_SERVICE_SID || "").trim();

let client = null;
if (accountSid && authToken) {
  try {
    client = twilio(accountSid, authToken);
  } catch (err) {
    console.log("Twilio client initialization skipped:", err.message);
  }
}

const sendOtpToPhoneNumber = async (phoneNumber) => {
  if (!phoneNumber) {
    throw new Error("Phone number is required");
  }

  if (!client || !serviceSid) {
    // Return false silently so controller can use DB fallback without throwing scary error logs
    return false;
  }

  try {
    console.log("Sending SMS OTP via Twilio to number:", phoneNumber);
    const response = await client.verify.v2.services(serviceSid).verifications.create({
      to: phoneNumber,
      channel: "sms",
    });
    return response;
  } catch (error) {
    console.warn("Twilio SMS send error (will use fallback):", error.message || error);
    return false;
  }
};

const verifyOtp = async (phoneNumber, otp) => {
  if (!client || !serviceSid) {
    return null;
  }

  try {
    const response = await client.verify.v2.services(serviceSid).verificationChecks.create({
      to: phoneNumber,
      code: otp,
    });
    return response;
  } catch (error) {
    console.warn("Twilio verify error:", error.message || error);
    return null;
  }
};

module.exports = { sendOtpToPhoneNumber, verifyOtp };