const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

// Ensure local uploads directory exists on host/Render
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (err) {
    console.error("Failed to create uploads directory:", err);
  }
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload file to Cloudinary with fallback to Base64 Data URI
const uploadFileToCloudinary = async (file) => {
  if (!file || !file.path) {
    throw new Error("No valid file provided for upload");
  }

  const isCloudinaryConfigured =
    Boolean(process.env.CLOUDINARY_NAME) &&
    Boolean(process.env.CLOUDINARY_API_KEY) &&
    Boolean(process.env.CLOUDINARY_API_SECRET);

  const options = {
    resource_type: file.mimetype?.startsWith("video") ? "video" : "image",
  };

  if (isCloudinaryConfigured) {
    try {
      console.log(`[CLOUDINARY] Uploading ${file.originalname} to Cloudinary...`);
      const result = await cloudinary.uploader.upload(file.path, options);
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return result;
    } catch (error) {
      console.warn("[CLOUDINARY WARNING] Upload failed, switching to Data URI fallback:", error.message);
    }
  } else {
    console.log("[INFO] Cloudinary credentials missing. Using Base64 Data URI fallback.");
  }

  // Fallback: Convert file to Base64 Data URI
  try {
    const fileBuffer = fs.readFileSync(file.path);
    const base64String = fileBuffer.toString("base64");
    const dataUri = `data:${file.mimetype || "image/jpeg"};base64,${base64String}`;

    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    return { secure_url: dataUri };
  } catch (err) {
    console.error("File processing failed:", err);
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw err;
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});

const multerMiddleware = multer({ storage }).single("media");

module.exports = { uploadFileToCloudinary, multerMiddleware };
