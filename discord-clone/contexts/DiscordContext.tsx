'use client'
import { createContext , useCallback, useContext , useState } from "react"
import { StreamChat , Channel , ChannelFilters } from "stream-chat"; 
import { v4 as uuid } from 'uuid';
import { DiscordServer } from "@/models/DiscrodServer";
import { DefaultStreamChatGenerics } from "stream-chat-react";
import { MemberRequest, StreamVideoClient } from "@stream-io/video-react-sdk";
import { toast } from "react-toastify";


type DiscordState = {
    server?: DiscordServer;
    callId: string| undefined;
    serverListVersion: number; // bumped after createServer / leaveServer / deleteServer so ServerList reacts instantly
    channelsByCategories: Map<string, Array<Channel<DefaultStreamChatGenerics>>>
    changeServer: (server: DiscordServer | undefined, client: StreamChat) => void;
    createServer: (
        client: StreamChat,
        videoClient: StreamVideoClient,
        name: string,
        imageUrl: string,
        userIds: string[]
    ) => void;
    createChannel: (
        client: StreamChat,
        name: string,
        category: string,
        userIds: string[]
    ) => void;
    createCall: (
        client: StreamVideoClient,
        server: DiscordServer ,
        channelName: string ,
        userIds: string[]
    ) => Promise<void>;
    leaveServer: (client: StreamChat) => Promise<void>;
    deleteServer: (client: StreamChat) => Promise<void>;
    setCall: (callId: string | undefined) => void;
};
const initialValue: DiscordState = {
    server: undefined,
    callId: undefined,
    serverListVersion: 0,
    channelsByCategories: new Map(),
    changeServer: () => {},
    createServer: () => {},
    createChannel: () => {},
    createCall: async () => {},
    leaveServer: async () => {},
    deleteServer: async () => {},
    setCall: () => {},
};

const DiscordContext = createContext<DiscordState>(initialValue);
export const DiscordContextProvider: any = ({
    children,
}: { 
    children: React.ReactNode;
}) => {
    const [myState , setMyState] = useState<DiscordState>(initialValue);

    const changeServer = useCallback(
        async (server: DiscordServer | undefined, client: StreamChat) => {
            let filters: ChannelFilters = {
                type: 'messaging',
                members: {$in: [client.userID as string]}
            };
            if (!server){
                filters.member_count = 2;
            }
            const channels = await client.queryChannels(filters, {}, { limit: 300 });
            const channelsByCategories = new Map<
            string,
            Array<Channel<DefaultStreamChatGenerics>>
            >();
            if (server){
                const getChannelServer = (ch: Channel) => {
                    const d = (ch.data as Record<string, any>)?.data || (ch.data as Record<string, any>);
                    return { name: d?.server, id: d?.serverId };
                };
                const categories = new Set(
                    channels
                        .filter((channel) => {
                            const info = getChannelServer(channel);
                            return info.name === server.name || (server.id && info.id === server.id);
                        })
                        .map((channel) => {
                            const d = (channel.data as Record<string, any>)?.data || (channel.data as Record<string, any>);
                            return d?.category;
                        })
                        .filter(Boolean)
                );
                for (const category of Array.from(categories)){
                    channelsByCategories.set(
                        category as string,
                        channels.filter((channel) => {
                            const info = getChannelServer(channel);
                            const d = (channel.data as Record<string, any>)?.data || (channel.data as Record<string, any>);
                            return (info.name === server.name || (server.id && info.id === server.id)) && d?.category === category;
                        })
                    );
                }
            } else {
                channelsByCategories.set('Direct Messages' , channels);
            }
            setMyState((myState) => {
                return {...myState, server , channelsByCategories};
            });
        },
        [setMyState]
    );
    const createCall = useCallback(
        async (
        client: StreamVideoClient,
        server: DiscordServer,
        channelName: string,
        userIds: string[]
        ) => {
            const callId = uuid();
            const audioCall = client.call('default' , callId);
            const audioChannelMembers: MemberRequest[]= userIds.map((userId) => {
                return {
                    user_id: userId,
                }
            });
            try {
                const createdAudioCall = await audioCall.create({
                    data: {
                        custom: {
                            serverId: server?.id,
                            serverName: server?.name,
                            callName: channelName,
                        },
                        members: audioChannelMembers,
                    }
                });
                console.log(
                    `[DiscordContext] Created Call with id: ${createdAudioCall.call.id}`
                );
            } catch (err: unknown){
                console.error('[DiscordContext] Failed to create call:', err);
                throw err;
            }
        } ,
        []
    );
    const createServer = useCallback(
       async (
        client: StreamChat,
        videoClient: StreamVideoClient,
        name: string,
        imageUrl: string,
        userIds: string[]
       ) => {
        const serverId = uuid();
        const messagingChannel = client.channel('messaging' , uuid() ,  {
            name: 'Welcome',
            members: userIds,
            data: {
                image: imageUrl,
                serverId: serverId,
                server: name,
                category: 'Text Channels',
            }
        });
        try {
            const response = await messagingChannel.create();
            console.log('[DiscordContext - createServer] Response: ', response);
            const server: DiscordServer = {
                id: serverId , 
                name: name,
                image: imageUrl
            }
          
            await createCall(
                videoClient ,
                server,
                'General Voice Channel',
                userIds
            );
            await changeServer(server, client);
            // Bump version so ServerList reloads immediately without a refresh
            setMyState((s) => ({ ...s, serverListVersion: s.serverListVersion + 1 }));
            toast.success(`Server "${name}" created successfully!`);
        } catch(err: unknown) {
            console.error(err);
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            toast.error(`Failed to create server: ${errorMsg}`);
        }
       } , [createCall, changeServer]
       ); 
    const createChannel = useCallback(
        async (
            client: StreamChat,
            name: string,
            category: string,
            userIds: string[]
        ) => {
            if(client.userID){
                const channel = client.channel('messaging' , {
                    name: name,
                    members: userIds,
                    data:{
                        image: myState.server?.image,
                        serverId: myState.server?.id,
                        server: myState.server?.name,
                        category: category,
                    },
                });
                try {
                    await channel.create();
                    await changeServer(myState.server, client);
                } catch (err: unknown) {
                    console.error('[DiscordContext] createChannel error:', err);
                    throw err;
                }
            }
        } , 
        [myState.server, changeServer]
    );
        const setCall = useCallback(
            (callId: string | undefined) => {
                setMyState((myState) => {
                    return {...myState , callId}
                })
            },
            [setMyState]
        );

    const leaveServer = useCallback(
        async (client: StreamChat) => {
            if (!myState.server || !client.userID) return;
            const targetServer = myState.server;
            const serverName = targetServer.name;
            try {
                // First switch active server to DMs so the UI unmounts channel
                await changeServer(undefined, client);

                const channels = await client.queryChannels(
                    { type: 'messaging', members: { $in: [client.userID] } },
                    {},
                    { limit: 300 }
                );
                const serverChannels = channels.filter((c) => {
                    const d = (c.data as Record<string, any>)?.data || (c.data as Record<string, any>);
                    return d?.server === serverName || (targetServer.id && d?.serverId === targetServer.id);
                });
                for (const ch of serverChannels) {
                    try {
                        await ch.removeMembers([client.userID]);
                    } catch (e) {
                        console.warn(`[leaveServer] Failed to remove member from channel ${ch.cid}`, e);
                    }
                }
                setMyState((s) => ({
                    ...s,
                    server: s.server?.name === serverName ? undefined : s.server,
                    serverListVersion: s.serverListVersion + 1,
                }));
                toast.info(`You left "${serverName}"`);
            } catch (err: unknown) {
                console.error("Failed to leave server", err);
                toast.error("Failed to leave server");
            }
        },
        [myState.server, changeServer]
    );

    const deleteServer = useCallback(
        async (client: StreamChat) => {
            if (!myState.server || !client.userID) return;
            const targetServer = myState.server;
            const serverName = targetServer.name;

            // CRITICAL REQUIREMENT: Main server 'BB' CANNOT be deleted by anyone!
            if (serverName.trim().toLowerCase() === 'bb') {
                toast.error("The main server 'BB' cannot be deleted!");
                return;
            }

            try {
                // 1. Unmount channel in UI first before deletion to avoid Stream runtime errors
                await changeServer(undefined, client);

                // 2. Call admin API route to delete all server channels with full admin privileges
                const res = await fetch('/api/delete-server', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ serverName: targetServer.name, serverId: targetServer.id }),
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || 'Server-side deletion failed');
                }

                // 3. Client-side fallback cleanup
                const channels = await client.queryChannels(
                    { type: 'messaging', members: { $in: [client.userID] } },
                    {},
                    { limit: 300 }
                );
                const serverChannels = channels.filter((c) => {
                    const d = (c.data as Record<string, any>)?.data || (c.data as Record<string, any>);
                    return (
                        (typeof d?.server === 'string' && d.server.trim().toLowerCase() === serverName.trim().toLowerCase()) ||
                        (targetServer.id && d?.serverId === targetServer.id)
                    );
                });
                for (const ch of serverChannels) {
                    try {
                        await ch.delete();
                    } catch (e) {
                        console.warn(`[deleteServer] Failed deleting channel ${ch.cid}`, e);
                    }
                }

                // 4. Reset server in state & bump serverListVersion for instant reaction
                setMyState((s) => ({
                    ...s,
                    server: s.server?.name === serverName ? undefined : s.server,
                    serverListVersion: s.serverListVersion + 1,
                }));
                toast.success(`Server "${serverName}" has been deleted.`);
            } catch (err: unknown) {
                console.error("Failed to delete server", err);
                const msg = err instanceof Error ? err.message : "Failed to delete server";
                toast.error(msg);
            }
        },
        [myState.server, changeServer]
    );

    const store: DiscordState = {
        server: myState.server,
        callId: myState.callId ,
        serverListVersion: myState.serverListVersion,
        channelsByCategories: myState.channelsByCategories,
        changeServer : changeServer,
        createServer: createServer,
        createChannel: createChannel,
        createCall: createCall,
        leaveServer: leaveServer,
        deleteServer: deleteServer,
        setCall: setCall
    };

    return (
        <DiscordContext.Provider value={store}>{children}</DiscordContext.Provider>
    );
};

export const useDiscordContext = () => useContext(DiscordContext) 