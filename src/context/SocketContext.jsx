import { createContext, useEffect, useState, useContext } from 'react';
import socketService from '../services/socket';
import { useAuth } from '../hooks/useAuth';

export const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);


export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const socketInstance = socketService.connect();
      setSocket(socketInstance);

      socketInstance.on('connect', () => {
        setConnected(true);
      });

      socketInstance.on('disconnect', () => {
        setConnected(false);
      });

      socketInstance.on('update-online-users', (users) => {
        setOnlineUsers(users);
      });

      return () => {
        socketService.disconnect();
        setSocket(null);
        setConnected(false);
      };
    }
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, connected }}>
      {children}
    </SocketContext.Provider>
  );
};