import { useDiscordContext } from '@/contexts/DiscordContext';
import { CallingState } from '@stream-io/video-client';
import {
  useCallStateHooks,
  StreamTheme,
  SpeakerLayout,
  useCall,
} from '@stream-io/video-react-sdk';

import '@stream-io/video-react-sdk/dist/css/styles.css';
import { useState } from 'react';
import { toast } from 'react-toastify';

// Icons
const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V22H8v2h8v-2h-3v-1.06A9 9 0 0 0 21 12v-2h-2z" />
  </svg>
);
const MicOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M19 10v2a7 7 0 0 1-1.42 4.26l-1.43-1.43A5 5 0 0 0 17 12v-2h-2V5a3 3 0 0 0-5.47-1.68L8.1 1.89A5 5 0 0 1 17 4v4h2V10zM4.27 3L3 4.27l6 6V12a3 3 0 0 0 3 3 3 3 0 0 0 .28-.02l1.56 1.56A5 5 0 0 1 7 12v-2H5v2a7 7 0 0 0 6 6.92V21H8v2h8v-2h-3v-2.08A9 9 0 0 0 21 12v-2h-2v2a7 7 0 0 1-.29 2L4.27 3z" />
  </svg>
);
const HeadphonesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 1a9 9 0 0 0-9 9v6a3 3 0 0 0 3 3h2v-8H6v-1a6 6 0 0 1 12 0v1h-2v8h2a3 3 0 0 0 3-3v-6a9 9 0 0 0-9-9z" />
  </svg>
);
const HeadphonesOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M3 3L1.73 4.27l4.83 4.83A9 9 0 0 0 3 16v1a3 3 0 0 0 3 3h2v-8H6v-1c0-.36.03-.71.09-1.06L18.06 22H18a3 3 0 0 0 3-3v-6a9 9 0 0 0-6-8.51l-1.43-1.43A8.97 8.97 0 0 0 12 3c-1.35 0-2.62.3-3.75.82L3 3zm13.94 9H17v8h-1v-7.06zM6 16H8v3a1 1 0 0 1-1 1 1 1 0 0 1-1-1v-3z" />
  </svg>
);
const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M4 4h10a2 2 0 0 1 2 2v2.586l3.293-3.293A1 1 0 0 1 21 6v12a1 1 0 0 1-1.707.707L16 15.414V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
  </svg>
);
const CameraOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M3.707 2.293a1 1 0 0 0-1.414 1.414l18 18a1 1 0 0 0 1.414-1.414L16 14.586V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 1.272-1.865L3.707 2.293zM16 8.586l3.293-3.293A1 1 0 0 1 21 6v9.586l-5-5V8.586z" />
  </svg>
);
const ScreenShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M20 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6v2H8v2h8v-2h-2v-2h6a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 10H4V5h16v10z"/>
  </svg>
);
const RecordIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <circle cx="12" cy="12" r="7" />
  </svg>
);
const ReactionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8.009 8.009 0 0 1-8 8zm-3.5-9a1.5 1.5 0 1 0-1.5-1.5A1.5 1.5 0 0 0 8.5 11zm7 0a1.5 1.5 0 1 0-1.5-1.5 1.5 1.5 0 0 0 1.5 1.5zm-7 3a5 5 0 0 0 7 0" />
  </svg>
);
const PhoneOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.02L6.6 10.8z" />
    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const REACTION_EMOJIS = ['👍', '❤️', '👏', '🔥', '🎉', '😂', '👋', '😮'];

export default function CallLayout(): JSX.Element {
  const { setCall, server } = useDiscordContext();
  const call = useCall();
  const {
    useCallCallingState,
    useParticipantCount,
    useMicrophoneState,
    useCameraState,
    useScreenShareState,
  } = useCallStateHooks();

  const participantCount = useParticipantCount();
  const callingState = useCallCallingState();
  const { microphone, isMute: isMicMuted } = useMicrophoneState();
  const { camera, isMute: isCamMuted } = useCameraState();
  const { isMute: isScreenShareMuted } = useScreenShareState();

  const [isDeafened, setIsDeafened] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?callId=${call?.id}`
    : '';

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setLinkCopied(true);
      toast.success('Voice invite link copied to clipboard! 🔗');
      setTimeout(() => setLinkCopied(false), 3000);
    }).catch(() => {
      toast.info(`Invite: ${inviteUrl}`, { autoClose: 8000 });
    });
  };

  if (callingState !== CallingState.JOINED) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-[#313338] text-white text-xl animate-pulse">
        Connecting to voice channel...
      </div>
    );
  }

  // Toggle Microphone with Hardware Error Detection
  const toggleMic = async () => {
    try {
      if (isMicMuted) {
        await microphone.enable();
      } else {
        await microphone.disable();
      }
    } catch (err: unknown) {
      console.error('[CallLayout] Failed to toggle microphone:', err);
      const name = (err as Error)?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        toast.error('Microphone permission denied! Please allow access in browser settings.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        toast.error('Cannot detect microphone hardware on your device!');
      } else {
        toast.error('Could not access microphone. Please check your audio hardware.');
      }
    }
  };

  // Toggle Speaker / Deafen
  const toggleSpeaker = async () => {
    try {
      const newDeafened = !isDeafened;
      setIsDeafened(newDeafened);
      if (newDeafened) {
        await call?.speaker.setVolume(0);
      } else {
        await call?.speaker.setVolume(1);
      }
    } catch (err) {
      console.error('[CallLayout] Failed to toggle deafen:', err);
    }
  };

  // Toggle Camera Video with Hardware Error Detection
  const toggleCamera = async () => {
    try {
      if (isCamMuted) {
        await camera.enable();
      } else {
        await camera.disable();
      }
    } catch (err: unknown) {
      console.error('[CallLayout] Failed to toggle camera:', err);
      const name = (err as Error)?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        toast.error('Camera permission denied! Please allow camera access in browser settings.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        toast.error('Cannot detect webcam hardware on your device!');
      } else {
        toast.error('Could not access webcam. Please check your camera settings.');
      }
    }
  };

  // Toggle Screen Share with Error Detection
  const toggleScreenShare = async () => {
    try {
      await call?.screenShare.toggle();
    } catch (err: unknown) {
      console.error('[CallLayout] Failed to toggle screen share:', err);
      const name = (err as Error)?.name || '';
      if (name === 'NotAllowedError') {
        toast.info('Screen share permission was cancelled or denied.');
      } else {
        toast.error('Screen sharing failed. Please try again.');
      }
    }
  };

  // Toggle Call Recording
  const toggleRecording = async () => {
    try {
      if (isRecording) {
        await call?.stopRecording();
        setIsRecording(false);
        toast.info('Call recording stopped');
      } else {
        await call?.startRecording();
        setIsRecording(true);
        toast.success('Call recording started! 🔴');
      }
    } catch (err) {
      console.error('[CallLayout] Failed to toggle recording:', err);
      toast.error('Recording failed or not supported in this channel');
    }
  };

  // Send Emoji Reaction in Call
  const sendEmojiReaction = async (emoji: string) => {
    setShowReactions(false);
    try {
      if (call) {
        await call.sendReaction({
          type: 'reaction',
          emoji_code: emoji,
          custom: {},
        });
      }
      toast(`${emoji} Reaction sent!`, { autoClose: 1500 });
    } catch (err) {
      console.error('[CallLayout] Failed to send reaction:', err);
      toast(`${emoji}`, { autoClose: 1500 });
    }
  };

  const leaveCall = async () => {
    setLeaving(true);
    try {
      await call?.leave();
    } catch (err) {
      console.error('[CallLayout] Failed to leave call:', err);
    }
    setCall(undefined);
  };

  return (
    <StreamTheme className="flex flex-col w-full h-full bg-[#313338] relative">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2b2d31] border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <span className="text-green-400 text-sm font-semibold">🔊 Voice Connected</span>
          <span className="text-gray-400 text-xs">· {participantCount} participant{participantCount !== 1 ? 's' : ''}</span>
          {isRecording && (
            <span className="flex items-center gap-1 text-red-500 text-xs font-bold animate-pulse ml-2">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> REC
            </span>
          )}
        </div>
        {/* Invite link button */}
        <button
          onClick={() => setShowInviteModal(true)}
          title="View & copy invite link"
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#5865f2] hover:bg-[#4752c4] text-white transition-all duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
          Invite to Voice
        </button>
      </div>

      {/* Speaker layout fills remaining space */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <SpeakerLayout participantsBarPosition="bottom" />

        {/* Emoji Reactions Floating Bar */}
        {showReactions && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#232428] border border-gray-700 rounded-full px-4 py-2 flex items-center gap-3 shadow-2xl z-40 animate-bounce">
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => sendEmojiReaction(emoji)}
                className="text-2xl hover:scale-130 transition-transform duration-150 p-1"
                title={`Send ${emoji} reaction`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Full Control Bar with ALL controls: Mic, Deafen, Camera Video, Screen Share, Record, Reaction, Leave */}
      <div className="flex items-center justify-center gap-3 px-6 py-4 bg-[#232428] border-t border-gray-700 flex-shrink-0 flex-wrap">
        {/* 1. Mute / Unmute mic */}
        <button
          onClick={toggleMic}
          title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-150 ${
            isMicMuted
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-[#4f545c] hover:bg-[#686d73] text-white'
          }`}
        >
          {isMicMuted ? <MicOffIcon /> : <MicIcon />}
          <span className="text-[10px] mt-0.5">{isMicMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        {/* 2. Deafen / Undeafen speaker */}
        <button
          onClick={toggleSpeaker}
          title={isDeafened ? 'Undeafen' : 'Deafen'}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-150 ${
            isDeafened
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-[#4f545c] hover:bg-[#686d73] text-white'
          }`}
        >
          {isDeafened ? <HeadphonesOffIcon /> : <HeadphonesIcon />}
          <span className="text-[10px] mt-0.5">{isDeafened ? 'Undeafen' : 'Deafen'}</span>
        </button>

        {/* 3. Camera Video On / Off */}
        <button
          onClick={toggleCamera}
          title={isCamMuted ? 'Turn On Camera' : 'Turn Off Camera'}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-150 ${
            !isCamMuted
              ? 'bg-green-600 hover:bg-green-500 text-white'
              : 'bg-[#4f545c] hover:bg-[#686d73] text-white'
          }`}
        >
          {!isCamMuted ? <CameraIcon /> : <CameraOffIcon />}
          <span className="text-[10px] mt-0.5">{!isCamMuted ? 'Cam On' : 'Cam Off'}</span>
        </button>

        {/* 4. Share Screen */}
        <button
          onClick={toggleScreenShare}
          title={!isScreenShareMuted ? 'Stop Sharing Screen' : 'Share Screen'}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-150 ${
            !isScreenShareMuted
              ? 'bg-[#5865f2] hover:bg-[#4752c4] text-white'
              : 'bg-[#4f545c] hover:bg-[#686d73] text-white'
          }`}
        >
          <ScreenShareIcon />
          <span className="text-[10px] mt-0.5">{!isScreenShareMuted ? 'Sharing' : 'Share'}</span>
        </button>

        {/* 5. Record Call */}
        <button
          onClick={toggleRecording}
          title={isRecording ? 'Stop Recording' : 'Start Recording'}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-150 ${
            isRecording
              ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
              : 'bg-[#4f545c] hover:bg-[#686d73] text-white'
          }`}
        >
          <RecordIcon />
          <span className="text-[10px] mt-0.5">{isRecording ? 'Stop Rec' : 'Record'}</span>
        </button>

        {/* 6. Emoji Reactions */}
        <button
          onClick={() => setShowReactions(!showReactions)}
          title="Send Reaction Emoji"
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-150 ${
            showReactions
              ? 'bg-amber-500 text-white'
              : 'bg-[#4f545c] hover:bg-[#686d73] text-white'
          }`}
        >
          <ReactionIcon />
          <span className="text-[10px] mt-0.5">React</span>
        </button>

        {/* 7. Leave Call */}
        <button
          onClick={leaveCall}
          disabled={leaving}
          title="Disconnect"
          className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white transition-all duration-150 disabled:opacity-50 ml-2"
        >
          <PhoneOffIcon />
          <span className="text-[10px] mt-0.5">Leave</span>
        </button>
      </div>

      {/* Voice Channel Invite Modal */}
      {showInviteModal && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#313338] border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Invite to Voice Channel</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-300">
              Anyone with this link can join this active voice call directly in {server?.name || 'Discord'}.
            </p>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Voice Invite URL
              </label>
              <input
                type="text"
                readOnly
                value={inviteUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="w-full bg-[#1e1f22] text-white px-3 py-2.5 rounded-md border border-gray-700 text-sm font-mono focus:outline-none focus:border-[#5865f2]"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 rounded-md text-xs font-semibold bg-gray-600 hover:bg-gray-500 text-white"
              >
                Close
              </button>
              <button
                onClick={copyInviteLink}
                className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
                  linkCopied ? 'bg-green-600 text-white' : 'bg-[#5865f2] hover:bg-[#4752c4] text-white'
                }`}
              >
                {linkCopied ? '✓ Copied' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </StreamTheme>
  );
}