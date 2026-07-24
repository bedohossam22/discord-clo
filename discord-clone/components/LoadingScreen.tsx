"use client";

import React, { useEffect, useState } from "react";
import { DiscordIcon } from "./Icons";

interface LoadingScreenProps {
  message?: string;
  submessage?: string;
}

export default function LoadingScreen({
  message = "Connecting to Discord...",
  submessage = "Connecting to chat and voice servers",
}: LoadingScreenProps) {
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeout(true);
    }, 12000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#1e1f22] text-white">
      <div className="relative flex flex-col items-center justify-center p-8 text-center max-w-md w-full">
        {/* Animated Discord Logo Container */}
        <div className="relative flex items-center justify-center mb-6">
          {/* Spinning gradient ring */}
          <div className="absolute w-24 h-24 rounded-full border-4 border-transparent border-t-[#5865f2] border-r-[#5865f2] animate-spin"></div>
          {/* Outer glow ring */}
          <div className="absolute w-28 h-28 rounded-full bg-[#5865f2]/10 animate-ping"></div>
          {/* Central Logo Box */}
          <div className="w-16 h-16 bg-[#5865f2] rounded-2xl flex items-center justify-center shadow-lg shadow-[#5865f2]/30 transition-transform duration-300 hover:scale-105">
            <DiscordIcon className="w-10 h-10 text-white animate-pulse" />
          </div>
        </div>

        {/* Text Details */}
        <h2 className="text-xl font-bold text-gray-100 mb-2 tracking-wide">
          {message}
        </h2>
        <p className="text-sm text-gray-400 mb-6">{submessage}</p>

        {/* Progress dots */}
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 bg-[#5865f2] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2.5 h-2.5 bg-[#5865f2] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2.5 h-2.5 bg-[#5865f2] rounded-full animate-bounce"></div>
        </div>

        {/* Timeout / Retry Action if loading takes unusually long */}
        {showTimeout && (
          <div className="mt-8 p-4 bg-[#2b2d31] rounded-xl border border-gray-700/50 shadow-xl flex flex-col items-center animate-fade-in">
            <p className="text-xs text-gray-300 mb-3 text-center">
              Taking longer than expected? Check your internet connection or try refreshing.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] active:bg-[#3c45a5] text-white text-xs font-semibold rounded-md transition duration-200 shadow"
            >
              Refresh Application
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
