import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { currentUser } = useSelector((state) => state.user);

  useEffect(() => {
    // Reconnect on login/logout so the server re-reads the auth cookie on handshake.
    const newSocket = io();
    setSocket(newSocket);

    return () => newSocket.close();
  }, [currentUser?._id]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
