import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ message: 'Error parsing form data' });
    }

    const imageFile = files.image;
    if (!imageFile) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    try {
      const image = await sharp(imageFile.filepath).toBuffer();
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();

      const { width, height } = await sharp(image).metadata();
      const aspectRatio = width / height;

      const maxWidth = 500;
      const maxHeight = 700;
      let pdfWidth, pdfHeight;

      if (aspectRatio > maxWidth / maxHeight) {
        pdfWidth = maxWidth;
        pdfHeight = maxWidth / aspectRatio;
      } else {
        pdfHeight = maxHeight;
        pdfWidth = maxHeight * aspectRatio;
      }

      const pngImage = await pdfDoc.embedPng(image);
      page.drawImage(pngImage, {
        x: (page.getWidth() - pdfWidth) / 2,
        y: (page.getHeight() - pdfHeight) / 2,
        width: pdfWidth,
        height: pdfHeight,
      });

      const pdfBytes = await pdfDoc.save();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=converted.pdf');
      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error converting image to PDF' });
    }
  });
}