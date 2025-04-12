const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());

const MAX_STORAGE = 30 * 1024 * 1024 * 1024; // 30GB

// Set up multer to save files in the uploads/ folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, '../uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Function to calculate current total storage
function getUsedStorage() {
  const files = fs.readdirSync('../uploads');
  return files.reduce((total, file) => {
    const stats = fs.statSync(path.join('../uploads', file));
    return total + stats.size;
  }, 0);
}

// Handle file uploads
app.post('/upload', upload.single('file'), (req, res) => {
  const used = getUsedStorage();
  const incoming = req.file.size;

  if (used + incoming > MAX_STORAGE) {
    fs.unlinkSync(req.file.path); // Delete the uploaded file
    return res.status(400).json({ error: '❌ Storage limit exceeded (30GB)' });
  }

  const fileUrl = `http://localhost:3000/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// Serve uploaded files publicly
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.listen(3000, () => console.log('🚀 Server running at http://localhost:3000'));
