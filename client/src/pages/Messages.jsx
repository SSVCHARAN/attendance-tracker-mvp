import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import socket from '../socket/socket';

const Messages = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [classId, setClassId] = useState(user?.class_id || '');

  useEffect(() => {
    socket.connect();
    // Fetch existing messages
    const fetchMessages = async () => {
      try {
        const res = await api.get('/messages/user');
        setMessages(res.data);
      } catch (err) {
        console.error('Failed to fetch messages', err);
      }
    };
    fetchMessages();

    // Listen for new messages
    socket.on('new_message', (msg) => {
      setMessages((prev) => [msg, ...prev]);
    });

    return () => {
      socket.off('new_message');
      socket.disconnect();
    };
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content) return;
    try {
      await api.post('/messages/send', {
        receiver_id: receiverId || null,
        class_id: classId || null,
        content,
      });
      setContent('');
      setReceiverId('');
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to send message');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Messages</h1>
          <button onClick={() => { logout(); navigate('/'); }} className="bg-red-500 text-white px-4 py-2 rounded">
            Logout
          </button>
        </div>

        {/* Send Message Form */}
        <form onSubmit={handleSend} className="bg-white p-4 rounded shadow mb-6">
          <div className="mb-4">
            <label className="block text-sm">Message</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              rows="3"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm">Receiver ID (1:1)</label>
              <input
                type="number"
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                className="w-full border px-3 py-2 rounded"
                placeholder="Leave empty for class-wide"
              />
            </div>
            <div>
              <label className="block text-sm">Class ID (class-wide)</label>
              <input
                type="number"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full border px-3 py-2 rounded"
                placeholder="Your class ID"
              />
            </div>
          </div>
          <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded">
            Send Message
          </button>
        </form>

        {/* Messages List */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Messages</h2>
          {messages.length === 0 ? (
            <p>No messages yet.</p>
          ) : (
            <ul>
              {messages.map((msg) => (
                <li key={msg.id} className="border-b py-2">
                  <div className="font-semibold">{msg.sender_name}</div>
                  <div>{msg.content}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(msg.created_at).toLocaleString()}
                    {msg.class_id && <span> (Class-wide)</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
