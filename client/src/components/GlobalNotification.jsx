import { Toast } from 'flowbite-react';
import { HiBell, HiX } from 'react-icons/hi';
import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Link } from 'react-router-dom';

export default function GlobalNotification() {
  const [notification, setNotification] = useState(null);
  const socket = useSocket();

  useEffect(() => {
    if (socket) {
      socket.on('notification', (data) => {
        setNotification(data);
        // Auto-hide after 5 seconds
        setTimeout(() => setNotification(null), 5000);
      });

      return () => socket.off('notification');
    }
  }, [socket]);

  if (!notification) return null;

  return (
    <div className="fixed top-20 right-5 z-[9999] animate-bounce">
      <Toast>
        <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-cyan-500 dark:bg-cyan-800 dark:text-cyan-200">
          <HiBell className="h-5 w-5" />
        </div>
        <div className="ml-3 text-sm font-normal">
          <span className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
            New Activity!
          </span>
          <div className="text-sm font-normal">
            {notification.message}
          </div>
          {(notification.type === 'MESSAGE' || notification.message?.includes('message')) ? (
            <Link 
              to="/chat" 
              className="text-cyan-600 hover:underline text-xs font-bold"
              onClick={() => {
                console.log('[DEBUG] Redirecting to Chat from notification:', notification);
                setNotification(null);
              }}
            >
              Open Chat →
            </Link>
          ) : (notification.postId || notification.postSlug) ? (
            <Link 
              to={`/post/${notification.postSlug || notification.postId}`} 
              className="text-cyan-600 hover:underline text-xs font-bold"
              onClick={() => {
                console.log('[DEBUG] Redirecting to Post from notification:', notification);
                setNotification(null);
              }}
            >
              View Story →
            </Link>
          ) : (
            <Link 
              to="/" 
              className="text-cyan-600 hover:underline text-xs font-bold"
              onClick={() => setNotification(null)}
            >
              View Update →
            </Link>
          )}
        </div>
        <Toast.Toggle onDismiss={() => setNotification(null)} />
      </Toast>
    </div>
  );
}
