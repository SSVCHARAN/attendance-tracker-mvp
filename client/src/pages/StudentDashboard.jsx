import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import socket from '../socket/socket';

const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState([]);
  const [pdfs, setPdfs] = useState([]);

  useEffect(() => {
    socket.connect();
    // Fetch attendance
    const fetchAttendance = async () => {
      try {
        const res = await api.get(`/attendance/student/${user.id}`);
        setAttendance(res.data);
      } catch (err) {
        console.error('Failed to fetch attendance', err);
      }
    };
    // Fetch PDFs for student's class
    const fetchPDFs = async () => {
      if (!user?.class_id) return;
      try {
        const res = await api.get(`/pdfs/class/${user.class_id}`);
        setPdfs(res.data);
      } catch (err) {
        console.error('Failed to fetch PDFs', err);
      }
    };
    fetchAttendance();
    fetchPDFs();

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Student Dashboard</h1>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">
            Logout
          </button>
        </div>
        <p className="mb-4">Welcome, {user?.name}</p>

        {/* Attendance Records */}
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Attendance</h2>
          {attendance.length === 0 ? (
            <p>No attendance records yet.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Date</th>
                  <th className="border p-2 text-left">Period</th>
                  <th className="border p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record) => (
                  <tr key={record.id}>
                    <td className="border p-2">{record.date}</td>
                    <td className="border p-2">{record.period}</td>
                    <td className="border p-2">{record.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* PDF Resources */}
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Class PDFs</h2>
          {pdfs.length === 0 ? (
            <p>No PDFs available for your class.</p>
          ) : (
            <ul>
              {pdfs.map((pdf) => (
                <li key={pdf.id} className="border-b py-2">
                  <a
                    href={`http://localhost:5000${pdf.file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {pdf.title} (Uploaded by {pdf.teacher_name})
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Messages Link */}
        <button
          onClick={() => navigate('/messages')}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Go to Messages
        </button>
      </div>
    </div>
  );
};

export default StudentDashboard;
