import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Root uploads folder
const UPLOAD_DIR = './uploads';

// Make sure the main upload directory and subfolders exist
const createFoldersIfNotExist = () => {
  const folders = [
    UPLOAD_DIR,
    path.join(UPLOAD_DIR, 'ktp'),
    path.join(UPLOAD_DIR, 'properties'),
    path.join(UPLOAD_DIR, 'units'),
    path.join(UPLOAD_DIR, 'avatars'),
    path.join(UPLOAD_DIR, 'complaints'),
  ];

  folders.forEach((folder) => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
  });
};

createFoldersIfNotExist();

// Define storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subfolder = '';
    
    // Choose subfolder based on field name or request path
    if (file.fieldname === 'ktpPhoto' || file.fieldname === 'ktpDocument') {
      subfolder = 'ktp';
    } else if (file.fieldname === 'avatar' || file.fieldname === 'profilePhoto') {
      subfolder = 'avatars';
    } else if (file.fieldname === 'complaintPhoto') {
      subfolder = 'complaints';
    } else if (req.path.includes('units') || file.fieldname === 'unitPhoto') {
      subfolder = 'units';
    } else {
      subfolder = 'properties';
    }

    cb(null, path.join(UPLOAD_DIR, subfolder));
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter (accept only images)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  
  const err = new Error('Only image files (jpg, jpeg, png, webp) are allowed!');
  err.status = 400;
  cb(err, false);
};

// Multer upload instances
export const uploadSingle = (fieldname) => multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single(fieldname);

export const uploadMultiple = (fieldname, maxCount = 10) => multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).array(fieldname, maxCount);
