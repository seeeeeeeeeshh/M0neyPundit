"use client";

import { Suspense } from "react";
import ChatContent from "@/components/ChatContent";

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-6 h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading chat...</p>
          </div>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}