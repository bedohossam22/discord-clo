import { useClient } from "@/hooks/useClient";
import {User} from 'stream-chat'
import {Chat , Channel ,ChannelList , MessageList , MessageInput , Thread , Window,} from 'stream-chat-react'
import 'stream-chat-react/dist/css/v2/index.css';
import ServerList from "./ServerList/ServerList";
import CustomChannelList from "./ChannelList/CustomChannelList";
import CustomeDateSeparator from "./MessageList/CustomeDateSeparator/CustomDateSeparator";
import CustomChannelHeader from "./MessageList/CustomeChannelHeader/CustomChannelHeader";
import CustomMessage from "./MessageList/CustomeMessage/CustomMessage";
import { customReactionOptions } from "./MessageList/CustomeMessage/CustomeMessageReactions";
import MessageComposer from "./MessageList/MessageComposer/MessageComposer";
import { useVideoClient } from "@/hooks/useVideoClient";
import { StreamVideo } from "@stream-io/video-react-sdk";
import { useDiscordContext } from "@/contexts/DiscordContext";
import MyCall from "./MyCall/MyCall";
import LoadingScreen from "./LoadingScreen";
import UsersSidebar from "./UsersSidebar/UsersSidebar";
import { useEffect, useRef } from "react";

export default function MyChat({
    apiKey,
    user ,
    token,
} : {
    apiKey: string;
    user: User;
    token: string;
}){
    const chatClient = useClient({
        apiKey,
        user,
        tokenOrProvider: token,
    });
    const videoClient = useVideoClient({
        apiKey,
        user,
        tokenOrProvider: token,
    });
    const { callId, setCall, server, changeServer } = useDiscordContext();
    const handledInvite = useRef(false);

    // Handle voice invite links: /?callId=xxx&serverId=yyy
    // When someone clicks an invite link, auto-switch to the right server and join the call
    useEffect(() => {
        if (handledInvite.current) return;
        if (!chatClient || !videoClient) return;

        const params = new URLSearchParams(window.location.search);
        const inviteCallId = params.get('callId');
        const inviteServerId = params.get('serverId');

        if (!inviteCallId) return;
        handledInvite.current = true;

        // Clear the URL params without a page reload
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);

        const joinFromInvite = async () => {
            try {
                // If a serverId was provided and we're not already on that server, switch to it
                if (inviteServerId && server?.id !== inviteServerId) {
                    // Query all channels to find the target server's info
                    const channels = await chatClient.queryChannels(
                        { type: 'messaging', members: { $in: [chatClient.userID as string] } },
                        {},
                        { limit: 300 }
                    );
                    const targetChannel = channels.find((ch) => {
                        const d = (ch.data as Record<string, any>)?.data || (ch.data as Record<string, any>);
                        return d?.serverId === inviteServerId;
                    });
                    if (targetChannel) {
                        const d = (targetChannel.data as Record<string, any>)?.data || (targetChannel.data as Record<string, any>);
                        await changeServer(
                            { id: d.serverId, name: d.server, image: d.image ?? '' },
                            chatClient
                        );
                    }
                }
                // Join the voice call
                setCall(inviteCallId);
            } catch (err) {
                console.error('[MyChat] Failed to auto-join from invite link:', err);
            }
        };

        joinFromInvite();
    }, [chatClient, videoClient, server, changeServer, setCall]);

    if (!chatClient) {
        return <LoadingScreen message="Connecting to Chat..." submessage="Establishing secure connection with Stream Chat" />;
    }
    if (!videoClient) {
        return <LoadingScreen message="Connecting to Voice & Video..." submessage="Initializing Stream Video services" />;
    }

    return (
        <StreamVideo client={videoClient}>
        <Chat client={chatClient} theme="str-chat__theme-light">
            {/* Outer wrapper: full screen, no scroll */}
            <div className="flex h-screen w-screen overflow-hidden">
                {/* Left: Server icon rail */}
                <ServerList/>

                {/* Center: Channel list sidebar — fixed width */}
                <div className="w-72 flex-shrink-0 h-full overflow-hidden">
                    <ChannelList List={CustomChannelList}/>
                </div>

                {/* Right: main content area — fills remaining space */}
                <div className="flex flex-1 h-full overflow-hidden min-w-0">
                    {/* Voice Call View */}
                    {callId && (
                        <div className="flex flex-1 h-full overflow-hidden min-w-0">
                            <div className="flex-1 h-full overflow-hidden min-w-0">
                                <MyCall callId={callId} />
                            </div>
                            <UsersSidebar />
                        </div>
                    )}

                    {/* Text Chat View */}
                    {!callId && (
                        <Channel
                            DateSeparator={CustomeDateSeparator}
                            HeaderComponent={CustomChannelHeader}
                            Message={CustomMessage}
                            reactionOptions={customReactionOptions}
                            Input={MessageComposer}
                        >
                            {/* Chat fills all available width */}
                            <div className="flex flex-1 h-full overflow-hidden min-w-0">
                                <Window>
                                    <MessageList />
                                    <MessageInput />
                                </Window>
                                <Thread/>
                            </div>
                            {/* Member list — fixed right sidebar */}
                            <UsersSidebar />
                        </Channel>
                    )}
                </div>
            </div>
        </Chat>
        </StreamVideo>
    );
}
