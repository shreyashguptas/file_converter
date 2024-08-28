import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
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
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    }
  };

  return (
    <div>
      <h1>Image to PDF Converter</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleFileChange} />
        <button type="submit">Convert to PDF</button>
      </form>
      {pdfUrl && (
        <div>
          <a href={pdfUrl} download="converted.pdf">Download PDF</a>
        </div>
      )}
    </div>
  );
}