// Multer package import (file uploads handle karne ke liye)
import multer from "multer";

// Disk storage configuration (RAM nahi, disk pe save karega)
const storage = multer.diskStorage({

  // Decide karta hai file kis folder me save hogi
  destination: function (req, file, cb) {
    // null = no error, "./public/temp" = save location
    cb(null, "./public/temp");
  },

  // Decide karta hai file ka naam kya hoga
  filename: function (req, file, cb) {
    // original file name use ho raha hai
    cb(null, file.originalname);
  },

});

// Multer middleware create + export
export const upload = multer({
  // upar defined storage use ho rahi hai
  storage
});