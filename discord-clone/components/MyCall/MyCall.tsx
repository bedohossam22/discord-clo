import {
  Call,
  StreamCall,
  useStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { useEffect, useRef, useState } from 'react';
import CallLayout from './CallLayout';

export default function MyCall({ callId }: { callId: string }): JSX.Element {
  const [call, setCall] = useState<Call | undefined>(undefined);
  const client = useStreamVideoClient();
  const activeCallRef = useRef<Call | undefined>(undefined);

  useEffect(() => {
    if (!client || !callId) return;

    let isSubscribed = true;

    const joinNewCall = async () => {
      // 1. If currently in a different call, leave it first on Stream SFU
      if (activeCallRef.current && activeCallRef.current.id !== callId) {
        try {
          await activeCallRef.current.leave();
        } catch (err) {
          console.error('[MyCall] Error leaving previous call:', err);
        }
        activeCallRef.current = undefined;
        if (isSubscribed) setCall(undefined);
      }

      // 2. Create and join the new voice call
      try {
        const newCall = client.call('default', callId);
        await newCall.camera.disable();
        await newCall.join({ create: true });

        if (isSubscribed) {
          activeCallRef.current = newCall;
          setCall(newCall);
        } else {
          // If unmounted while joining, ensure we leave
          await newCall.leave();
        }
      } catch (err) {
        console.error('[MyCall] Error joining new call:', err);
      }
    };

    joinNewCall();

    return () => {
      isSubscribed = false;
      if (activeCallRef.current) {
        const callToLeave = activeCallRef.current;
        activeCallRef.current = undefined;
        callToLeave.leave().catch((err) => {
          console.error('[MyCall] Error in call leave cleanup:', err);
        });
      }
    };
  }, [client, callId]);

  if (!call || call.id !== callId) {
    return (
      <div className='w-full h-full text-xl font-semibold flex items-center justify-center bg-[#313338] text-white animate-pulse'>
        Connecting to voice channel...
      </div>
    );
  }

  return (
    <StreamCall call={call}>
      <CallLayout />
    </StreamCall>
  );
}