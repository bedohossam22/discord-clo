import { useDiscordContext } from '@/contexts/DiscordContext';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { useCallback, useEffect, useState } from 'react';
import { ChevronRight, PlusIcon, Speaker, DiscordIcon } from '../../Icons';
import Link from 'next/link';

export default function CallList(): JSX.Element {
  const { server, callId, setCall } = useDiscordContext();
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
          {calls.map((call) => {
            const isJoined = call.id === callId;
            return (
              <div key={call.id} className="w-full">
                <button
                  className={`w-full flex items-center px-2 py-1.5 hover:bg-gray-200 rounded-md transition ${
                    isJoined ? 'bg-gray-200/80 font-bold text-gray-900' : 'text-gray-600'
                  }`}
                  onClick={() => {
                    setCall(call.id);
                  }}
                >
                  <Speaker className={`w-5 h-5 mr-2 ${isJoined ? 'text-green-600' : 'text-gray-500'}`} />
                  <span className="text-sm truncate">
                    {call.state.custom.callName || 'Channel Preview'}
                  </span>
                </button>

                {/* Connected User Avatar / Icon Indicator beneath channel */}
                {isJoined && (
                  <div className="ml-6 my-1 p-2 bg-green-50 border border-green-200 rounded-md flex items-center justify-between animate-fade-in shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <div className="w-6 h-6 rounded-full bg-[#5865f2] flex items-center justify-center text-white">
                          <DiscordIcon className="w-4 h-4" />
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                      </div>
                      <span className="text-xs font-semibold text-gray-800">You (Connected)</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCall(undefined);
                      }}
                      className="text-[10px] text-red-500 hover:text-red-700 font-bold hover:underline"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}