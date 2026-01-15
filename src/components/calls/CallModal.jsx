import { useState } from 'react';
import { useWebRTC } from '../../hooks/useWebRTC';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import { Phone, Video } from 'lucide-react';

const CallModal = ({ isOpen, onClose, recipient }) => {
  const { initiateCall } = useWebRTC();
  const [callType, setCallType] = useState('voice');

  const handleCall = () => {
    initiateCall(recipient._id, callType, recipient.conversationId);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Start Call" size="sm">
      <div className="text-center space-y-6">
        <Avatar
          src={recipient?.avatarUrl}
          name={recipient?.name}
          size="xl"
          className="mx-auto"
        />

        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-1">
            {recipient?.name}
          </h3>
          <p className="text-gray-500">Select call type</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setCallType('voice')}
            className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
              callType === 'voice'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Phone size={24} className="mx-auto mb-2 text-gray-700" />
            <p className="text-sm font-medium">Voice Call</p>
          </button>

          <button
            onClick={() => setCallType('video')}
            className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
              callType === 'video'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Video size={24} className="mx-auto mb-2 text-gray-700" />
            <p className="text-sm font-medium">Video Call</p>
          </button>
        </div>

        <Button onClick={handleCall} variant="primary" className="w-full">
          Start {callType === 'voice' ? 'Voice' : 'Video'} Call
        </Button>
      </div>
    </Modal>
  );
};

export default CallModal; 