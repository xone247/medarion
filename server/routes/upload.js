import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Uploads directory is in public_html for direct Apache access
// This allows images to be served directly from medarion.africa/uploads/
const uploadsBaseDir = '/home/medasnnc/public_html/uploads';

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // For multipart/form-data, body fields are available after multer processes the request
    // But in the destination callback, we need to read from the raw body or use a workaround
    // We'll use a default and let the route handler verify/correct the path
    let type = 'blog'; // Default to blog for /image endpoint
    
    // Try to get type from body (may not be available in destination callback for multipart)
    // We'll handle type mapping in the route handlers instead
    const uploadPath = path.join(uploadsBaseDir, type);
    
    console.log('[Upload] Destination callback - saving to:', uploadPath);
    console.log('[Upload] Request body in destination:', Object.keys(req.body || {}));
    console.log('[Upload] File fieldname:', file.fieldname);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      try {
        fs.mkdirSync(uploadPath, { recursive: true, mode: 0o755 });
        console.log('[Upload] Created directory:', uploadPath);
      } catch (err) {
        console.error('[Upload] Error creating directory:', err);
        cb(err, null);
        return;
      }
    }
    
    // Verify directory is writable
    try {
      fs.accessSync(uploadPath, fs.constants.W_OK);
    } catch (err) {
      console.error('[Upload] Directory not writable:', uploadPath, err);
      cb(new Error('Upload directory is not writable'), null);
      return;
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

// Upload endpoint for blog images
router.post('/image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    console.log('[Upload] /image endpoint called');
    console.log('[Upload] Request body type:', req.body.type);
    console.log('[Upload] File received:', req.file ? {
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    } : 'NO FILE');
    
    if (!req.file) {
      console.error('[Upload] No file in request');
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded'
      });
    }
    
    // Verify file was actually saved
    if (!fs.existsSync(req.file.path)) {
      console.error('[Upload] File was not saved to disk:', req.file.path);
      return res.status(500).json({
        success: false,
        error: 'File upload failed - file not saved to disk'
      });
    }
    
    console.log('[Upload] File successfully saved to:', req.file.path);
    console.log('[Upload] Request body:', req.body);
    console.log('[Upload] Request body type:', req.body.type);

    // Generate URL - normalize type to folder name
    let type = req.body.type || 'blog';
    const typeMap = {
      'blog': 'blog',
      'ads': 'ads',
      'ad': 'ads',
      'announcement': 'announcement',
      'announcements': 'announcement',
      'company': 'company',
      'companies': 'company',
      'investor': 'investor',
      'investors': 'investor',
      'general': 'general'
    };
    type = typeMap[type.toLowerCase()] || type.toLowerCase();
    
    // If file was saved to wrong folder, move it to correct folder
    const correctPath = path.join(uploadsBaseDir, type, req.file.filename);
    if (req.file.path !== correctPath) {
      console.log('[Upload] Moving file from', req.file.path, 'to', correctPath);
      try {
        // Ensure target directory exists
        const targetDir = path.dirname(correctPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true, mode: 0o755 });
        }
        // Move the file
        fs.renameSync(req.file.path, correctPath);
        console.log('[Upload] File moved successfully');
        req.file.path = correctPath; // Update the path in req.file
      } catch (err) {
        console.error('[Upload] Error moving file:', err);
        // Continue with original path if move fails
      }
    }
    
    // Check for production environment
    const isProduction = process.env.NODE_ENV === 'production' || 
                        process.env.PRODUCTION === 'true' ||
                        req.get('host')?.includes('medarion.africa') ||
                        req.get('x-forwarded-host')?.includes('medarion.africa');
    
    // Always use HTTPS in production, use request protocol in development
    let baseUrl;
    if (isProduction) {
      baseUrl = 'https://medarion.africa/uploads/';
    } else {
      const protocol = req.protocol;
      const host = req.get('host') || 'localhost:3001';
      baseUrl = `${protocol}://${host}/uploads/`;
    }
    
    const url = `${baseUrl}${type}/${req.file.filename}`;

    res.json({
      success: true,
      url: url,
      filename: req.file.filename,
      size: req.file.size,
      type: req.file.mimetype
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error during upload'
    });
  }
});

// Upload endpoint for admin (ads, announcements, companies, investors)
router.post('/admin', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    console.log('[Upload] /admin endpoint called');
    console.log('[Upload] Request body type:', req.body.type || req.query.type);
    console.log('[Upload] File received:', req.file ? {
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    } : 'NO FILE');
    
    if (!req.file) {
      console.error('[Upload] No file in request');
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    // Verify file was actually saved
    if (!fs.existsSync(req.file.path)) {
      console.error('[Upload] File was not saved to disk:', req.file.path);
      return res.status(500).json({
        success: false,
        error: 'File upload failed - file not saved to disk'
      });
    }
    
    console.log('[Upload] File successfully saved to:', req.file.path);
    console.log('[Upload] Request body:', req.body);
    console.log('[Upload] Request body type:', req.body.type || req.query.type);

    let type = req.body.type || req.query.type || 'ads';
    
    // Map upload types to folder names for proper organization
    const typeMap = {
      'blog': 'blog',
      'ads': 'ads',
      'ad': 'ads',
      'announcement': 'announcement',
      'announcements': 'announcement',
      'company': 'company',
      'companies': 'company',
      'investor': 'investor',
      'investors': 'investor',
      'general': 'general'
    };
    
    // Normalize type to folder name
    type = typeMap[type.toLowerCase()] || type.toLowerCase();
    
    // If file was saved to wrong folder, move it to correct folder
    const correctPath = path.join(uploadsBaseDir, type, req.file.filename);
    if (req.file.path !== correctPath) {
      console.log('[Upload] Moving file from', req.file.path, 'to', correctPath);
      try {
        // Ensure target directory exists
        const targetDir = path.dirname(correctPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true, mode: 0o755 });
        }
        // Move the file
        fs.renameSync(req.file.path, correctPath);
        console.log('[Upload] File moved successfully');
        req.file.path = correctPath; // Update the path in req.file
      } catch (err) {
        console.error('[Upload] Error moving file:', err);
        // Continue with original path if move fails
      }
    }
    
    // Generate URL
    // Check for production environment
    const isProduction = process.env.NODE_ENV === 'production' || 
                        process.env.PRODUCTION === 'true' ||
                        req.get('host')?.includes('medarion.africa') ||
                        req.get('x-forwarded-host')?.includes('medarion.africa');
    
    // Always use HTTPS in production, use request protocol in development
    let baseUrl;
    if (isProduction) {
      baseUrl = 'https://medarion.africa/uploads/';
    } else {
      const protocol = req.protocol;
      const host = req.get('host') || 'localhost:3001';
      baseUrl = `${protocol}://${host}/uploads/`;
    }
    
    const url = `${baseUrl}${type}/${req.file.filename}`;

    res.json({
      success: true,
      url: url,
      filename: req.file.filename,
      size: req.file.size,
      type: req.file.mimetype
    });
  } catch (error) {
    console.error('Admin upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error during upload'
    });
  }
});

export default router;

