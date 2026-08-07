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
    console.error("Twilio client initialization failed:", err.message);
  }
}

const sendOtpToPhoneNumber = async (phoneNumber) => {
  try {
    console.log("Sending OTP to number:", phoneNumber);
    if (!phoneNumber) {
      throw new Error("Phone number is required");
    }

    if (!client || !serviceSid || !serviceSid.startsWith("VA") || serviceSid.length !== 34) {
      console.warn("Twilio Service SID is invalid or not configured. (Service SID must start with VA and be 34 characters).");
      throw new Error("Twilio Verify Service SID is invalid. Please check TWILIO_SERVICE_SID in your Render environment variables.");
    }

    const response = await client.verify.v2.services(serviceSid).verifications.create({
      to: phoneNumber,
      channel: "sms",
    });

    return response;
  } catch (error) {
    console.error("Error in sendOtpToPhoneNumber:", error.message || error);
    throw error;
  }
};

const verifyOtp = async (phoneNumber, otp) => {
  try {
    console.log("Verifying OTP for number:", phoneNumber, "OTP:", otp);

    if (!client || !serviceSid || !serviceSid.startsWith("VA") || serviceSid.length !== 34) {
      throw new Error("Twilio Verify Service SID is invalid or not configured.");
    }

    const response = await client.verify.v2.services(serviceSid).verificationChecks.create({
      to: phoneNumber,
      code: otp,
    });
    console.log("Twilio OTP verification response:", response.status);
    return response;
  } catch (error) {
    console.error("Error in verifyOtp:", error.message || error);
    throw error;
  }
};

module.exports = { sendOtpToPhoneNumber, verifyOtp };