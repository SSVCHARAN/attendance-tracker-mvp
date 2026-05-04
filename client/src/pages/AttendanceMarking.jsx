import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const AttendanceMarking = () => {
  const navigate = useNavigate();
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState(1);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch students when classId changes
  useEffect(() => {
    if (!classId) return;
    const fetchStudents = async () => {
      try {
        const res = await api.get(`/users/students/${classId}`);
        setStudents(res.data);
        // Initialize attendance state with default 'present'
        const init = {};
        res.data.forEach((s) => {
          init[s.id] = 'present';
        });
        setAttendance(init);
      } catch (err) {
        setError('Failed to fetch students');
      }
    };
    fetchStudents();
  }, [classId]);

  const handleStatusChange = (studentId, status) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const promises = students.map((student) =>
        api.post('/attendance/mark', {
          student_id: student.id,
          class_id: classId,
          date,
          period,
          status: attendance[student.id],
        })
      );
      await Promise.all(promises);
      alert('Attendance marked successfully');
      navigate('/teacher');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Mark Attendance</h1>
          <button onClick={() => navigate('/teacher')} className="bg-gray-500 text-white px-4 py-2 rounded">
            Back
          </button>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm">Class ID</label>
              <input
                type="number"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="border px-3 py-2 rounded w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border px-3 py-2 rounded w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm">Period</label>
              <input
                type="number"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="border px-3 py-2 rounded w-full"
                min="1"
                required
              />
            </div>
          </div>

          {students.length > 0 && (
            <div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Student Name</th>
                    <th className="border p-2 text-left">Email</th>
                    <th className="border p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="border p-2">{student.name}</td>
                      <td className="border p-2">{student.email}</td>
                      <td className="border p-2">
                        <select
                          value={attendance[student.id] || 'present'}
                          onChange={(e) => handleStatusChange(student.id, e.target.value)}
                          className="border px-2 py-1 rounded"
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="leave">Leave</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                type="submit"
                disabled={loading}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          )}
          {students.length === 0 && classId && (
            <p>No students found for this class.</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default AttendanceMarking;
