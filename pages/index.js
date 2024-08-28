import { useState } from 'react';

const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/jpg'];

export default function Home() {
  const [file, setFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isConverting, setIsConverting] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && SUPPORTED_FORMATS.includes(selectedFile.type)) {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError(`This file cannot be uploaded. We only support ${SUPPORTED_FORMATS.map(format => format.split('/')[1]).join(', ')} files.`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsConverting(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setPdfUrl(data.url);
      } else {
        setError(data.message || 'An error occurred during conversion. Please try again.');
      }
    } catch (error) {
      console.error('Conversion error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div>
      <h1>Image to PDF Converter</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" accept={SUPPORTED_FORMATS.join(',')} onChange={handleFileChange} />
        <button type="submit" disabled={!file || isConverting}>
          {isConverting ? 'Converting...' : 'Convert to PDF'}
        </button>
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