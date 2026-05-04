import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import socket from '../socket/socket';

const TeacherDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState(1);

  useEffect(() => {
    // Connect socket on mount
    socket.connect();
    // Fetch pending alerts
    const fetchAlerts = async () => {
      try {
        const res = await api.get('/alerts/pending');
        setAlerts(res.data);
      } catch (err) {
        console.error('Failed to fetch alerts', err);
      }
    };
    fetchAlerts();

    // Listen for new absence alerts
    socket.on('absence_alert', (alert) => {
      setAlerts((prev) => [alert, ...prev]);
    });

    // Listen for alert accepted
    socket.on('alert_accepted', ({ alert_id, accepted_by_name }) => {
      setAlerts((prev) =>
        prev.map((a) => (a.id === alert_id ? { ...a, status: 'accepted', accepted_by_name } : a))
      );
    });

    return () => {
      socket.off('absence_alert');
      socket.off('alert_accepted');
      socket.disconnect();
    };
  }, []);

  const handleReportAbsence = async () => {
    try {
      await api.post('/alerts/report', { date, period });
      alert('Absence reported. Other teachers notified.');
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to report absence');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">
            Logout
          </button>
        </div>
        <p className="mb-4">Welcome, {user?.name}</p>

        {/* Report Absence Section */}
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Report Absence</h2>
          <div className="flex gap-4 mb-4">
            <div>
              <label className="block text-sm">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm">Period</label>
              <input
                type="number"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="border px-3 py-2 rounded w-20"
                min="1"
              />
            </div>
          </div>
          <button onClick={handleReportAbsence} className="bg-yellow-500 text-white px-4 py-2 rounded">
            Report Absence
          </button>
        </div>

        {/* Pending Alerts */}
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Pending Absence Alerts</h2>
          {alerts.length === 0 ? (
            <p>No pending alerts</p>
          ) : (
            <ul>
              {alerts.map((alert) => (
                <li key={alert.id} className="border-b py-2">
                  {alert.teacher_name} absent on {alert.date}, Period {alert.period} - Status: {alert.status}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Navigation Links */}
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/teacher/attendance')}
            className="bg-blue-500 text-white p-4 rounded"
          >
            Mark Attendance
          </button>
          <button
            onClick={() => navigate('/teacher/pdfs')}
            className="bg-green-500 text-white p-4 rounded"
          >
            Manage PDFs
          </button>
          <button
            onClick={() => navigate('/messages')}
            className="bg-purple-500 text-white p-4 rounded"
          >
            Messages
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
