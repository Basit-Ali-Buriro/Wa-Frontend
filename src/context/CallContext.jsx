import { createContext, useState, useEffect, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import webrtcService from '../services/webrtc';
import toast from 'react-hot-toast';

export const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [callStatus, setCallStatus] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStartTime, setCallStartTime] = useState(null);
  const [callTimeout, setCallTimeout] = useState(null);

  // Debug: Log socket status
  useEffect(() => {
    console.log('🔍 CallProvider mounted/updated');
    console.log('🔍 Socket available:', !!socket);
    console.log('🔍 Socket connected:', socket?.connected);
    console.log('🔍 Socket ID:', socket?.id);
    
    // Expose socket globally for testing
    if (socket && typeof window !== 'undefined') {
      window.testCallSocket = (recipientUserId) => {
        console.log('🧪 Sending test call event to:', recipientUserId);
        socket.emit('test-call-event', { targetUserId: recipientUserId });
      };
      console.log('🧪 Test function available: window.testCallSocket(recipientUserId)');
    }
  }, [socket]);

  // Initiate call
  const initiateCall = async (recipientId, callType, conversationId) => {
    try {
      console.log('📞 ========================================');
      console.log('📞 INITIATING CALL');
      console.log('📞 Recipient ID:', recipientId);
      console.log('📞 Call Type:', callType);
      console.log('📞 Conversation ID:', conversationId);
      console.log('📞 Socket Connected:', socket?.connected);
      console.log('📞 Socket ID:', socket?.id);
      console.log('📞 ========================================');
      
      const isVideo = callType === 'video';
      console.log('🎥 Requesting media:', isVideo ? 'video + audio' : 'audio only');
      
      const stream = await webrtcService.getLocalStream(isVideo);
      console.log('✅ Got local stream:', stream.getTracks().map(t => `${t.kind}: ${t.label}`));
      
      setLocalStream(stream);

      await webrtcService.initializePeerConnection();
      webrtcService.addLocalStreamToPeer();

      console.log('📤 Emitting call:initiate event');
      socket?.emit('call:initiate', {
        recipientId,
        callType,
        conversationId,
      });

      const callData = { recipientId, callType, conversationId, status: 'ringing' };
      setActiveCall(callData);
      setCallStatus('ringing');

      // Set timeout for no answer (45 seconds)
      const timeout = setTimeout(() => {
        if (callStatus === 'ringing') {
          console.log('⏰ Call timeout - no answer');
          socket?.emit('call:no-answer', {
            recipientId,
            callId: callData.callId,
            conversationId
          });
          toast.error('No answer');
          endCall('missed');
        }
      }, 45000);
      setCallTimeout(timeout);

    } catch (error) {
      console.error('❌ Failed to initiate call:', error);
      toast.error('Failed to access camera/microphone');
      console.error(error);
    }
  };

  // Accept call
  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      console.log('✅ Accepting call:', incomingCall);
      
      const isVideo = incomingCall.callType === 'video';
      console.log('🎥 Requesting media for accept:', isVideo ? 'video + audio' : 'audio only');
      
      const stream = await webrtcService.getLocalStream(isVideo);
      console.log('✅ Got local stream for accept:', stream.getTracks().map(t => `${t.kind}: ${t.label}`));
      
      setLocalStream(stream);

      await webrtcService.initializePeerConnection();
      webrtcService.addLocalStreamToPeer();

      console.log('📤 Emitting call:accept event');
      socket?.emit('call:accept', { callerId: incomingCall.callerId });

      setActiveCall({
        ...incomingCall,
        recipientId: incomingCall.callerId
      });
      setCallStatus('accepted');
      setIncomingCall(null);
      
      console.log('✅ Call accepted successfully');
    } catch (error) {
      console.error('❌ Failed to accept call:', error);
      toast.error('Failed to accept call');
      console.error(error);
    }
  };

  // Reject call
  const rejectCall = () => {
    if (!incomingCall) return;

    socket?.emit('call:reject', {
      callerId: incomingCall.callerId,
      reason: 'rejected',
      callId: incomingCall.callId,
      conversationId: incomingCall.conversationId,
    });

    setIncomingCall(null);
  };

  // End call
  const endCall = useCallback((reason = 'completed') => {
    console.log('🔴 Ending call with reason:', reason);
    
    if (!activeCall) {
      console.log('⚠️ No active call to end');
      return;
    }

    // Clear timeout
    if (callTimeout) {
      clearTimeout(callTimeout);
      setCallTimeout(null);
    }

    // Calculate call duration
    const duration = callStartTime ? Math.floor((Date.now() - callStartTime) / 1000) : 0;

    console.log('📊 Call stats:', { duration, callId: activeCall.callId, conversationId: activeCall.conversationId });

    socket?.emit('call:end', { 
      recipientId: activeCall.recipientId || activeCall.callerId
    });

    if (activeCall.callId && activeCall.conversationId) {
      socket?.emit('call:ended', {
        callId: activeCall.callId,
        conversationId: activeCall.conversationId,
        reason,
        duration
      });
    }

    webrtcService.endCall();
    setLocalStream(null);
    setRemoteStream(null);
    setActiveCall(null);
    setCallStatus(null);
    setCallStartTime(null);
    
    console.log('✅ Call ended successfully');
  }, [activeCall, callTimeout, callStartTime, socket]);

  // WebRTC callbacks
  useEffect(() => {
    webrtcService.onIceCandidate = (candidate) => {
      console.log('🧊 Local ICE candidate generated');
      socket?.emit('webrtc:ice-candidate', {
        recipientId: activeCall?.recipientId,
        candidate,
      });
    };

    webrtcService.onRemoteStream = (stream) => {
      console.log('📺 Remote stream received:', stream.getTracks().map(t => `${t.kind}: ${t.label}`));
      setRemoteStream(stream);
      setCallStatus('connected');
      setCallStartTime(Date.now()); // Start tracking call duration when connected
    };

    webrtcService.onConnectionStateChange = (state) => {
      console.log('🔌 Connection state changed:', state);
      if (state === 'disconnected' || state === 'failed') {
        console.log('❌ Connection lost, ending call');
        endCall('completed');
      }
    };
  }, [socket, activeCall, endCall]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) {
      console.log('⚠️ CallContext: No socket available');
      return;
    }

    console.log('🔌 CallContext: Setting up socket event listeners');
    console.log('🔌 Socket connected:', socket.connected);
    console.log('🔌 Socket ID:', socket.id);

    const handleIncomingCall = (callData) => {
      console.log('📞 ========================================');
      console.log('📞 INCOMING CALL RECEIVED!');
      console.log('📞 Call Data:', JSON.stringify(callData, null, 2));
      console.log('📞 ========================================');
      setIncomingCall(callData);
    };

    socket.on('call:incoming', handleIncomingCall);

    socket.on('call:ringing', ({ callId }) => {
      console.log('🔔 Call ringing, callId:', callId);
      // Update active call with callId
      setActiveCall(prev => prev ? { ...prev, callId } : prev);
    });

    socket.on('call:accepted', async () => {
      console.log('✅ Call accepted by recipient');
      
      // Clear timeout when call is accepted
      if (callTimeout) {
        clearTimeout(callTimeout);
        setCallTimeout(null);
      }
      
      console.log('🔄 Creating WebRTC offer...');
      const offer = await webrtcService.createOffer();
      console.log('📤 Sending WebRTC offer');
      socket.emit('webrtc:offer', {
        recipientId: activeCall.recipientId,
        offer,
      });
    });

    socket.on('call:rejected', () => {
      console.log('❌ Call rejected by recipient');
      toast.error('Call rejected');
      endCall('rejected');
    });

    socket.on('call:ended', () => {
      console.log('🔴 Call ended by other user');
      endCall('completed');
    });

    socket.on('webrtc:offer', async ({ senderId, offer }) => {
      console.log('📥 Received WebRTC offer from:', senderId);
      const answer = await webrtcService.createAnswer(offer);
      console.log('📤 Sending WebRTC answer');
      socket.emit('webrtc:answer', { recipientId: senderId, answer });
    });

    socket.on('webrtc:answer', async ({ answer }) => {
      console.log('📥 Received WebRTC answer');
      await webrtcService.setRemoteDescription(answer);
    });

    socket.on('webrtc:ice-candidate', async ({ candidate }) => {
      console.log('🧊 Received ICE candidate');
      await webrtcService.addIceCandidate(candidate);
    });

    return () => {
      console.log('🧹 CallContext: Cleaning up socket event listeners');
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:ringing');
      socket.off('call:accepted');
      socket.off('call:rejected');
      socket.off('call:ended');
      socket.off('webrtc:offer');
      socket.off('webrtc:answer');
      socket.off('webrtc:ice-candidate');
    };
  }, [socket, activeCall, callTimeout, endCall]);

  return (
    <CallContext.Provider
      value={{
        incomingCall,
        activeCall,
        callStatus,
        localStream,
        remoteStream,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};