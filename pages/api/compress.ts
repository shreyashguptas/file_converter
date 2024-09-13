import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm();
  form.uploadDir = path.join(process.cwd(), 'tmp');
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error parsing form data' });
    }

    const videoFile = files.video as any;
    if (!videoFile) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const inputPath = videoFile.filepath;
    const outputPath = path.join(process.cwd(), 'tmp', 'compressed_video.mp4');

    try {
      await compressVideo(inputPath, outputPath);
      
      const fileStream = fs.createReadStream(outputPath);
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', 'attachment; filename=compressed_video.mp4');
      fileStream.pipe(res);

      fileStream.on('close', () => {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
      });
    } catch (error) {
      console.error('Compression error:', error);
      res.status(500).json({ error: 'Error compressing video' });
    }
  });
}

async function compressVideo(inputPath: string, outputPath: string) {
  const command = `ffmpeg -i "${inputPath}" -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k "${outputPath}"`;
  await execPromise(command);
}