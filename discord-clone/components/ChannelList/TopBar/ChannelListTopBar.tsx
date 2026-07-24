"use client";

import { useState } from "react";
import { ChevronDown, CloseIcon } from "@/components/Icons";
import { menuItems } from "./menuItems";
import ChannelListMenuRow from "./ChannelListMenuRow";
import { useDiscordContext } from "@/contexts/DiscordContext";
import { useChatContext } from "stream-chat-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function ChannelListTopBar({
  serverName,
}: {
  serverName: string;
}): JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);
  const { leaveServer, deleteServer } = useDiscordContext();
  const { client } = useChatContext();
  const router = useRouter();

  const isMainServer = serverName?.trim().toLowerCase() === 'bb';

  // Filter out Delete Server if inside main server 'BB'
  const visibleMenuItems = menuItems.filter((option) => {
    if (option.name === 'Delete Server' && isMainServer) {
      return false; // NEVER display Delete Server option for main server 'BB'
    }
    return true;
  });

  const handleOptionClick = (optionName: string) => {
    setMenuOpen(false);
    if (optionName === 'Leave Server') {
      leaveServer(client);
    } else if (optionName === 'Delete Server') {
      if (isMainServer) {
        toast.error("Main server 'BB' cannot be deleted!");
        return;
      }
      if (confirm(`Are you sure you want to delete "${serverName}"?`)) {
        deleteServer(client);
      }
    } else if (optionName === 'Invite People') {
      router.push('/?invitePeople=true');
    } else if (optionName === 'Create Channel') {
      router.push('/?createChannel=true');
    } else if (optionName === 'Edit Server Profile' || optionName === 'Server Settings') {
      router.push('/?editServer=true');
    }
  };

  return (
    <div className="w-full relative">
      <button
        className={`flex w-full items-center justify-between p-4 border-b-2 ${
          menuOpen ? 'bg-gray-300' : ''
        } border-gray-300 hover:bg-gray-300 transition`}
        onClick={() => setMenuOpen((currentValue) => !currentValue)}
      >
        <h2 className="text-lg font-bold text-gray-700 truncate mr-2">
          {serverName}
        </h2>
        {menuOpen ? <CloseIcon className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      {menuOpen && (
        <div className="absolute w-full p-2 z-20">
          <div className="w-full bg-white p-2 shadow-xl rounded-md border border-gray-200">
            {visibleMenuItems.map((option) => (
              <button
                key={option.name}
                className="w-full text-left"
                onClick={() => handleOptionClick(option.name)}
              >
                <ChannelListMenuRow {...option} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}