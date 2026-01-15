import { createPortal } from 'react-dom';
import { useWebRTC } from '../../hooks/useWebRTC';
import { Phone, PhoneOff, Video } from 'lucide-react';
import Avatar from '../common/Avatar';
import { useEffect } from 'react';

const IncomingCallModal = () => {
  const { incomingCall, acceptCall, rejectCall } = useWebRTC();

  useEffect(() => {
    if (incomingCall) {
      console.log('📞 IncomingCallModal: Rendering with call data:', incomingCall);
    }
  }, [incomingCall]);

  if (!incomingCall) {
    console.log('IncomingCallModal: No incoming call, returning null');
    return null;
  }

  console.log('IncomingCallModal: Rendering modal for:', incomingCall.callerName);

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-white rounded-lg p-8 max-w-sm w-full text-center">
        <div className="mb-6">
          <Avatar
            src={incomingCall.callerAvatar}
            name={incomingCall.callerName}
            size="xl"
            className="mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {incomingCall.callerName}
          </h2>
          <p className="text-gray-600">
            Incoming {incomingCall.callType} call...
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              console.log('🔴 Rejecting call');
              rejectCall();
            }}
            className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition-colors"
          >
            <PhoneOff size={24} />
          </button>

          <button
            onClick={() => {
              console.log('✅ Accepting call');
              acceptCall();
            }}
            className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full transition-colors"
          >
            {incomingCall.callType === 'video' ? (
              <Video size={24} />
            ) : (
              <Phone size={24} />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default IncomingCallModal;