"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useChatContext } from "stream-chat-react";
import Image from "next/image";
import { PersonIcon } from "../Icons";

type MemberUser = {
  id: string;
  name: string;
  image?: string;
  online: boolean;
  lastActive?: string;
};

export default function UsersSidebar(): JSX.Element {
  const { client } = useChatContext();
  const [onlineUsers, setOnlineUsers] = useState<MemberUser[]>([]);
  const [offlineUsers, setOfflineUsers] = useState<MemberUser[]>([]);

  const fetchUsers = useCallback(async () => {
    if (!client) return;
    try {
      const response = await client.queryUsers(
        {},
        { last_active: -1 },
        { limit: 30 }
      );

      const mapped: MemberUser[] = response.users
        .filter((u) => u.role !== 'admin')
        .map((u) => ({
          id: u.id,
          name: u.name || u.id,
          image: u.image as string | undefined,
          online: u.online ?? false,
          lastActive: u.last_active,
        }));

      setOnlineUsers(mapped.filter((u) => u.online));
      setOfflineUsers(mapped.filter((u) => !u.online));
    } catch (err) {
      console.error("Failed to query members for sidebar:", err);
    }
  }, [client]);

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(() => {
      fetchUsers();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchUsers]);

  return (
    <aside className="w-56 flex-shrink-0 bg-[#2b2d31] border-l border-gray-800/40 flex flex-col h-full select-none overflow-y-auto text-gray-300">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 sticky top-0 bg-[#2b2d31] z-10">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Members — {onlineUsers.length + offlineUsers.length}
        </h3>
      </div>

      <div className="px-3 pb-4 flex-1">
        {/* Online Users */}
        {onlineUsers.length > 0 && (
          <div className="mb-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
              Online — {onlineUsers.length}
            </div>
            <div className="space-y-0.5">
              {onlineUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-2 px-2 py-1.5 rounded-md hover:bg-[#35373c] transition cursor-pointer group"
                >
                  <div className="relative flex-shrink-0">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-xs font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#2b2d31] rounded-full"></span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-200 truncate group-hover:text-white">
                      {user.name}
                    </div>
                    {user.id === client.userID && (
                      <span className="text-[10px] text-gray-400 leading-none">You</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Offline Users */}
        {offlineUsers.length > 0 && (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
              Offline — {offlineUsers.length}
            </div>
            <div className="space-y-0.5">
              {offlineUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-2 px-2 py-1.5 rounded-md hover:bg-[#35373c] transition cursor-pointer opacity-60 hover:opacity-100 group"
                >
                  <div className="relative flex-shrink-0">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover grayscale"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-gray-500 border-2 border-[#2b2d31] rounded-full"></span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-400 truncate group-hover:text-gray-200">
                      {user.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {onlineUsers.length === 0 && offlineUsers.length === 0 && (
          <div className="text-xs text-gray-500 italic mt-4 px-1">
            No members found
          </div>
        )}
      </div>
    </aside>
  );
}
