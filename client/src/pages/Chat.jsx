import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Button, TextInput, Spinner } from 'flowbite-react';
import { useSocket } from '../context/SocketContext';
import { HiPaperAirplane, HiUser } from 'react-icons/hi';
import { Link, useLocation } from 'react-router-dom';

export default function Chat() {
  const { currentUser } = useSelector((state) => state.user);
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const socket = useSocket();
  const messageEndRef = useRef(null);

  // Scroll to bottom
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch Conversations & Handle Deep Link
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch('/api/message/conversations');
        const data = await res.json();
        if (res.ok) {
            setConversations(data);
            
            // Check for userId in URL
            const searchParams = new URLSearchParams(location.search);
            const targetUserId = searchParams.get('userId');
            if (targetUserId) {
                // Check if conversation already exists
                const existing = data.find(c => c.participants[0]._id === targetUserId);
                if (existing) setActiveChat(existing);
                else {
                    // Start a temporary conversation UI
                    // (The real conversation is created on the first message)
                    try {
                        const userRes = await fetch(`/api/user/${targetUserId}`);
                        const userData = await userRes.json();
                        if (userRes.ok) {
                            setActiveChat({
                                participants: [userData],
                                _id: 'temp', // Flag for temporary chat
                            });
                        }
                    } catch (err) { console.log(err); }
                }
            }
        }
      } catch (err) { console.log(err); }
    };
    fetchConversations();
  }, [location.search]);

  // Fetch Messages for Active Chat
  useEffect(() => {
    if (!activeChat) return;
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/message/${activeChat.participants[0]._id}`);
        const data = await res.json();
        if (res.ok) setMessages(data);
      } catch (err) { console.log(err); }
      setLoading(false);
    };
    fetchMessages();
  }, [activeChat]);

  // Socket Listener for new messages
  useEffect(() => {
    if (socket) {
      socket.on('newMessage', (msg) => {
        if (activeChat && (msg.senderId === activeChat.participants[0]._id || msg.receiverId === activeChat.participants[0]._id)) {
          setMessages((prev) => {
            if (prev.find((m) => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
        }
        // Update last message in sidebar
        setConversations((prev) => prev.map(c => {
            if (c.participants[0]._id === msg.senderId || c.participants[0]._id === msg.receiverId) {
                return { ...c, lastMessage: { text: msg.text, senderId: msg.senderId } };
            }
            return c;
        }));
      });
      return () => socket.off('newMessage');
    }
  }, [socket, activeChat]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    try {
      const res = await fetch(`/api/message/send/${activeChat.participants[0]._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newMessage }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, data]);
        setNewMessage('');
      }
    } catch (err) { console.log(err); }
  };

  return (
    <div className='max-w-6xl mx-auto flex h-[calc(100vh-100px)] mt-5 border rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-xl'>
      {/* Sidebar */}
      <div className='w-1/3 border-r dark:border-slate-700 flex flex-col'>
        <div className='p-4 font-bold text-xl border-b dark:border-slate-700'>Messages</div>
        <div className='flex-1 overflow-y-auto'>
          {conversations.map((conv) => (
            <div
              key={conv._id}
              onClick={() => setActiveChat(conv)}
              className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors ${activeChat?._id === conv._id ? 'bg-teal-50 dark:bg-slate-800 border-l-4 border-teal-500' : ''}`}
            >
              <img
                src={conv.participants[0]?._id === currentUser._id ? currentUser.profilePicture : conv.participants[0]?.profilePicture}
                className='h-12 w-12 rounded-full object-cover border-2 border-teal-500'
                alt='user'
              />
              <div className='flex-1 min-w-0'>
                <p className='font-bold truncate'>
                  {conv.participants[0]?._id === currentUser._id ? `${currentUser.username} (You)` : conv.participants[0]?.username}
                </p>
                <p className='text-sm text-gray-500 truncate'>{conv.lastMessage?.text}</p>
              </div>
            </div>
          ))}
          {conversations.length === 0 && <p className='p-4 text-center text-gray-500'>No chats yet. Start one!</p>}
        </div>
      </div>

      {/* Chat Area */}
      <div className='flex-1 flex flex-col bg-slate-50 dark:bg-slate-900'>
        {activeChat ? (
          <>
            <div className='p-4 bg-white dark:bg-slate-800 border-b dark:border-slate-700 flex items-center gap-3'>
              <img 
                src={activeChat.participants[0]?._id === currentUser._id ? currentUser.profilePicture : activeChat.participants[0]?.profilePicture} 
                className='h-10 w-10 rounded-full' 
                alt='' 
              />
              <span className='font-bold'>
                {activeChat.participants[0]?._id === currentUser._id ? `${currentUser.username} (You)` : activeChat.participants[0]?.username}
              </span>
            </div>
            
            <div className='flex-1 p-4 overflow-y-auto flex flex-col gap-3'>
              {loading ? <Spinner size='xl' className='mx-auto mt-10' /> : (
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`max-w-[70%] p-3 rounded-2xl shadow-sm text-sm ${msg.senderId === currentUser._id ? 'bg-teal-500 text-white self-end rounded-tr-none' : 'bg-white dark:bg-slate-800 self-start rounded-tl-none'}`}
                  >
                    {msg.text}
                    <p className={`text-[10px] mt-1 ${msg.senderId === currentUser._id ? 'text-teal-100' : 'text-gray-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))
              )}
              <div ref={messageEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className='p-4 bg-white dark:bg-slate-800 border-t dark:border-slate-700 flex gap-2'>
              <TextInput
                className='flex-1'
                placeholder='Type a message...'
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <Button type='submit' gradientDuoTone='purpleToBlue'>
                <HiPaperAirplane className='rotate-90' />
              </Button>
            </form>
          </>
        ) : (
          <div className='flex-1 flex flex-col items-center justify-center text-gray-500'>
            <HiUser className='h-20 w-20 opacity-20' />
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
