const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload file to Cloudinary and clean up local temp file
const uploadFileToCloudinary = async (file) => {
  const options = {
    resource_type: file.mimetype.startsWith("video") ? "video" : "image",
  };

  try {
    const result = await cloudinary.uploader.upload(file.path, options);

    // Clean up local temp file after successful upload
    fs.unlink(file.path, (unlinkErr) => {
      if (unlinkErr) console.error("Error deleting temp file:", unlinkErr);
    });

    return result;
  } catch (error) {
    // Clean up local temp file even on failure
    fs.unlink(file.path, (unlinkErr) => {
      if (unlinkErr) console.error("Error deleting temp file:", unlinkErr);
    });
    throw error;
  }
};

// Multer stores uploads temporarily in /uploads folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const multerMiddleware = multer({ storage }).single("media");

module.exports = { uploadFileToCloudinary, multerMiddleware };
