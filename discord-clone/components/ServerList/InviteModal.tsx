"use client";

import { useRef, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CloseIcon } from "@/components/Icons";
import Link from "next/link";
import { useDiscordContext } from "@/contexts/DiscordContext";
import { toast } from "react-toastify";

export default function InviteModal(): JSX.Element {
    const params = useSearchParams();
    const show = params.get('invitePeople');
    const dialogRef = useRef<HTMLDialogElement>(null);
    const router = useRouter();
    const { server } = useDiscordContext();
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (show && dialogRef.current) {
            dialogRef.current.showModal();
        } else {
            dialogRef.current?.close();
        }
    }, [show]);

    // Build an invite URL that points back to this app
    const inviteUrl = typeof window !== 'undefined'
        ? `${window.location.origin}?joinServer=${encodeURIComponent(server?.name ?? '')}`
        : '';

    const copyLink = () => {
        navigator.clipboard.writeText(inviteUrl).then(() => {
            setCopied(true);
            toast.success('Invite link copied to clipboard! 🔗');
            setTimeout(() => setCopied(false), 3000);
        }).catch(() => {
            toast.info(`Share this link: ${inviteUrl}`, { autoClose: 8000 });
        });
    };

    if (!server) return <></>;

    return (
        <dialog
            ref={dialogRef}
            className="rounded-xl shadow-2xl z-50 p-0 overflow-hidden"
            style={{ maxWidth: '520px', width: '90vw' }}
        >
            {/* Header */}
            <div className="bg-[#2b2d31] px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-xl font-bold text-white">Invite friends to {server.name}</h2>
                    <Link href="/" onClick={() => setCopied(false)}>
                        <CloseIcon className="w-6 h-6 text-gray-400 hover:text-white transition" />
                    </Link>
                </div>
                <p className="text-gray-400 text-xs">Send an invite link to a friend to give them access to this server.</p>
            </div>

            {/* Body */}
            <div className="bg-[#313338] px-6 py-5 space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block">
                    Server Invite Link
                </label>

                {/* Visible input box displaying full invitation link */}
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        readOnly
                        value={inviteUrl}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                        className="flex-1 bg-[#1e1f22] text-white px-3 py-2.5 rounded-md border border-gray-700 text-sm font-mono focus:outline-none focus:border-[#5865f2] transition"
                        title="Click to select full invite link"
                    />
                    <button
                        onClick={copyLink}
                        className={`flex-shrink-0 px-5 py-2.5 rounded-md text-sm font-bold transition-all duration-200 ${
                            copied
                                ? 'bg-green-600 text-white'
                                : 'bg-[#5865f2] hover:bg-[#4752c4] text-white'
                        }`}
                    >
                        {copied ? '✓ Copied' : 'Copy Link'}
                    </button>
                </div>

                <div className="bg-[#2b2d31]/60 p-3 rounded-lg border border-gray-700/50">
                    <div className="text-xs text-gray-400">
                        <span className="font-semibold text-gray-300">Invite Code:</span> <span className="font-mono text-indigo-400">{encodeURIComponent(server.name)}</span>
                    </div>
                </div>

                <p className="text-xs text-gray-500">
                    Your invite link never expires · Anyone with this link can view this server.
                </p>
            </div>

            {/* Footer */}
            <div className="bg-[#2b2d31] px-6 py-4 flex justify-end">
                <Link
                    href="/"
                    onClick={() => setCopied(false)}
                    className="px-5 py-2 rounded-md bg-[#5865f2] hover:bg-[#4752c4] text-white text-sm font-semibold transition"
                >
                    Done
                </Link>
            </div>
        </dialog>
    );
}
