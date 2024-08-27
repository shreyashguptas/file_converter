const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const app = express();
const port = process.env.PORT || 3000;

// Set up multer for handling file uploads
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'video/mp4'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Ensure required directories exist
['uploads', 'public/converted'].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.use(express.static('public'));

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const inputPath = req.file.path;
  const outputFormat = req.body.outputFormat;
  const compress = req.body.compress === 'true';
  const width = req.body.width;
  const height = req.body.height;

  const outputFileName = `${path.parse(req.file.originalname).name}.${outputFormat}`;
  const outputPath = path.join('public', 'converted', outputFileName);

  let command = '';

  if (outputFormat === 'pdf' || outputFormat === 'png' || outputFormat === 'jpeg' || outputFormat === 'heic') {
    command = `convert ${inputPath} ${compress ? '-compress jpeg -quality 80' : ''} ${width && height ? `-resize ${width}x${height}!` : ''} ${outputPath}`;
  } else if (outputFormat === 'mp4') {
    command = `ffmpeg -i ${inputPath} ${compress ? '-crf 23' : ''} ${width && height ? `-vf scale=${width}:${height}` : ''} ${outputPath}`;
  } else {
    return res.status(400).send('Invalid output format');
  }

  exec(command, (error) => {
    if (error) {
      console.error(`Error: ${error}`);
      return res.status(500).send('Conversion failed');
    }
    res.json({ downloadUrl: `/converted/${outputFileName}` });

    // Clean up the input file
    fs.unlink(inputPath, (err) => {
      if (err) console.error(`Error deleting file: ${err}`);
    });

    // Set a timeout to delete the converted file after 5 minutes
    setTimeout(() => {
      fs.unlink(outputPath, (err) => {
        if (err) console.error(`Error deleting converted file: ${err}`);
      });
    }, 5 * 60 * 1000);
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});