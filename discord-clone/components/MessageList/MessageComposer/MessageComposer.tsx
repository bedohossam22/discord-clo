import { PlusCircle, Emoji, GIF, Present } from "@/components/Icons";
import { useState } from "react";
import { SendButton, useChatContext } from "stream-chat-react";
import { plusItems } from "./plusitems";
import ChannelListMenuRow from "@/components/ChannelList/TopBar/ChannelListMenuRow";

export default function MessageComposer(): JSX.Element {
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const { channel } = useChatContext();
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (!message.trim()) return;
    channel?.sendMessage({ text: message });
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex mx-6 my-6 px-4 py-2 bg-composer-gray items-center justify-between space-x-4 rounded-md text-gray-600 relative"
    >
      <button
        type="button"
        onClick={() => setPlusMenuOpen((menuOpen) => !menuOpen)}
      >
        <PlusCircle className="w-8 h-8 hover:text-gray-800" />
      </button>

      {plusMenuOpen && (
        <div className="absolute p-2 z-10 -left-6 bottom-14">
          <div className="bg-white p-2 shadow-lg rounded-md w-40 flex flex-col">
            {plusItems.map((option) => (
              <button
                type="button"
                key={option.name}
                className="text-left"
                onClick={() => setPlusMenuOpen(false)}
              >
                <ChannelListMenuRow {...option} />
              </button>
            ))}
          </div>
        </div>
      )}

      <input
        className="flex-1 border-transparent bg-transparent outline-none text-sm font-semibold m-0 text-gray-800 placeholder-gray-400"
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`Message #${channel?.data?.name || 'general'}`}
      />

      <div className="flex items-center space-x-3">
        <Present className="w-8 h-8 hover:text-gray-800 cursor-pointer" />
        <GIF className="w-8 h-8 hover:text-gray-800 cursor-pointer" />
        <Emoji className="w-8 h-8 hover:text-gray-800 cursor-pointer" />
        <SendButton sendMessage={handleSendMessage} />
      </div>
    </form>
  );
}