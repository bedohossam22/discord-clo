"use client";

import { UserObject } from "@/models/UserObject";
import Link from "next/link";
import { CloseIcon, Speaker, HashIcon } from "@/components/Icons";
import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useChatContext } from "stream-chat-react";
import UserRow from "@/components/UsersRow";
import { useDiscordContext } from "@/contexts/DiscordContext";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { toast } from "react-toastify";

type FormState = {
  channelType: 'text' | 'voice';
  channelName: string;
  category: string;
  users: UserObject[];
};

export default function CreateChannelForm(): JSX.Element {
  const params = useSearchParams();
  const showCreateChannelForm = params.get('createChannel');
  const category = params.get('category');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  
  const { client } = useChatContext();
  const videoClient = useStreamVideoClient();
  const { server, createChannel, createCall } = useDiscordContext();

  const initialState: FormState = {
    channelType: 'text',
    channelName: '',
    category: category ?? '',
    users: [],
  };

  const [formData, setFormData] = useState<FormState>(initialState);
  const [users, setUsers] = useState<UserObject[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const response = await client.queryUsers({});
      const fetchedUsers: UserObject[] = response.users
        .filter((user) => user.role !== 'admin' && user.id !== client.userID)
        .map((user) => ({
          id: user.id,
          name: user.name ?? user.id,
          image: user.image as string,
          online: user.online,
          lastOnline: user.last_active,
        }));
      setUsers(fetchedUsers);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  }, [client]);

  useEffect(() => {
    if (client) {
      loadUsers();
    }
  }, [loadUsers, client]);

  useEffect(() => {
    const cat = params.get('category');
    const isVoice = params.get('isVoice');
    setFormData({
      channelType: isVoice === 'true' ? 'voice' : 'text',
      channelName: '',
      category: cat ?? (isVoice === 'true' ? 'Voice Channels' : 'Text Channels'),
      users: [],
    });
  }, [params]);

  useEffect(() => {
    if (showCreateChannelForm && dialogRef.current) {
      dialogRef.current.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [showCreateChannelForm]);

  function buttonDisabled(): boolean {
    return !formData.channelName.trim() || isSubmitting;
  }

  function userChanged(user: UserObject, checked: boolean) {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        users: [...prev.users, user],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        users: prev.users.filter((u) => u.id !== user.id),
      }));
    }
  }

  async function createClicked(e: React.MouseEvent) {
    e.preventDefault();
    if (buttonDisabled()) return;

    setIsSubmitting(true);
    const userIds = [
      ...(client.userID ? [client.userID] : []),
      ...formData.users.map((u) => u.id),
    ];

    try {
      if (formData.channelType === 'voice') {
        if (!videoClient) {
          toast.error("Voice client not connected yet. Please wait a moment.");
          setIsSubmitting(false);
          return;
        }

        const activeServer = server || {
          id: 'default-server',
          name: 'Test Server',
          image: '',
        };

        await createCall(
          videoClient,
          activeServer,
          formData.channelName.trim(),
          userIds
        );
        toast.success(`Voice Channel "${formData.channelName}" created!`);
      } else {
        await createChannel(
          client,
          formData.channelName.trim(),
          formData.category.trim() || 'Text Channels',
          userIds
        );
        toast.success(`Text Channel "#${formData.channelName}" created!`);
      }

      setFormData(initialState);
      dialogRef.current?.close();
      router.replace('/');
    } catch (err: unknown) {
      console.error("Error creating channel:", err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed to create channel: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <dialog
      className="backdrop:bg-black/60 rounded-2xl p-0 w-full max-w-md bg-[#313338] text-gray-100 shadow-2xl border border-gray-700/60 overflow-hidden"
      ref={dialogRef}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-[#2b2d31] border-b border-gray-700/50">
        <div>
          <h2 className="text-xl font-bold text-white">Create Channel</h2>
          <p className="text-xs text-gray-400 mt-1">in {formData.category || 'Server'}</p>
        </div>
        <Link href="/" className="p-1 hover:bg-gray-700/50 rounded-full transition">
          <CloseIcon className="w-6 h-6 text-gray-400 hover:text-white" />
        </Link>
      </div>

      <form className="p-6 space-y-5">
        {/* Channel Type Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
            Channel Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, channelType: 'text' })}
              className={`flex items-center p-3 rounded-lg border transition text-left ${
                formData.channelType === 'text'
                  ? 'bg-[#5865f2]/20 border-[#5865f2] text-white font-semibold'
                  : 'bg-[#2b2d31] border-gray-700 text-gray-400 hover:bg-[#35373c]'
              }`}
            >
              <HashIcon className="w-5 h-5 mr-2 text-gray-300" />
              <div>
                <div className="text-sm">Text</div>
                <div className="text-[10px] text-gray-400">Post images, stickers, opinions</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, channelType: 'voice' })}
              className={`flex items-center p-3 rounded-lg border transition text-left ${
                formData.channelType === 'voice'
                  ? 'bg-[#5865f2]/20 border-[#5865f2] text-white font-semibold'
                  : 'bg-[#2b2d31] border-gray-700 text-gray-400 hover:bg-[#35373c]'
              }`}
            >
              <Speaker className="w-5 h-5 mr-2 text-gray-300" />
              <div>
                <div className="text-sm">Voice</div>
                <div className="text-[10px] text-gray-400">Hang out together with voice & video</div>
              </div>
            </button>
          </div>
        </div>

        {/* Channel Name Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2" htmlFor="channelName">
            Channel Name
          </label>
          <div className="flex items-center bg-[#1e1f22] border border-gray-700/80 rounded-lg px-3 py-2 focus-within:border-[#5865f2]">
            <span className="text-gray-400 mr-2 text-lg font-bold">
              {formData.channelType === 'text' ? '#' : '🔊'}
            </span>
            <input
              type="text"
              id="channelName"
              placeholder={formData.channelType === 'text' ? 'new-channel' : 'General Voice'}
              className="bg-transparent text-white w-full focus:outline-none text-sm placeholder-gray-500"
              value={formData.channelName}
              onChange={(e) =>
                setFormData({ ...formData, channelName: e.target.value })
              }
            />
          </div>
        </div>

        {/* Category Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2" htmlFor="category">
            Category
          </label>
          <input
            type="text"
            id="category"
            className="w-full bg-[#1e1f22] border border-gray-700/80 rounded-lg px-3 py-2 text-white focus:outline-none text-sm focus:border-[#5865f2]"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
          />
        </div>

        {/* Add Members section */}
        {users.length > 0 && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
              Add Members (Optional)
            </label>
            <div className="max-h-40 overflow-y-auto bg-[#1e1f22] rounded-lg p-2 border border-gray-700/80 space-y-1">
              {users.map((user) => (
                <UserRow user={user} userChanged={userChanged} key={user.id} />
              ))}
            </div>
          </div>
        )}
      </form>

      {/* Footer / Buttons */}
      <div className="flex space-x-3 items-center justify-end px-6 py-4 bg-[#2b2d31] border-t border-gray-700/50">
        <Link
          href="/"
          className="px-4 py-2 text-sm font-semibold text-gray-300 hover:underline"
        >
          Cancel
        </Link>
        <button
          type="button"
          disabled={buttonDisabled()}
          className={`bg-[#5865f2] hover:bg-[#4752c4] active:bg-[#3c45a5] rounded-md py-2 px-5 text-white text-sm font-semibold transition ${
            buttonDisabled() ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={createClicked}
        >
          {isSubmitting ? 'Creating...' : 'Create Channel'}
        </button>
      </div>
    </dialog>
  );
}
