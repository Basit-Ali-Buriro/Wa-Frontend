import { useContext } from 'react';
import { CallContext } from '../context/CallContext';

export const useWebRTC = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useWebRTC must be used within CallProvider');
  }
  return context;
};