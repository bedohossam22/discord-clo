import { useDiscordContext } from '@/contexts/DiscordContext';
import { useChatContext } from 'stream-chat-react';
import { Call, StreamVideoParticipant, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { useCallback, useEffect, useState } from 'react';
import { ChevronRight, DiscordIcon, PlusIcon, Speaker } from '../../Icons';
import Link from 'next/link';
import Image from 'next/image';

const MicMutedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-red-500">
    <title>Muted</title>
    <path d="M19 10v2a7 7 0 0 1-1.42 4.26l-1.43-1.43A5 5 0 0 0 17 12v-2h-2V5a3 3 0 0 0-5.47-1.68L8.1 1.89A5 5 0 0 1 17 4v4h2V10zM4.27 3L3 4.27l6 6V12a3 3 0 0 0 3 3 3 3 0 0 0 .28-.02l1.56 1.56A5 5 0 0 1 7 12v-2H5v2a7 7 0 0 0 6 6.92V21H8v2h8v-2h-3v-2.08A9 9 0 0 0 21 12v-2h-2v2a7 7 0 0 1-.29 2L4.27 3z" />
  </svg>
);

const VideoActiveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-green-500">
    <title>Camera On</title>
    <path d="M4 4h10a2 2 0 0 1 2 2v2.586l3.293-3.293A1 1 0 0 1 21 6v12a1 1 0 0 1-1.707.707L16 15.414V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
  </svg>
);

const LiveScreenShareIcon = () => (
  <span className="px-1 py-0.5 text-[9px] font-bold bg-red-600 text-white rounded tracking-wider uppercase" title="Sharing Screen">
    LIVE
  </span>
);

type DisplayParticipant = {
  sessionId: string;
  userId: string;
  name: string;
  image?: string;
  isSpeaking: boolean;
  isMuted: boolean;
  hasVideo: boolean;
  hasScreenShare: boolean;
};

function CallItem({ call }: { call: Call }): JSX.Element {
  const { callId, setCall } = useDiscordContext();
  const { client: chatClient } = useChatContext();
  const isJoined = call.id === callId;

  const [rtcParticipants, setRtcParticipants] = useState<StreamVideoParticipant[]>([]);
  const [sessionParticipants, setSessionParticipants] = useState<any[]>([]);

  useEffect(() => {
    // 1. WebRTC live participants
    setRtcParticipants(call.state.participants ?? []);
    const subRtc = call.state.participants$.subscribe((pts) => {
      setRtcParticipants(pts);
    });

    // 2. Server-side session participants
    const currentSession = call.state.session;
    if (currentSession?.participants) {
      setSessionParticipants(currentSession.participants);
    }
    const subSession = call.state.session$.subscribe((sess) => {
      if (sess?.participants) {
        setSessionParticipants(sess.participants);
      }
    });

    // 3. Real-time WS events for join / leave
    const unsubJoin = call.on('call.session_participant_joined', (event: any) => {
      if (event?.participant) {
        setSessionParticipants((prev) => {
          const newUserId = event.participant.user?.id || event.participant.user_session_id;
          const exists = prev.some((p) => (p.user?.id || p.user_session_id) === newUserId);
          if (exists) return prev;
          return [...prev, event.participant];
        });
      }
    });

    const unsubLeft = call.on('call.session_participant_left', (event: any) => {
      if (event?.participant) {
        const leftId = event.participant.user?.id || event.participant.user_session_id;
        setSessionParticipants((prev) =>
          prev.filter((p) => (p.user?.id || p.user_session_id) !== leftId)
        );
      }
    });

    return () => {
      subRtc.unsubscribe();
      subSession.unsubscribe();
      unsubJoin();
      unsubLeft();
    };
  }, [call]);

  // Combine sessionParticipants & rtcParticipants into a unified list, keyed by userId
  const participantMap = new Map<string, DisplayParticipant>();

  // A. Add session participants (server-level)
  for (const sp of sessionParticipants) {
    const uId = sp.user?.id || sp.user_session_id;
    if (!uId) continue;
    participantMap.set(uId, {
      sessionId: sp.user_session_id || uId,
      userId: uId,
      name: sp.user?.name || sp.user?.id || uId,
      image: sp.user?.image as string | undefined,
      isSpeaking: false,
      isMuted: false,
      hasVideo: false,
      hasScreenShare: false,
    });
  }

  // B. Overlay RTC participants (live speaking / mic / video info)
  for (const rp of rtcParticipants) {
    const uId = rp.userId;
    if (!uId) continue;
    const published = (rp.publishedTracks || []) as unknown as number[];
    const hasAudio = !!rp.audioStream || published.includes(1);
    const hasVideo = !!rp.videoStream || published.includes(2);
    const hasScreenShare = !!rp.screenShareStream || published.includes(3);

    participantMap.set(uId, {
      sessionId: rp.sessionId || uId,
      userId: uId,
      name: rp.name || uId,
      image: rp.image as string | undefined,
      isSpeaking: rp.isSpeaking || false,
      isMuted: !hasAudio,
      hasVideo,
      hasScreenShare,
    });
  }

  // C. Fallback: If local user is joined but not in map yet, add local user
  if (isJoined && chatClient?.userID && !participantMap.has(chatClient.userID)) {
    participantMap.set(chatClient.userID, {
      sessionId: 'local-session',
      userId: chatClient.userID,
      name: chatClient.user?.name || 'You',
      image: chatClient.user?.image as string | undefined,
      isSpeaking: false,
      isMuted: false,
      hasVideo: false,
      hasScreenShare: false,
    });
  }

  const effectiveParticipants = Array.from(participantMap.values());
  const callName = (call.state.custom as Record<string, any>)?.callName || 'Voice Channel';

  return (
    <div className="w-full">
      <button
        className={`w-full flex items-center px-2 py-1.5 hover:bg-gray-200 rounded-md transition ${
          isJoined ? 'bg-gray-200/80 font-bold text-gray-900' : 'text-gray-600'
        }`}
        onClick={() => {
          setCall(call.id);
        }}
      >
        <Speaker className={`w-5 h-5 mr-2 ${isJoined ? 'text-green-600' : 'text-gray-500'}`} />
        <span className="text-sm truncate">{callName}</span>
        {effectiveParticipants.length > 0 && (
          <span className="ml-auto text-[11px] text-gray-500 font-normal">
            {effectiveParticipants.length}
          </span>
        )}
      </button>

      {/* Participants list shown when anyone is in the channel */}
      {effectiveParticipants.length > 0 && (
        <div className="ml-4 mt-0.5 space-y-0.5">
          {effectiveParticipants.map((participant) => {
            const name = participant.name || participant.userId || 'User';
            const image = participant.image;
            const isMe = participant.userId === chatClient?.userID;
            const isSpeaking = participant.isSpeaking;
            const isMuted = participant.isMuted;
            const hasVideo = participant.hasVideo;
            const hasScreenShare = participant.hasScreenShare;

            return (
              <div
                key={participant.userId}
                className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 transition group"
              >
                {/* Avatar / Discord Icon */}
                <div className="relative flex-shrink-0">
                  {image ? (
                    <Image
                      src={image}
                      alt={name}
                      width={20}
                      height={20}
                      className={`w-5 h-5 rounded-full object-cover ${
                        isSpeaking ? 'ring-2 ring-green-500' : ''
                      }`}
                    />
                  ) : (
                    <div
                      className={`w-5 h-5 rounded-full bg-[#5865f2] flex items-center justify-center text-white ${
                        isSpeaking ? 'ring-2 ring-green-500' : ''
                      }`}
                    >
                      <DiscordIcon className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <span
                    className={`absolute bottom-0 right-0 w-2 h-2 border border-white rounded-full ${
                      isSpeaking ? 'bg-green-400 animate-pulse' : 'bg-green-500'
                    }`}
                  />
                </div>

                {/* Participant Name */}
                <span className="text-xs text-gray-700 truncate max-w-[100px]">
                  {isMe ? (
                    <span>
                      {name} <span className="text-[10px] text-gray-400 font-medium">(You)</span>
                    </span>
                  ) : (
                    name
                  )}
                </span>

                {/* Status Icons on the right */}
                <div className="ml-auto flex items-center gap-1">
                  {hasScreenShare && <LiveScreenShareIcon />}
                  {hasVideo && <VideoActiveIcon />}
                  {isMuted && <MicMutedIcon />}

                  {isJoined && isMe && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCall(undefined);
                      }}
                      className="text-[10px] text-red-500 hover:text-red-700 font-bold hover:underline ml-1"
                      title="Disconnect from call"
                    >
                      Leave
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CallList(): JSX.Element {
  const { server } = useDiscordContext();
  const client = useStreamVideoClient();

  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [calls, setCalls] = useState<Call[]>([]);

  const loadAudioChannels = useCallback(async () => {
    if (!client) return;
    try {
      const callsRequest = await client.queryCalls({
        filter_conditions: {
          'custom.serverName': server?.name || 'Test Server',
        },
        sort: [{ field: 'created_at', direction: 1 }],
        watch: true,
      });
      if (callsRequest?.calls) {
        setCalls(callsRequest.calls);
      }
    } catch (err) {
      console.error("Failed to query calls:", err);
    }
  }, [client, server]);

  useEffect(() => {
    loadAudioChannels();
    const timer = setInterval(() => {
      loadAudioChannels();
    }, 3000);
    return () => clearInterval(timer);
  }, [loadAudioChannels]);

  return (
    <div className='w-full my-2'>
      <div className='flex text-gray-500 items-center mb-2 pr-2'>
        <button
          className='flex w-full items-center justify-start px-2'
          onClick={() => setIsOpen((currentValue) => !currentValue)}
        >
          <div
            className={`${
              isOpen ? 'rotate-90' : ''
            } transition-all ease-in-out duration-200`}
          >
            <ChevronRight />
          </div>
          <h2 className='inline-block uppercase text-sm font-bold px-2'>
            Voice Channels
          </h2>
        </button>
        <Link
          className=''
          href={`/?createChannel=true&isVoice=true&category=Voice Channels`}
        >
          <PlusIcon />
        </Link>
      </div>
      {isOpen && (
        <div className='px-2 space-y-1'>
          {calls.map((call) => (
            <CallItem key={call.id} call={call} />
          ))}
        </div>
      )}
    </div>
  );
}
