import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setCompressing(true);
    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await fetch('/api/compress', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
      } else {
        console.error('Compression failed');
      }
    } catch (error) {
      console.error('Error:', error);
    }

    setCompressing(false);
  };

  return (
    <div>
      <Head>
        <title>Video Compressor</title>
        <meta name="description" content="Compress your videos easily" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Video Compressor</h1>
        <form onSubmit={handleSubmit} className="mb-4">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="mb-2"
          />
          <button
            type="submit"
            disabled={!file || compressing}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {compressing ? 'Compressing...' : 'Compress Video'}
          </button>
        </form>
        {downloadUrl && (
          <a
            href={downloadUrl}
            download="compressed_video.mp4"
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Download Compressed Video
          </a>
        )}
      </main>
    </div>
  );
}