"use client";

import Link from "next/link";
import { CloseIcon } from "../Icons";
import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useChatContext } from "stream-chat-react";
import { useDiscordContext } from "@/contexts/DiscordContext";
import { toast } from "react-toastify";

export default function EditServerForm(): JSX.Element {
    const params = useSearchParams();
    const showForm = params.get('editServer');
    const dialogRef = useRef<HTMLDialogElement>(null);
    const router = useRouter();

    const { client } = useChatContext();
    const { server, changeServer, deleteServer } = useDiscordContext();

    const [serverName, setServerName] = useState('');
    const [serverImage, setServerImage] = useState('');
    const [saving, setSaving] = useState(false);

    const isMainServer = server?.name?.trim().toLowerCase() === 'bb';

    // Populate form when modal opens
    useEffect(() => {
        if (showForm && dialogRef.current) {
            setServerName(server?.name || '');
            setServerImage(server?.image || '');
            dialogRef.current.showModal();
        } else {
            dialogRef.current?.close();
        }
    }, [showForm, server]);

    const handleSave = useCallback(async () => {
        if (!server || !client.userID) return;

        // Block editing if main server BB
        if (isMainServer) {
            toast.error("You cannot edit the main server 'BB'!");
            return;
        }

        if (!serverName.trim()) {
            toast.error('Server name cannot be empty');
            return;
        }
        setSaving(true);
        try {
            // Query all channels belonging to this server
            const channels = await client.queryChannels({
                type: 'messaging',
                members: { $in: [client.userID] },
            });
            const serverChannels = channels.filter(
                // @ts-ignore
                (c) => c.data?.data?.server === server.name
            );

            // Update each channel's data with the new name/image
            for (const ch of serverChannels) {
                await ch.update({
                    // @ts-ignore
                    data: {
                        // @ts-ignore
                        ...ch.data?.data,
                        server: serverName.trim(),
                        image: serverImage.trim(),
                    },
                });
            }

            // Refresh the server list view with new details
            await changeServer(
                { id: server.id, name: serverName.trim(), image: serverImage.trim() },
                client
            );

            toast.success(`Server updated to "${serverName.trim()}"!`);
            router.replace('/');
        } catch (err) {
            console.error('[EditServerForm] Save failed:', err);
            toast.error('Failed to update server. Please try again.');
        } finally {
            setSaving(false);
        }
    }, [server, client, serverName, serverImage, changeServer, router, isMainServer]);

    const handleDelete = async () => {
        if (isMainServer) {
            toast.error("The main server 'BB' cannot be deleted!");
            return;
        }
        if (confirm(`Are you sure you want to delete "${server?.name}"?`)) {
            await deleteServer(client);
            router.replace('/');
        }
    };

    if (!server) return <></>;

    return (
        <dialog className="absolute z-50 space-y-2 rounded-xl shadow-2xl" ref={dialogRef}>
            <div className="w-full flex items-center justify-between py-8 px-6">
                <h2 className="text-3xl font-semibold text-gray-600">
                    Edit Server {isMainServer && <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded ml-2 font-normal">View Only</span>}
                </h2>
                <Link href="/">
                    <CloseIcon className="w-10 h-10 text-gray-400" />
                </Link>
            </div>

            <div className="flex flex-col space-y-4 px-6 pb-4">
                {isMainServer && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md text-xs font-semibold">
                        🔒 Notice: The main server &quot;BB&quot; settings are protected and cannot be modified.
                    </div>
                )}

                <div>
                    <label className="labelTitle block mb-1" htmlFor="editServerName">
                        Server Name
                    </label>
                    <div className="flex items-center bg-gray-100 rounded">
                        <span className="text-2xl p-2 text-gray-500">#</span>
                        <input
                            type="text"
                            id="editServerName"
                            value={serverName}
                            onChange={(e) => setServerName(e.target.value)}
                            placeholder={server.name}
                            readOnly={isMainServer}
                            className={isMainServer ? "cursor-not-allowed opacity-75" : ""}
                        />
                    </div>
                </div>

                <div>
                    <label className="labelTitle block mb-1" htmlFor="editServerImage">
                        Server Image URL
                    </label>
                    <div className="flex items-center bg-gray-100 rounded">
                        <span className="text-2xl p-2 text-gray-500">🖼</span>
                        <input
                            type="text"
                            id="editServerImage"
                            value={serverImage}
                            onChange={(e) => setServerImage(e.target.value)}
                            placeholder="https://..."
                            readOnly={isMainServer}
                            className={isMainServer ? "cursor-not-allowed opacity-75" : ""}
                        />
                    </div>
                </div>

                {/* Live preview */}
                {serverImage && (
                    <div className="flex items-center space-x-3 mt-2">
                        <span className="text-xs text-gray-400">Preview:</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={serverImage}
                            alt="Server preview"
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-300"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                        <span className="font-semibold text-gray-700">{serverName || server.name}</span>
                    </div>
                )}
            </div>

            <div className="flex space-x-4 items-center justify-between p-6 bg-gray-200">
                {!isMainServer ? (
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded uppercase text-sm"
                    >
                        Delete Server
                    </button>
                ) : (
                    <span className="text-xs text-gray-500 italic font-semibold">
                        🔒 Main Server (Cannot be deleted or edited)
                    </span>
                )}

                <div className="flex space-x-4 items-center">
                    <Link href="/" className="font-semibold text-gray-500">
                        Cancel
                    </Link>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`bg-discord rounded py-2 px-4 text-white font-bold uppercase ${
                            saving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-600'
                        }`}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </dialog>
    );
}
