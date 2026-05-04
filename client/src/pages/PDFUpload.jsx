import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const PDFUpload = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [classId, setClassId] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!file || file.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('title', title);
    formData.append('class_id', classId);

    try {
      await api.post('/pdfs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('PDF uploaded successfully');
      setTitle('');
      setClassId('');
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.msg || 'Upload failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Upload PDF</h1>
          <button onClick={() => navigate('/teacher')} className="bg-gray-500 text-white px-4 py-2 rounded">
            Back
          </button>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}

        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Class ID</label>
            <input
              type="number"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">PDF File</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full"
              required
            />
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Upload PDF
          </button>
        </form>
      </div>
    </div>
  );
};

export default PDFUpload;
