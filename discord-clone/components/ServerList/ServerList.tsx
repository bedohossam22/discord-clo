import { DiscordServer } from "@/models/DiscrodServer";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import CreateServerForm from "./CreateServerForm";
import EditServerForm from "./EditServerForm";
import InviteModal from "./InviteModal";
import { useChatContext } from "stream-chat-react";
import { Channel } from "stream-chat";
import { useDiscordContext } from "@/contexts/DiscordContext";

export default function ServerList(): JSX.Element {
    const { client } = useChatContext();
    const { server: activeServer, changeServer, serverListVersion } = useDiscordContext();
    const [serverList, setServerList] = useState<DiscordServer[]>([]);
    const prevServerCountRef = useRef(0);

    const loadServerList = useCallback(async (): Promise<void> => {
        const channels = await client.queryChannels({
            type: 'messaging',
            members: { $in: [client.userID as string] },
        });
        const serverSet: Set<DiscordServer> = new Set(
            channels
                .map((channel: Channel) => ({
                    // @ts-expect-error: Accessing channel data properties
                    id: channel.data?.data?.id,
                    // @ts-expect-error: Channel server name may not be a string
                    name: (channel.data?.data?.server as string) ?? 'Unknown',
                    // @ts-expect-error: Channel image may not be defined
                    image: channel.data?.data?.image,
                }))
                .filter((server: DiscordServer) => server.name !== 'Unknown')
                .filter(
                    (server: DiscordServer, index: number, self: DiscordServer[]) =>
                        index === self.findIndex((s) => s.name === server.name)
                )
        );
        const serverArray = Array.from(serverSet.values());
        setServerList(serverArray);

        if (serverArray.length > 0 && prevServerCountRef.current === 0) {
            changeServer(serverArray[0], client);
        }
        prevServerCountRef.current = serverArray.length;
    }, [client, changeServer]);

    useEffect(() => {
        loadServerList();
        // Poll for new servers every 10 seconds as a fallback
        const interval = setInterval(() => {
            loadServerList();
        }, 10000);
        return () => clearInterval(interval);
    }, [loadServerList]);

    // React immediately when a new server is created (serverListVersion bumps)
    useEffect(() => {
        if (serverListVersion > 0) {
            loadServerList();
        }
    }, [serverListVersion, loadServerList]);

    function checkIfUrl(path: string): boolean {
        try {
            new URL(path);
            return true;
        } catch {
            return false;
        }
    }

    return (
        <div className="bg-dark-gray h-full flex flex-col items-center w-20 flex-shrink-0">
            {/* DMs button */}
            <button
                className={`block p-3 aspect-square sidebar-icon border-b-2 border-b-gray-300 ${activeServer === undefined ? 'selected-icon' : ''}`}
                onClick={() => changeServer(undefined, client)}
            >
                <div className="rounded-icon discord-icon" />
            </button>

            {/* Server list */}
            <div className="flex flex-col items-center w-full overflow-y-auto flex-1">
                {serverList.map((server, index) => (
                    <button
                        key={server.id || `server-${index}`}
                        className={`p-4 sidebar-icon ${server.id === activeServer?.id ? 'selected-icon' : ''}`}
                        onClick={() => changeServer(server, client)}
                        title={server.name}
                    >
                        {server.image && checkIfUrl(server.image) ? (
                            <Image
                                className="rounded-icon"
                                src={server.image}
                                width={50}
                                height={50}
                                alt={server.name}
                            />
                        ) : (
                            <span className="rounded-icon bg-gray-600 w-[50px] h-[50px] flex items-center justify-center text-sm text-white font-semibold">
                                {server.name.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Create Server button */}
            <Link
                href="/?createServer=true"
                className="flex items-center justify-center rounded-icon bg-white p-2 my-2 text-2xl font-light h-12 w-12 text-green-500 hover:bg-green-500 hover:text-white hover:rounded-xl transition-all duration-200"
                title="Create Server"
            >
                <span className="inline-block leading-none">+</span>
            </Link>

            <CreateServerForm />
            <EditServerForm />
            <InviteModal />
        </div>
    );
}