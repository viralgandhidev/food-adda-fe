"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { api } from "@/lib/api";
import Image from "next/image";
import {
  FiSearch,
  FiSend,
  FiPaperclip,
  FiSmile,
  FiMic,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

interface Chat {
  id: number;
  user_id: string;
  supplier_id: string;
  first_name: string;
  last_name: string;
  company_name: string | null;
  profile_image_url: string | null;
  updated_at: string;
  last_message: string | null;
  last_message_time: string | null;
  last_message_sender_id?: string;
  unread_count?: number;
}

interface Message {
  id: number;
  sender_id: string;
  message_text: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  created_at: string;
}

interface UserInfo {
  id: string;
  user_type?: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const lastReadMessageIdRef = useRef<number | null>(null);

  // Backend base URL for attachments (computed once per render)
  const BACKEND_BASE_URL = useMemo(() => {
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
    return apiBaseUrl.replace(/\/api\/v1$/, "");
  }, []);

  // Get user ID and type from token
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      // Decode JWT to get user ID and type (simple base64 decode)
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserId(payload.id);
      setUserType(payload.user_type || null);
    } catch {
      router.push("/login");
    }
  }, [router]);

  // Fetch chats
  useEffect(() => {
    if (!userId) return;
    const fetchChats = async () => {
      try {
        setLoading(true);
        const response = await api.get("/chat");
        setChats(response.data.data || []);

        // Check for supplier_id in URL query params
        const urlParams = new URLSearchParams(window.location.search);
        const supplierIdFromUrl = urlParams.get("supplier_id");

        if (supplierIdFromUrl && response.data.data) {
          // Find chat with matching supplier_id
          const chatWithSupplier = response.data.data.find(
            (chat: Chat) => chat.supplier_id === supplierIdFromUrl
          );

          if (chatWithSupplier) {
            setSelectedChat(chatWithSupplier);
          } else {
            // Create a new chat with this supplier
            try {
              const createResponse = await api.post("/chat", {
                supplier_id: supplierIdFromUrl,
              });
              const newChatId = createResponse.data.data.chat_id;

              // Fetch chats again to get the new chat
              const refreshedResponse = await api.get("/chat");
              const refreshedChats = refreshedResponse.data.data || [];
              const newChat = refreshedChats.find(
                (chat: Chat) => chat.id === newChatId
              );
              if (newChat) {
                setChats(refreshedChats);
                setSelectedChat(newChat);
              } else if (refreshedChats.length > 0) {
                setChats(refreshedChats);
                setSelectedChat(refreshedChats[0]);
              }
            } catch (createError) {
              console.error("Error creating chat:", createError);
              // If chat creation fails, just select first chat or none
              if (response.data.data && response.data.data.length > 0) {
                setSelectedChat(response.data.data[0]);
              }
            }
          }
        } else if (response.data.data && response.data.data.length > 0) {
          setSelectedChat(response.data.data[0]);
        }
      } catch (error: unknown) {
        console.error("Error fetching chats:", error);
        if (
          (error as { response?: { status?: number } })?.response?.status ===
          403
        ) {
          router.push("/pricing");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchChats();

    // Poll chat list periodically to update unread indicators for all chats
    const chatPollInterval = setInterval(async () => {
      try {
        // Silently fetch in background - don't set loading state
        const response = await api.get("/chat");
        if (response.data && response.data.success && response.data.data) {
          const fetchedChats = response.data.data;
          // Only update if we got valid data
          if (Array.isArray(fetchedChats)) {
            setChats(fetchedChats);
          }
        }
      } catch (error) {
        // Silently fail - chat list polling should not break the UI
        // Don't update chats if fetch fails
      }
    }, 15000); // Poll every 15 seconds

    return () => clearInterval(chatPollInterval);
  }, [userId, router]);

  // Fetch messages when chat is selected
  useEffect(() => {
    if (!selectedChat) return;

    // Mark chat as read when selected
    const markAsRead = async () => {
      try {
        await api.post(`/chat/${selectedChat.id}/read`);
        // Refresh chat list to update unread counts
        const response = await api.get("/chat");
        if (response.data && response.data.success && response.data.data) {
          const fetchedChats = response.data.data;
          if (Array.isArray(fetchedChats)) {
            setChats(fetchedChats);
          }
        }
        // Trigger custom event to update header unread count
        window.dispatchEvent(new Event("chat-read-updated"));
      } catch (error) {
        // Silently fail - marking as read shouldn't break the UI
        console.error("Error marking chat as read:", error);
      }
    };
    markAsRead();

    let pollInterval = 5000; // Start with 5 seconds
    let intervalId: NodeJS.Timeout | null = null;
    let consecutiveEmptyResponses = 0;
    let lastMessageIdRef: number | undefined = undefined;

    const fetchMessages = async (fetchAll: boolean = false) => {
      try {
        // Get the last message ID to fetch only new messages
        const lastMessageId =
          !fetchAll && lastMessageIdRef !== undefined
            ? lastMessageIdRef
            : undefined;

        const url = `/chat/${selectedChat.id}/messages${
          lastMessageId ? `?last_message_id=${lastMessageId}` : ""
        }`;
        const response = await api.get(url);
        const newMessages = response.data.data || [];

        if (fetchAll) {
          // Initial fetch - replace all messages
          setMessages(newMessages);
          if (newMessages.length > 0) {
            lastMessageIdRef = newMessages[newMessages.length - 1].id;
          }
        } else if (newMessages.length > 0) {
          // Append only new messages, filtering out duplicates
          setMessages((prev) => {
            const existingIds = new Set(prev.map((msg: Message) => msg.id));
            const uniqueNewMessages = newMessages.filter(
              (msg: Message) => !existingIds.has(msg.id)
            );
            if (uniqueNewMessages.length === 0) return prev;
            const updated = [...prev, ...uniqueNewMessages];
            lastMessageIdRef = updated[updated.length - 1].id;

            // Update chat list with the latest message info
            const lastNewMessage =
              uniqueNewMessages[uniqueNewMessages.length - 1];
            if (lastNewMessage && selectedChat) {
              setChats((prevChats) =>
                prevChats.map((chat) =>
                  chat.id === selectedChat.id
                    ? {
                        ...chat,
                        last_message:
                          lastNewMessage.message_text || "Sent an attachment",
                        last_message_time: lastNewMessage.created_at,
                        last_message_sender_id: lastNewMessage.sender_id,
                        updated_at: lastNewMessage.created_at,
                      }
                    : chat
                )
              );
            }

            return updated;
          });
          consecutiveEmptyResponses = 0;
          pollInterval = 5000; // Reset to 5 seconds when we get messages
        } else {
          // No new messages - implement exponential backoff
          consecutiveEmptyResponses++;
          // Increase interval: 5s -> 10s -> 30s (max)
          if (consecutiveEmptyResponses <= 2) {
            pollInterval = 5000;
          } else if (consecutiveEmptyResponses <= 5) {
            pollInterval = 10000;
          } else if (consecutiveEmptyResponses <= 10) {
            pollInterval = 10000;
          } else {
            pollInterval = 30000; // Max 30 seconds when idle
          }

          // Clear and restart interval with new delay
          if (intervalId) clearInterval(intervalId);
          intervalId = setInterval(() => fetchMessages(false), pollInterval);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    // Initial fetch - get all messages
    fetchMessages(true);

    // Start polling with initial interval
    intervalId = setInterval(() => fetchMessages(false), pollInterval);

    // Poll immediately when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && selectedChat) {
        fetchMessages(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [selectedChat]);

  // Scroll to bottom only on initial chat load
  useEffect(() => {
    if (!selectedChat) return;

    // Reset new message count when switching chats
    setNewMessageCount(0);
    lastReadMessageIdRef.current = null;

    // Only auto-scroll when a chat is first selected - use a timeout to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      // Mark the last message as read after scrolling
      if (messages.length > 0) {
        lastReadMessageIdRef.current = messages[messages.length - 1].id;
      }
    }, 100);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat?.id]); // Only trigger when chat ID changes, not on message updates

  // Track new messages when not at bottom
  useEffect(() => {
    if (messages.length === 0 || !lastReadMessageIdRef.current) {
      // If we're at the bottom (no lastReadMessageId), update it
      if (messages.length > 0) {
        lastReadMessageIdRef.current = messages[messages.length - 1].id;
        setNewMessageCount(0);
      }
      return;
    }

    // Count messages after the last read message
    const lastReadIndex = messages.findIndex(
      (msg) => msg.id === lastReadMessageIdRef.current
    );

    if (lastReadIndex === -1) {
      // Last read message not found (might be from different chat), update it
      lastReadMessageIdRef.current = messages[messages.length - 1].id;
      setNewMessageCount(0);
      return;
    }

    const newMessagesCount = messages.length - lastReadIndex - 1;
    setNewMessageCount(newMessagesCount > 0 ? newMessagesCount : 0);
  }, [messages]);

  // Track scroll position to reset new message count when user scrolls to bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !selectedChat) return;

    const handleScroll = () => {
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        100;

      if (isNearBottom && messages.length > 0) {
        // User scrolled to bottom, mark all messages as read
        lastReadMessageIdRef.current = messages[messages.length - 1].id;
        setNewMessageCount(0);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [selectedChat, messages]);

  // Function to scroll to bottom and mark messages as read
  const handleScrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (messages.length > 0) {
      lastReadMessageIdRef.current = messages[messages.length - 1].id;
      setNewMessageCount(0);
    }
  };

  // Filter chats based on search
  const filteredChats = chats.filter((chat) => {
    const searchLower = searchQuery.toLowerCase();
    const name = `${chat.first_name} ${chat.last_name}`.toLowerCase();
    const company = (chat.company_name || "").toLowerCase();
    return name.includes(searchLower) || company.includes(searchLower);
  });

  // Send message
  const handleSendMessage = async () => {
    if (!selectedChat || sending) return;
    if (!messageText.trim() && !selectedFile) return;

    try {
      setSending(true);

      const formData = new FormData();
      if (messageText.trim()) {
        formData.append("message_text", messageText);
      }
      if (selectedFile) {
        formData.append("attachment", selectedFile);
        if (selectedFile.type.startsWith("audio/")) {
          formData.append("attachment_type", "voice");
        } else if (selectedFile.type.startsWith("image/")) {
          formData.append("attachment_type", "image");
        } else {
          formData.append("attachment_type", "file");
        }
      }

      const response = await api.post(
        `/chat/${selectedChat.id}/messages`,
        formData
      );

      const result = response.data;
      const newMessage = result.data;

      // Add the new message to the messages array, avoiding duplicates
      setMessages((prev) => {
        // Check if message already exists (from polling)
        const exists = prev.some((msg) => msg.id === newMessage.id);
        if (exists) return prev;
        return [...prev, newMessage];
      });

      // Update last read message ID to the new message (sender's own message)
      lastReadMessageIdRef.current = newMessage.id;
      setNewMessageCount(0);

      // Scroll to bottom to show the sent message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

      // Update chat's last message
      const lastMessageText =
        messageText.trim() ||
        (selectedFile
          ? `Sent ${
              selectedFile.type.startsWith("image/")
                ? "an image"
                : selectedFile.type.startsWith("audio/")
                ? "a voice message"
                : "a file"
            }`
          : "");
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === selectedChat.id
            ? {
                ...chat,
                last_message: lastMessageText,
                last_message_time: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : chat
        )
      );

      setMessageText("");
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      messageInputRef.current?.focus();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setMessageText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    messageInputRef.current?.focus();
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioFile = new File([audioBlob], "voice-message.webm", {
          type: "audio/webm",
        });
        setSelectedFile(audioFile);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Failed to start recording. Please check microphone permissions.");
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Format time
  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // Format date for "Today" separator
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const messageDate = new Date(date);
    messageDate.setHours(0, 0, 0, 0);

    if (messageDate.getTime() === today.getTime()) {
      return "Today";
    }
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.getTime() === yesterday.getTime()) {
      return "Yesterday";
    }
    return date.toLocaleDateString();
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.created_at);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  // Get supplier display name
  const getSupplierName = (chat: Chat) => {
    return chat.company_name || `${chat.first_name} ${chat.last_name}`;
  };

  // Get supplier display name for selected chat
  const getSelectedSupplierName = () => {
    if (!selectedChat) return "";
    return (
      selectedChat.company_name ||
      `${selectedChat.first_name} ${selectedChat.last_name}`
    );
  };

  if (loading) {
    return (
      <div className="h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center min-h-0">
          <div className="text-gray-500">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 flex overflow-hidden min-h-0 h-full px-6 md:px-[135px] border-t border-gray-200">
        {/* Left Sidebar - Chat List */}
        <div className="w-full md:w-96 border-r border-gray-200 flex flex-col bg-white h-full min-h-0">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-[#181818] mb-4">Chats</h1>
            {/* Search Bar */}
            <div className="relative">
              <FiSearch
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-[#F4D300] text-[#181818] placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {filteredChats.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchQuery ? "No chats found" : "No chats yet"}
              </div>
            ) : (
              filteredChats.map((chat) => {
                const isSelected = selectedChat?.id === chat.id;
                const unreadCount =
                  chat.unread_count && chat.unread_count > 0 && !isSelected
                    ? chat.unread_count
                    : 0;
                const hasUnread = unreadCount > 0;
                return (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      isSelected ? "bg-gray-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Profile Picture */}
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                        {chat.profile_image_url ? (
                          <Image
                            src={chat.profile_image_url}
                            alt={getSupplierName(chat)}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            {chat.first_name[0]}
                            {chat.last_name[0]}
                          </div>
                        )}
                      </div>

                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <h3
                              className={`truncate ${
                                hasUnread
                                  ? "font-bold text-[#181818]"
                                  : "font-semibold text-[#181818]"
                              }`}
                            >
                              {getSupplierName(chat)}
                            </h3>
                            {hasUnread && (
                              <span className="bg-[#F4D300] text-[#181818] text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 flex-shrink-0">
                                {unreadCount > 99 ? "99+" : unreadCount}
                              </span>
                            )}
                          </div>
                          {chat.last_message_time && (
                            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                              {formatTime(chat.last_message_time)}
                            </span>
                          )}
                        </div>
                        {chat.last_message && (
                          <p
                            className={`text-sm truncate ${
                              hasUnread
                                ? "text-[#181818] font-medium"
                                : "text-gray-600"
                            }`}
                          >
                            {chat.last_message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Section - Chat Conversation */}
        <div className="flex-1 flex flex-col bg-white h-full min-h-0">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  {/* Profile Picture */}
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                    {selectedChat.profile_image_url ? (
                      <Image
                        src={selectedChat.profile_image_url}
                        alt={getSelectedSupplierName()}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        {selectedChat.first_name[0]}
                        {selectedChat.last_name[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-[#181818]">
                      {getSelectedSupplierName()}
                    </h2>
                    <p className="text-xs text-green-600">Online</p>
                  </div>
                </div>
                {userType !== "SELLER" && (
                  <a
                    href={`/seller/${selectedChat.supplier_id}`}
                    className="text-sm text-[#F4D300] hover:underline"
                  >
                    View supplier details →
                  </a>
                )}
              </div>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 relative"
              >
                {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                  <div key={date}>
                    {/* Date Separator */}
                    <div className="flex items-center justify-center my-4">
                      <div className="flex-1 border-t border-gray-200"></div>
                      <span className="px-3 text-xs text-gray-500">{date}</span>
                      <div className="flex-1 border-t border-gray-200"></div>
                    </div>

                    {/* Messages for this date */}
                    {dateMessages.map((message) => {
                      const isOwnMessage = message.sender_id === userId;

                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isOwnMessage ? "justify-end" : "justify-start"
                          } mb-2`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              isOwnMessage
                                ? "bg-[#F4D300] text-[#181818]"
                                : "bg-gray-200 text-[#181818]"
                            }`}
                          >
                            {message.attachment_url && (
                              <div className="mb-2">
                                {message.attachment_type === "image" ? (
                                  <img
                                    src={`${BACKEND_BASE_URL}${message.attachment_url}`}
                                    alt="Attachment"
                                    className="rounded-lg max-w-full h-auto"
                                    style={{ maxWidth: "300px" }}
                                    onError={(e) => {
                                      console.error(
                                        "Image failed to load:",
                                        `${BACKEND_BASE_URL}${message.attachment_url}`
                                      );
                                      console.error("Error event:", e);
                                    }}
                                    crossOrigin="anonymous"
                                  />
                                ) : message.attachment_type === "voice" ? (
                                  <audio
                                    controls
                                    src={`${BACKEND_BASE_URL}${message.attachment_url}`}
                                    className="w-full"
                                  >
                                    Your browser does not support the audio
                                    element.
                                  </audio>
                                ) : (
                                  <a
                                    href={`${BACKEND_BASE_URL}${message.attachment_url}`}
                                    download
                                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                                  >
                                    <FiPaperclip size={16} />
                                    Download attachment
                                  </a>
                                )}
                              </div>
                            )}
                            {message.message_text && (
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.message_text}
                              </p>
                            )}
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span className="text-xs opacity-70">
                                {formatTime(message.created_at)}
                              </span>
                              {isOwnMessage && (
                                <span className="text-xs">✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={messagesEndRef} />

                {/* New Message Indicator */}
                {newMessageCount > 0 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                    <button
                      onClick={handleScrollToBottom}
                      className="bg-[#F4D300] text-[#181818] px-4 py-2 rounded-full shadow-lg hover:bg-[#F6DD3D] transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      <span>
                        {newMessageCount === 1
                          ? "1 new message"
                          : `${newMessageCount} new messages`}
                      </span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8 3V13M8 13L3 8M8 13L13 8"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 flex-shrink-0">
                {previewUrl && (
                  <div className="mb-2 relative inline-block">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      width={200}
                      height={200}
                      className="rounded-lg max-h-48 object-cover"
                    />
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                )}
                {selectedFile && !previewUrl && (
                  <div className="mb-2 flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
                    <FiPaperclip size={16} />
                    <span className="text-sm flex-1 truncate">
                      {selectedFile.name}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onMouseLeave={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    className={`p-2 ${
                      isRecording ? "text-red-500" : "text-gray-500"
                    } hover:text-[#181818]`}
                    title="Hold to record voice message"
                  >
                    <FiMic size={20} />
                  </button>
                  <div className="flex-1 relative">
                    <input
                      ref={messageInputRef}
                      type="text"
                      placeholder="Type your message here.."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="w-full px-4 py-2 pr-20 bg-gray-100 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-[#F4D300] text-[#181818] placeholder:text-gray-500"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileSelect}
                      accept="image/*,audio/*,.pdf,.doc,.docx"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 text-gray-500 hover:text-[#181818]"
                        title="Attach file"
                      >
                        <FiPaperclip size={18} />
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="p-1.5 text-gray-500 hover:text-[#181818]"
                          title="Add emoji"
                        >
                          <FiSmile size={18} />
                        </button>
                        {showEmojiPicker && (
                          <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-64 h-48 overflow-y-auto z-10">
                            <div className="grid grid-cols-8 gap-1">
                              {[
                                "😀",
                                "😃",
                                "😄",
                                "😁",
                                "😆",
                                "😅",
                                "😂",
                                "🤣",
                                "😊",
                                "😇",
                                "🙂",
                                "🙃",
                                "😉",
                                "😌",
                                "😍",
                                "🥰",
                                "😘",
                                "😗",
                                "😙",
                                "😚",
                                "😋",
                                "😛",
                                "😝",
                                "😜",
                                "🤪",
                                "🤨",
                                "🧐",
                                "🤓",
                                "😎",
                                "🤩",
                                "🥳",
                                "😏",
                                "😒",
                                "😞",
                                "😔",
                                "😟",
                                "😕",
                                "🙁",
                                "☹️",
                                "😣",
                                "😖",
                                "😫",
                                "😩",
                                "🥺",
                                "😢",
                                "😭",
                                "😤",
                                "😠",
                                "😡",
                                "🤬",
                                "🤯",
                                "😳",
                                "🥵",
                                "🥶",
                                "😱",
                                "😨",
                                "😰",
                                "😥",
                                "😓",
                                "🤗",
                                "🤔",
                                "🤭",
                                "🤫",
                                "🤥",
                                "😶",
                                "😐",
                                "😑",
                                "😬",
                                "🙄",
                                "😯",
                                "😦",
                                "😧",
                                "😮",
                                "😲",
                                "🥱",
                                "😴",
                                "🤤",
                                "😪",
                                "😵",
                                "🤐",
                                "🥴",
                                "🤢",
                                "🤮",
                                "🤧",
                                "😷",
                                "🤒",
                                "🤕",
                                "🤑",
                                "🤠",
                                "😈",
                                "👿",
                                "👹",
                                "👺",
                                "🤡",
                                "💩",
                                "👻",
                                "💀",
                                "☠️",
                                "👽",
                                "👾",
                                "🤖",
                                "🎃",
                                "😺",
                                "😸",
                                "😹",
                                "😻",
                                "😼",
                                "😽",
                                "🙀",
                                "😿",
                                "😾",
                              ].map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleEmojiSelect(emoji)}
                                  className="text-2xl hover:bg-gray-100 rounded p-1"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={(!messageText.trim() && !selectedFile) || sending}
                    className="p-2 bg-[#F4D300] text-[#181818] rounded-lg hover:bg-[#F6DD3D] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiSend size={20} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a chat to start messaging
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
