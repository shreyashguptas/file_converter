import { useState, useEffect } from 'react';

const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/jpg'];

export default function Home() {
  const [file, setFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);
  const [downloadTime, setDownloadTime] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && SUPPORTED_FORMATS.includes(selectedFile.type)) {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError(`This file cannot be uploaded as of right now. We only support ${SUPPORTED_FORMATS.map(format => format.split('/')[1]).join(', ')} files.`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/convert', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      setPdfUrl(data.url);
      setDownloadTime(new Date());
    } else {
      setError('An error occurred during conversion. Please try again.');
    }
  };

  useEffect(() => {
    if (downloadTime) {
      const timer = setTimeout(() => {
        setPdfUrl(null);
        setDownloadTime(null);
      }, 600000); // 10 minutes
      return () => clearTimeout(timer);
    }
  }, [downloadTime]);

  return (
    <div>
      <h1>Image to PDF Converter</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" accept={SUPPORTED_FORMATS.join(',')} onChange={handleFileChange} />
        <button type="submit" disabled={!file}>Convert to PDF</button>
      </form>
      {error && <p style={{color: 'red'}}>{error}</p>}
      {pdfUrl && (
        <div>
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" download>Download PDF</a>
          <p>This file will be deleted from our servers in 10 minutes.</p>
        </div>
      )}
    </div>
  );
}