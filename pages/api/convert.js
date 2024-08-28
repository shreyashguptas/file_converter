import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import formidable from 'formidable';
import { put, del } from "@vercel/blob";

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
      console.error('Form parsing error:', err);
      return res.status(500).json({ message: 'Error parsing form data' });
    }

    const imageFile = files.image;
    if (!imageFile) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    try {
      // Read the image file
      const imageBuffer = await sharp(imageFile.filepath).toBuffer();

      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();

      // Embed the image in the PDF
      let image;
      if (imageFile.mimetype === 'image/jpeg' || imageFile.mimetype === 'image/jpg') {
        image = await pdfDoc.embedJpg(imageBuffer);
      } else if (imageFile.mimetype === 'image/png') {
        image = await pdfDoc.embedPng(imageBuffer);
      } else {
        throw new Error('Unsupported image format');
      }

      // Add a page to the PDF
      const page = pdfDoc.addPage();

      // Get the dimensions of the image
      const { width, height } = image;

      // Scale the image to fit the page
      const scaleFactor = Math.min(page.getWidth() / width, page.getHeight() / height);
      const scaledWidth = width * scaleFactor;
      const scaledHeight = height * scaleFactor;

      // Draw the image on the page
      page.drawImage(image, {
        x: (page.getWidth() - scaledWidth) / 2,
        y: (page.getHeight() - scaledHeight) / 2,
        width: scaledWidth,
        height: scaledHeight,
      });

      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      
      // Store the PDF in Vercel Blob
      const fileName = `converted_${Date.now()}.pdf`;
      const { url } = await put(fileName, Buffer.from(pdfBytes), { access: 'public' });

      // Schedule deletion after 10 minutes
      setTimeout(async () => {
        try {
          await del(fileName);
          console.log(`Deleted ${fileName} after 10 minutes`);
        } catch (error) {
          console.error(`Failed to delete ${fileName}:`, error);
        }
      }, 600000); // 10 minutes

      res.status(200).json({ url });
    } catch (error) {
      console.error('Conversion error:', error);
      res.status(500).json({ message: `Error converting image to PDF: ${error.message}` });
    }
  });
}