"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Send, Bot, User, Zap, Brain, DollarSign, ShoppingBag, Briefcase } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  agents?: string[];
}

const quickPrompts = [
  "I'm broke, help me survive",
  "Can I afford to eat out this weekend?",
  "Find me the cheapest lunch near campus",
  "Help me earn $100 this week",
  "Should I buy or borrow a calculator?",
  "What deals are available now?",
];

const agentIcons: Record<string, JSX.Element> = {
  Financial: <DollarSign className="w-3 h-3" />,
  Lobang: <Zap className="w-3 h-3" />,
  Marketplace: <ShoppingBag className="w-3 h-3" />,
  "Side Hustle": <Briefcase className="w-3 h-3" />,
};

const agentColors: Record<string, string> = {
  Financial: "bg-red-500/20 text-red-400 border-red-500/30",
  Lobang: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Marketplace: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Side Hustle": "bg-green-500/20 text-green-400 border-green-500/30",
};

export default function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialMessage = searchParams.get("prompt") || "";

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `👋 Hey there! I'm your **M0neyPundit** assistant.

I have a team of specialized agents ready to help you optimize your finances:

- 💰 **Financial Agent** - Budget analysis, spending insights & money predictions
- 🎉 **Lobang Agent** - Best student deals, discounts & promotions
- 🏪 **Marketplace Agent** - Buy, sell, borrow & rent campus items
- 💼 **Side Hustle Agent** - Find earning opportunities matched to your skills

Just tell me what you need! Try one of the quick prompts below.`,
      timestamp: new Date(),
      agents: ["Financial", "Lobang", "Marketplace", "Side Hustle"],
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle initial message from URL param
  useEffect(() => {
    if (initialMessage) {
      sendMessage(initialMessage);
      router.replace("/chat");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "Sorry, I couldn't process that right now.",
        timestamp: new Date(),
        agents: data.agents,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "⚠️ Sorry, I encountered an error. Please try again!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 h-[calc(100vh-4rem)] flex flex-col">
      {/* Chat Container */}
      <div className="flex-1 card overflow-hidden flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 animate-slide-in ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === "user"
                    ? "bg-primary"
                    : "bg-gradient-to-br from-primary to-secondary"
                }`}
              >
                {message.role === "user" ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Message Content */}
              <div
                className={`max-w-[80%] ${
                  message.role === "user"
                    ? "bg-primary text-white rounded-2xl rounded-tr-sm"
                    : "bg-dark border border-gray-800 rounded-2xl rounded-tl-sm"
                } p-4`}
              >
                {/* Format message content with basic markdown */}
                <div className="text-sm whitespace-pre-wrap">
                  {message.content.split("\n").map((line, i) => {
                    const formatted = line.replace(
                      /\*\*(.*?)\*\*/g,
                      '<strong>$1</strong>'
                    );
                    return (
                      <div
                        key={i}
                        dangerouslySetInnerHTML={{ __html: formatted || "\u00A0" }}
                      />
                    );
                  })}
                </div>

                {/* Agent badges */}
                {message.agents && message.agents.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-700/50">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Brain className="w-3 h-3" />
                      Powered by:
                    </span>
                    {message.agents.map((agent) => (
                      <span
                        key={agent}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${
                          agentColors[agent] || "bg-gray-500/20 text-gray-400 border-gray-500/30"
                        }`}
                      >
                        {agentIcons[agent]}
                        {agent}
                      </span>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                <p
                  className={`text-xs mt-2 ${
                    message.role === "user"
                      ? "text-white/70"
                      : "text-gray-500"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 animate-slide-in">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-dark border border-gray-800 rounded-2xl rounded-tl-sm p-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 ml-2">
                    Consulting agents...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-800 p-4">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell me what you need... (e.g., 'I'm broke this week')"
              className="input flex-1 resize-none h-12 max-h-32"
              rows={1}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="btn btn-primary self-end h-12 w-12 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="mt-4">
        <p className="text-xs text-gray-500 mb-2 text-center">💡 Quick prompts to get started</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {quickPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => sendMessage(prompt)}
              disabled={isLoading}
              className="btn btn-secondary text-xs px-3 py-1.5 opacity-80 hover:opacity-100 disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}