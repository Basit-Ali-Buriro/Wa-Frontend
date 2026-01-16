import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useWebRTC } from '../../hooks/useWebRTC';
import { Phone, Mic, MicOff, Video, VideoOff, SwitchCamera } from 'lucide-react';

const VideoCallInterface = () => {
  const { activeCall, localStream, remoteStream, endCall, callStatus } = useWebRTC();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [facingMode, setFacingMode] = useState('user'); // 'user' for front, 'environment' for back

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!activeCall) return null;

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    setIsVideoOff(prev => !prev);
  };

  const switchCamera = async () => {
    if (!localStream || activeCall.callType !== 'video') return;

    try {
      const newFacingMode = facingMode === 'user' ? 'environment' : 'user';

      // Stop current video track
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop();
      }

      // Get new stream with switched camera
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: true
      });

      // Replace video track in local stream
      const newVideoTrack = newStream.getVideoTracks()[0];
      localStream.removeTrack(videoTrack);
      localStream.addTrack(newVideoTrack);

      // Update video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      setFacingMode(newFacingMode);
    } catch (error) {
      console.error('Failed to switch camera:', error);
    }
  };

  if (!activeCall) return null;

  const callInterface = (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Remote video/audio (full screen) */}
      <div className="relative w-full h-full">
        {remoteStream && activeCall.callType === 'video' ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : remoteStream && activeCall.callType === 'voice' ? (
          <>
            <audio
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="hidden"
            />
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
              <div className="text-center text-white">
                <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl backdrop-blur-sm">
                  {activeCall.recipientName?.[0] || activeCall.callerName?.[0] || '?'}
                </div>
                <p className="text-2xl font-semibold mb-2">
                  {activeCall.recipientName || activeCall.callerName || 'Unknown'}
                </p>
                <p className="text-blue-200 text-lg">{callStatus}...</p>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <div className="w-32 h-32 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">
                {activeCall.recipientName?.[0] || activeCall.callerName?.[0] || '?'}
              </div>
              <p className="text-xl">{activeCall.recipientName || activeCall.callerName || 'Unknown'}</p>
              <p className="text-gray-400 mt-2">{callStatus}...</p>

              {/* Cancel button during ringing (for caller) */}
              {callStatus === 'ringing' && activeCall.recipientName && (
                <button
                  onClick={() => endCall('cancelled')}
                  className="mt-6 bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full transition-colors font-semibold"
                >
                  Cancel Call
                </button>
              )}
            </div>
          </div>
        )}

        {/* Local video (picture-in-picture) - Only for video calls */}
        {activeCall.callType === 'video' && localStream && (
          <div className="absolute top-4 right-4 w-32 h-48 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
            {!isVideoOff ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <VideoOff size={32} className="text-gray-400" />
              </div>
            )}
          </div>
        )}

        {/* Hidden audio element for voice calls */}
        {activeCall.callType === 'voice' && localStream && (
          <audio
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="hidden"
          />
        )}

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
              } text-white`}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          {activeCall.callType === 'video' && (
            <>
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-colors ${isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
                  } text-white`}
              >
                {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
              </button>

              {!isVideoOff && (
                <button
                  onClick={switchCamera}
                  className="p-4 rounded-full transition-colors bg-gray-700 hover:bg-gray-600 text-white"
                  title="Switch camera"
                >
                  <SwitchCamera size={24} />
                </button>
              )}
            </>
          )}

          <button
            onClick={endCall}
            className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
          >
            <Phone size={24} className="transform rotate-135" />
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(callInterface, document.body);
};

export default VideoCallInterface;