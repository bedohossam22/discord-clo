"use client";

import { useDiscordContext } from "@/contexts/DiscordContext";
import ChannelListTopBar from "./TopBar/ChannelListTopBar";
import CategoryItem from "./CategoryItem";
import ChannelListBottomBar from "./BottomBar/ChannelListBottomBar";
import CreateChannelForm from "./CreateChannelForm/CreateChannelForm";
import CallList from "./CallList/CallList";
import { useChatContext } from "stream-chat-react";
import { useEffect } from "react";

export default function CustomChannelList(): JSX.Element {
  const { server, channelsByCategories } = useDiscordContext();
  const { channel: activeChannel, setActiveChannel } = useChatContext();

  useEffect(() => {
    if (!activeChannel && channelsByCategories.size > 0) {
      for (const [, channels] of Array.from(channelsByCategories.entries())) {
        if (channels && channels.length > 0) {
          setActiveChannel(channels[0]);
          break;
        }
      }
    }
  }, [channelsByCategories, activeChannel, setActiveChannel]);

  return (
    <div className="w-full bg-medium-gray h-full flex flex-col items-start justify-between flex-shrink-0 select-none overflow-hidden">
      <div className="w-full overflow-y-auto flex-1">
        <ChannelListTopBar serverName={server?.name || 'Direct Messages'} />
        <div className="w-full">
          {Array.from(channelsByCategories.keys()).map((category, index) => (
            <CategoryItem
              key={`${category}-${index}`}
              category={category}
              serverName={server?.name || 'Direct messages'}
              channels={channelsByCategories.get(category) || []}
            />
          ))}
        </div>
        <CallList />
        <CreateChannelForm />
      </div>
      <ChannelListBottomBar />
    </div>
  );
}