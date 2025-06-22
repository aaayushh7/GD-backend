import path from "path";
import express from "express";
import multer from "multer";
import aws from "aws-sdk";
import multerS3 from "multer-s3";
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const router = express.Router();

// Debug: Log R2 configuration
console.log('R2 Configuration:', {
  endpoint: process.env.R2_ENDPOINT,
  bucket: process.env.R2_BUCKET_NAME,
  publicUrl: process.env.R2_PUBLIC_URL
});

// R2 configuration
const s3 = new aws.S3({
  endpoint: process.env.R2_ENDPOINT,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
  region: 'auto', // R2 doesn't use regions, but the SDK requires this
});

const storage = multerS3({
  s3: s3,
  bucket: process.env.R2_BUCKET_NAME,
  acl: 'public-read', // Add ACL for public read access
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    const extname = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${extname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpe?g|png|webp/;
  const mimetypes = /image\/jpe?g|image\/png|image\/webp/;

  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (filetypes.test(extname) && mimetypes.test(mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Images only"), false);
  }
};

const upload = multer({ storage, fileFilter });
const uploadSingleImage = upload.single("image");

router.post("/", (req, res) => {
  console.log('Received upload request');
  uploadSingleImage(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      res.status(400).send({ message: err.message });
    } else if (req.file) {
      console.log('File uploaded successfully:', req.file);
      // Construct the public URL for the uploaded file
      const publicUrl = `${process.env.R2_PUBLIC_URL}/${req.file.key}`;
      console.log('Generated public URL:', publicUrl);
      res.status(200).send({
        message: "Image uploaded successfully",
        image: publicUrl,
      });
    } else {
      console.error('No file in request');
      res.status(400).send({ message: "No image file provided" });
    }
  });
});

export default router;