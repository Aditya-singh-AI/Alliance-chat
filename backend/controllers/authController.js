const User = require("../models/User");
const { sendOtpToEmail } = require("../services/emailService");
const sendOtpToPhoneNumber = require("../services/twilloService");
const response = require("../utils/responseHandler");
const twilloService = require("../services/twilloService");
const otpGenerator = require("../utils/otpGenerator");
const { generateToken } = require("../utils/generateToken");
const { uploadFileToCloudinary } = require("../config/cloudinaryConfig");
const Conversation = require("../models/Conversation");

//Step-1 Send OTP
const sendOtp = async (req, res) => {
  const { phoneNumber, phoneSuffix, email } = req.body;
  const otp = otpGenerator();
  const expiry = new Date(Date.now() + 10 * 60 * 1000);
  let user;

  try {
    if (email) {
      user = await User.findOne({ email }); // Fix 1: Call findOne on the User model

      if (!user) {
        user = new User({
          email,
          emailOtp: otp,
          emailOtpExpiry: expiry,
        });
      } else {
        // Feature fix: Update OTP for existing email users
        user.emailOtp = otp;
        user.emailOtpExpiry = expiry;
      }
      await user.save();
      const emailSent = await sendOtpToEmail(email, otp);
      if (!emailSent) {
        return response(res, 200, `Verification code: ${otp}`, { email, devOtp: otp });
      }
      return response(res, 200, "OTP sent to your email", { email });
    } // Fix 2: Added the missing closing bracket for the `if(email)` block

    if (!phoneNumber) {
      return response(
        res,
        400,
        "Please enter phone number",
      );
    }

    const digitsOnly = phoneNumber.replace(/\D/g, "");
    const fullPhoneNumber = phoneSuffix ? `${phoneSuffix}${digitsOnly}` : `+${digitsOnly}`;

    // Find existing user sorted by updatedAt so we pick the active record
    user = await User.findOne({
      $or: [
        { phoneNumber: digitsOnly },
        { phoneNumber: fullPhoneNumber },
        { phoneNumber }
      ]
    }).sort({ updatedAt: -1 });

    if (!user) {
      user = new User({
        phoneNumber: digitsOnly,
        phoneSuffix: phoneSuffix || "+91",
        phoneOtp: otp,
        phoneOtpExpiry: expiry,
      });
    } else {
      // Update OTP for existing phone users
      user.phoneOtp = otp;
      user.phoneOtpExpiry = expiry;
    }

    await user.save();

    const twilioResult = await twilloService.sendOtpToPhoneNumber(fullPhoneNumber);
    if (!twilioResult) {
      console.log(`[INFO] OTP generated for ${fullPhoneNumber}: ${otp}`);
      return response(
        res,
        200,
        `Verification code: ${otp}`,
        { ...user.toObject(), devOtp: otp }
      );
    }

    return response(res, 200, "OTP sent to your phone number", user);
  } catch (error) {
    console.error("sendOtp error:", error);
    return response(res, 500, "Internal Server Error", error.message);
  }
};

// step - 2 verify Otp
const verifyOtp = async (req, res) => {
  const { phoneNumber, phoneSuffix, email, otp } = req.body;
  try {
    let user;
    if (email) {
      user = await User.findOne({ email });

      if (!user) {
        return response(res, 404, "User not found");
      }
      const now = new Date();
      if (
        !user.emailOtp ||
        String(user.emailOtp) !== String(otp) ||
        now > new Date(user.emailOtpExpiry)
      ) {
        return response(res, 400, "OTP has expired or is invalid");
      }
      user.isVerified = true;
      user.emailOtp = null;
      user.emailOtpExpiry = null;
      await user.save();
    } else {
      if (!phoneNumber) {
        return response(res, 400, "Phone number is required");
      }
      const digitsOnly = phoneNumber.replace(/\D/g, "");
      const fullPhoneNumber = phoneSuffix ? `${phoneSuffix}${digitsOnly}` : `+${digitsOnly}`;

      user = await User.findOne({
        $or: [
          { phoneNumber: digitsOnly },
          { phoneNumber: fullPhoneNumber },
          { phoneNumber }
        ]
      }).sort({ updatedAt: -1 });

      if (!user) {
        console.warn(`[VERIFY OTP] User not found for phone: ${phoneNumber}`);
        return response(res, 404, "User not found");
      }

      console.log(`[VERIFY OTP] User ID: ${user._id}, Stored OTP in DB: "${user.phoneOtp}", User Entered: "${otp}"`);

      const now = new Date();
      const isOtpMatch = user.phoneOtp && String(user.phoneOtp).trim() === String(otp).trim();
      const isNotExpired = user.phoneOtpExpiry && now <= new Date(user.phoneOtpExpiry);

      if (isOtpMatch && isNotExpired) {
        user.isVerified = true;
        user.phoneOtp = null;
        user.phoneOtpExpiry = null;
        await user.save();
      } else {
        const twResult = await twilloService.verifyOtp(fullPhoneNumber, otp);
        if (twResult && twResult.status === "approved") {
          user.isVerified = true;
          user.phoneOtp = null;
          user.phoneOtpExpiry = null;
          await user.save();
        } else {
          console.warn(`[VERIFY OTP FAILED] Entered: "${otp}" vs Expected: "${user.phoneOtp}"`);
          return response(
            res,
            400,
            user.phoneOtp
              ? `Invalid code. Please enter current code: ${user.phoneOtp}`
              : "Invalid or expired OTP code"
          );
        }
      }
    }

    // Generate token and set cookie AFTER successful OTP verification
    const token = generateToken(user._id);
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000 * 365,
    });
    return res
      .status(200)
      .json({ message: "User Login successfully", user, token });
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal Server Error", error.message);
  }
};

// step - 3 creating profile for user
const updateProfile = async (req, res) => {
  const {
    username,
    email,
    phoneNumber,
    phoneSuffix,
    profilePicture,
    about,
    agreed,
  } = req.body;
  const userId = req.user.userId;
  try {
    const user = await User.findById(userId);
    const file = req.file;
    if (file) {
      const uploadResult = await uploadFileToCloudinary(file);
      console.log(uploadResult);
      user.profilePicture = uploadResult?.secure_url;
    } else if (req.body.profilePicture) {
      user.profilePicture = req.body.profilePicture;
    }

    if (username) user.username = username;
    if (agreed) user.agreed = agreed;
    if (about) user.about = about;
    await user.save();
    return response(res, 200, "Profile updated successfully", user);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal Server Error", error.message);
  }
};
const checkAuthenticated = async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
      return response(res, 401, "Unauthorized");
    }
    const user = await User.findById(userId);
    if (!user) {
      return response(res, 401, "User not found");
    }
    return response(
      res,
      200,
      "User retrived and allow to use Talkative app",
      user,
    );
  } catch (error) {}
};
const logout = (req, res) => {
  try {
    res.clearCookie("authToken", {
      httpOnly: true,
    });
    return response(res, 200, "Logged out successfully");
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal Server Error", error.message);
  }
};

const getAllUsers = async (req, res) => {
  const loggedInUser = req.user.userId;
  try {
    const users = await User.find({ _id: { $ne: loggedInUser } })
      .select(
        "username email profilePicture lastSeen isOnline about phoneNumber phoneSuffix",
      )
      .lean();
    const userWithConversation = await Promise.all(
      users.map(async (user) => {
        const conversation = await Conversation.findOne({
          participants: { $all: [loggedInUser, user?._id] },
        })
          .populate({
            path: "lastMessage",
            select: "content createAt sender receiver",
          })
          .lean();
        return {
          ...user,
          conversation: conversation || null,
        };
      }),
    );
    return response(
      res,
      200,
      "Users retrived successfully",
      userWithConversation,
    );
  } catch (error) {
    console.log(error);
    return response(res, 500, "Internal server error", error.message);
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  updateProfile,
  logout,
  checkAuthenticated,
  getAllUsers,
};
