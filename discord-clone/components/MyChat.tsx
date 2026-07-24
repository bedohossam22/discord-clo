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
    const {callId} = useDiscordContext();
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
