import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Send,
  ShieldCheck,
  CheckCheck,
  MessageSquare,
  Briefcase,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Building2,
  ExternalLink,
  Copy,
  Check,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { chatService } from '@/services/chatService';
import type { ChatModel, MessageModel } from '@/types/chat';
import { ROUTES } from '@/utils/constants';
import { ModalPortal } from '@/components/common/Modal';

export const ChatPage: React.FC = () => {
  const { chatId: routeChatId } = useParams<{ chatId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const candidateId = user?.uid || '';

  const passedState = location.state as {
    activeChatId?: string;
    recruiterId?: string;
    recruiterName?: string;
    jobTitle?: string;
    jobId?: string;
  } | undefined;

  const [chats, setChats] = useState<ChatModel[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(
    routeChatId || passedState?.activeChatId || null
  );
  const [messages, setMessages] = useState<MessageModel[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Message actions: Copy, Edit, Delete
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<MessageModel | null>(null);
  const [editText, setEditText] = useState('');
  const [deletingMessage, setDeletingMessage] = useState<MessageModel | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleCopyMessage = (msg: MessageModel) => {
    const text = msg.decryptedContent || msg.content;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMsgId(msg.id);
      setTimeout(() => setCopiedMsgId(null), 2000);
    }
  };

  const handleStartEdit = (msg: MessageModel) => {
    setEditingMessage(msg);
    setEditText(msg.decryptedContent || msg.content);
  };

  const handleSaveEdit = async () => {
    if (!activeChatId || !editingMessage || !editText.trim()) return;
    try {
      setIsActionLoading(true);
      await chatService.editMessage(activeChatId, editingMessage.id, editText.trim());
      setEditingMessage(null);
      setEditText('');
    } catch (err) {
      console.error('[ChatPage] Error editing message:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeChatId || !deletingMessage) return;
    try {
      setIsActionLoading(true);
      await chatService.deleteMessage(activeChatId, deletingMessage.id);
      setDeletingMessage(null);
    } catch (err) {
      console.error('[ChatPage] Error deleting message:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Subscribe to Candidate's Realtime Chat List
  useEffect(() => {
    if (!candidateId) {
      setLoadingChats(false);
      return;
    }

    setLoadingChats(true);
    setChatError(null);

    const unsub = chatService.subscribeToCandidateChats(
      candidateId,
      (liveChats) => {
        setChats(liveChats);
        setLoadingChats(false);

        // Auto-select first chat on desktop if none selected
        if (liveChats.length > 0 && !activeChatId && !routeChatId && !passedState?.activeChatId) {
          const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
          if (isDesktop) {
            setActiveChatId(liveChats[0].id);
          }
        }
      },
      (err) => {
        console.error('[ChatPage] Error loading chats:', err);
        setChatError('Failed to load conversations from Firebase.');
        setLoadingChats(false);
      }
    );

    return () => unsub();
  }, [candidateId, activeChatId, routeChatId, passedState?.activeChatId]);

  // 2. Subscribe to Active Chat Messages & Mark as Read
  useEffect(() => {
    if (!activeChatId || !candidateId) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    setLoadingMessages(true);

    // Mark conversation as read for the candidate
    chatService.markAsRead(activeChatId, candidateId);

    const unsub = chatService.subscribeToMessages(
      activeChatId,
      (liveMessages) => {
        setMessages(liveMessages);
        setLoadingMessages(false);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      },
      (err) => {
        console.error('[ChatPage] Error loading messages:', err);
        setLoadingMessages(false);
      }
    );

    return () => unsub();
  }, [activeChatId, candidateId]);

  // Send Message with WebCrypto AES-CTR Encryption
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatId || !candidateId || sending) return;

    const textToSend = inputText.trim();
    setInputText('');

    try {
      setSending(true);
      await chatService.sendMessage({
        chatId: activeChatId,
        senderId: candidateId,
        content: textToSend,
      });

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 50);
    } catch (err: unknown) {
      console.error('[ChatPage] Failed to send encrypted message:', err);
      // Restore input text on failure
      setInputText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const filteredChats = chats.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.recruiterName && c.recruiterName.toLowerCase().includes(q)) ||
      (c.companyName && c.companyName.toLowerCase().includes(q)) ||
      (c.jobRole && c.jobRole.toLowerCase().includes(q)) ||
      (c.decryptedLastMessage && c.decryptedLastMessage.toLowerCase().includes(q))
    );
  });

  const activeChat = chats.find((c) => c.id === activeChatId) || {
    id: activeChatId || '',
    jobId: passedState?.jobId || '',
    candidateId,
    recruiterId: passedState?.recruiterId || '',
    recruiterName: passedState?.recruiterName || 'Recruiter',
    recruiterPhotoUrl: undefined,
    recruiterDesignation: 'Hiring Lead',
    companyName: 'Company',
    companyLogoUrl: undefined,
    jobRole: passedState?.jobTitle || 'Role Opening',
    lastMessage: '',
    lastMessageTime: new Date().toISOString(),
    participantIds: [candidateId, passedState?.recruiterId || ''],
    unreadCountCandidate: 0,
    unreadCount: 0,
  };

  const formatMessageTime = (isoString: string | Date | any) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatChatDate = (isoString: string | Date | any) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 w-full min-w-0 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0E2233] rounded-3xl p-6 sm:p-8 border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#00BFA6]/15 border border-[#00BFA6]/30 flex items-center justify-center text-[#00BFA6] shrink-0">
            <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1F2D3D] dark:text-white tracking-tight">
              Recruiter Messages
            </h1>
            <p className="text-xs sm:text-sm text-[#6B8699] dark:text-[#8CA6B7] mt-0.5">
              Secure, end-to-end encrypted direct messaging with verified hiring teams and recruiters.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/40 border border-brand-200/80 dark:border-brand-800/60 px-3.5 py-1.5 rounded-xl shrink-0">
          <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span>AES-CTR Encrypted</span>
        </div>
      </div>

      {chatError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{chatError}</span>
        </div>
      )}

      {/* Main Chat Workspace Container */}
      <div className="bg-white dark:bg-[#0E2233] rounded-3xl border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-sm overflow-hidden h-[calc(100vh-230px)] min-h-[580px] grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Conversations List (4 Cols on desktop; full width on mobile when no active chat) */}
        <div
          className={`lg:col-span-4 border-r border-[#D8E4EA] dark:border-[#1F2D3D] flex flex-col h-full bg-[#E8F1F5]/40 dark:bg-[#0A1A27]/50 min-w-0 ${
            activeChatId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Search Bar */}
          <div className="p-4 border-b border-[#D8E4EA] dark:border-[#1F2D3D] space-y-3 bg-white dark:bg-[#0E2233]">
            <div className="relative">
              <Search className="w-4 h-4 text-[#8CA6B7] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recruiters or messages..."
                className="w-full pl-10 pr-3.5 py-2 text-xs bg-[#E8F1F5] dark:bg-[#0A1A27] border border-[#D8E4EA] dark:border-[#1F2D3D] rounded-xl text-[#1F2D3D] dark:text-white placeholder:text-[#8CA6B7] focus:outline-none focus:ring-2 focus:ring-[#00BFA6]/20 focus:border-[#00BFA6]"
              />
            </div>
          </div>

          {/* Conversations Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#D8E4EA] dark:divide-[#1F2D3D]">
            {loadingChats ? (
              <div className="p-8 text-center text-xs text-[#8CA6B7] flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#00BFA6]" />
                <span>Loading conversations...</span>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#8CA6B7] space-y-2">
                <MessageSquare className="w-8 h-8 text-[#8CA6B7] mx-auto mb-1" />
                <p className="font-bold text-[#1F2D3D] dark:text-[#BACDD8]">NO MESSAGES YET</p>
                <p className="text-[11px] text-[#6B8699] dark:text-[#8CA6B7] max-w-xs mx-auto">
                  When recruiters contact you about job applications, your direct encrypted chats will appear here.
                </p>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const isActive = chat.id === activeChatId;
                const unread = Number(chat.unreadCountCandidate || chat.unreadCount || 0);

                return (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => setActiveChatId(chat.id)}
                    className={`w-full p-4 text-left transition flex items-start gap-3.5 min-w-0 ${
                      isActive
                        ? 'bg-[#E8F1F5] dark:bg-[#0E2233] shadow-xs border-l-4 border-[#00BFA6]'
                        : 'hover:bg-[#E8F1F5]/80 dark:hover:bg-[#332F34]'
                    }`}
                  >
                    {/* Recruiter Avatar */}
                    {chat.recruiterPhotoUrl ? (
                      <img
                        src={chat.recruiterPhotoUrl}
                        alt={chat.recruiterName}
                        className="w-10 h-10 rounded-2xl object-cover shrink-0 border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-xs"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-2xl bg-[#00BFA6] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                        {chat.recruiterName ? chat.recruiterName.charAt(0).toUpperCase() : 'R'}
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-bold text-xs text-[#1F2D3D] dark:text-white truncate">
                          {chat.recruiterName}
                        </p>
                        <span className="text-[10px] text-[#8CA6B7] shrink-0 font-medium">
                          {formatChatDate(chat.lastMessageTime)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-[#6B8699] dark:text-[#8CA6B7] font-medium truncate">
                        <Building2 className="w-3 h-3 shrink-0 text-[#8CA6B7]" />
                        <span className="truncate">{chat.companyName}</span>
                        {chat.jobRole && (
                          <>
                            <span>•</span>
                            <span className="truncate text-[#1F2D3D] dark:text-[#BACDD8]">{chat.jobRole}</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <p
                          className={`text-xs truncate ${
                            unread > 0
                              ? 'font-bold text-[#1F2D3D] dark:text-white'
                              : 'text-[#6B8699] dark:text-[#8CA6B7]'
                          }`}
                        >
                          {chat.decryptedLastMessage || 'Encrypted conversation...'}
                        </p>
                        {unread > 0 && (
                          <span className="w-5 h-5 rounded-full bg-[#00BFA6] text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-xs">
                            {unread > 99 ? '99+' : unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation Stream (8 Cols on desktop; full width on mobile when chat open) */}
        <div
          className={`lg:col-span-8 flex flex-col h-full bg-white dark:bg-[#0E2233] min-w-0 ${
            activeChatId ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {activeChatId ? (
            <>
              {/* Active Chat Header */}
              <div className="p-3.5 sm:p-4 border-b border-[#D8E4EA] dark:border-[#1F2D3D] flex items-center justify-between bg-white dark:bg-[#0E2233] min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Back button on mobile */}
                  <button
                    type="button"
                    onClick={() => setActiveChatId(null)}
                    className="p-1.5 -ml-1 rounded-xl text-[#6B8699] hover:text-[#1F2D3D] dark:hover:text-white hover:bg-[#E8F1F5] dark:hover:bg-[#332F34] lg:hidden transition"
                    aria-label="Back to conversations"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {activeChat.recruiterPhotoUrl ? (
                    <img
                      src={activeChat.recruiterPhotoUrl}
                      alt={activeChat.recruiterName}
                      className="w-10 h-10 rounded-2xl object-cover shrink-0 border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-xs"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-[#00BFA6] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                      {activeChat.recruiterName ? activeChat.recruiterName.charAt(0).toUpperCase() : 'R'}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-[#1F2D3D] dark:text-white truncate">
                      {activeChat.recruiterName}
                    </h3>
                    <p className="text-[11px] text-[#6B8699] dark:text-[#8CA6B7] font-medium truncate flex items-center gap-1.5">
                      <span>{activeChat.companyName}</span>
                      {activeChat.jobRole && (
                        <>
                          <span>•</span>
                          <span className="text-[#1F2D3D] dark:text-[#BACDD8] font-semibold">{activeChat.jobRole}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {activeChat.jobId && (
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.JOB_DETAILS.replace(':jobId', activeChat.jobId))}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#1F2D3D] dark:text-[#E8F1F5] bg-[#E8F1F5] dark:bg-[#332F34] hover:bg-[#D8E4EA] dark:hover:bg-[#1F2D3D] rounded-xl transition shrink-0"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">View Job</span>
                    <ExternalLink className="w-3 h-3 text-[#8CA6B7] ml-0.5" />
                  </button>
                )}
              </div>

              {/* Message History Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#E8F1F5]/30 dark:bg-[#0A1A27]/60 min-w-0">
                {loadingMessages ? (
                  <div className="h-full flex flex-col items-center justify-center text-xs text-[#8CA6B7] gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#00BFA6]" />
                    <span>Loading messages...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-xs text-[#8CA6B7] space-y-2 p-6 text-center">
                    <ShieldCheck className="w-8 h-8 text-[#00BFA6]" />
                    <p className="font-bold text-[#1F2D3D] dark:text-[#E8F1F5]">
                      Encrypted Chat Channel Established
                    </p>
                    <p className="text-[#6B8699] dark:text-[#8CA6B7] max-w-sm">
                      Send a message below. Messages are encrypted in real time using AES-CTR matching the TalentBay mobile apps and Recruiter platform.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isCandidate = msg.senderId === candidateId;
                    const isCopied = copiedMsgId === msg.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col group ${isCandidate ? 'items-end' : 'items-start'}`}
                      >
                        <div className="relative max-w-[85%] sm:max-w-[70%]">
                          {/* Quick Action Floating Bar on Hover */}
                          <div
                            className={`absolute -top-7 z-10 hidden group-hover:flex items-center gap-1 bg-white dark:bg-[#0E2233] border border-[#D8E4EA] dark:border-[#1F2D3D] rounded-lg shadow-sm px-1.5 py-0.5 text-[#6B8699] dark:text-[#8CA6B7] ${
                              isCandidate ? 'right-0' : 'left-0'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleCopyMessage(msg)}
                              className="p-1 rounded hover:bg-[#E8F1F5] dark:hover:bg-[#332F34] hover:text-[#1F2D3D] dark:hover:text-white transition"
                              title="Copy message"
                            >
                              {isCopied ? <Check className="w-3 h-3 text-[#00BFA6]" /> : <Copy className="w-3 h-3" />}
                            </button>
                            {isCandidate && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(msg)}
                                  className="p-1 rounded hover:bg-[#E8F1F5] dark:hover:bg-[#332F34] hover:text-[#00BFA6] transition"
                                  title="Edit message"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingMessage(msg)}
                                  className="p-1 rounded hover:bg-[#E8F1F5] dark:hover:bg-[#332F34] hover:text-red-500 transition"
                                  title="Delete message"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>

                          {/* Message Bubble */}
                          <div
                            className={`px-4 py-2.5 rounded-2xl shadow-xs text-xs sm:text-sm break-words leading-relaxed max-w-[85%] sm:max-w-[75%] ${
                              isCandidate
                                ? 'bg-[#0E2233] text-white border border-[#00BFA6]/40 rounded-tr-xs'
                                : 'bg-white dark:bg-[#0A1A27] border border-[#D8E4EA] dark:border-[#1F2D3D] text-[#1F2D3D] dark:text-[#E8F1F5] rounded-tl-xs'
                            }`}
                          >
                            <p className="break-words">{msg.decryptedContent || msg.content}</p>

                            <div
                              className={`flex items-center justify-end gap-1.5 text-[10px] mt-1 ${
                                isCandidate ? 'text-white/80' : 'text-[#8CA6B7]'
                              }`}
                            >
                              {msg.isEdited && <span className="italic opacity-80">(edited)</span>}
                              <span>{formatMessageTime(msg.timestamp)}</span>
                              {isCandidate && (
                                <CheckCheck
                                  className={`w-3.5 h-3.5 ${msg.isRead ? 'text-[#E8F1F5]' : 'text-white/60'}`}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer Form */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 sm:p-4 border-t border-[#D8E4EA] dark:border-[#1F2D3D] bg-white dark:bg-[#0E2233] flex items-center gap-2.5 min-w-0"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type an encrypted message..."
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-[#E8F1F5] dark:bg-[#0A1A27] border border-[#D8E4EA] dark:border-[#1F2D3D] rounded-xl text-[#1F2D3D] dark:text-white placeholder:text-[#8CA6B7] focus:outline-none focus:ring-2 focus:ring-[#00BFA6]/20 focus:border-[#00BFA6]"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#0E2233] hover:bg-[#163248] border border-[#00BFA6]/40 hover:border-[#00BFA6] rounded-xl transition shadow-xs disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  {sending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00BFA6]" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-[#00BFA6]" />
                  )}
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-2">
              <MessageSquare className="w-10 h-10 text-[#8CA6B7]" />
              <h3 className="text-base font-bold text-[#1F2D3D] dark:text-[#E8F1F5]">
                Select a Conversation
              </h3>
              <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7] max-w-sm">
                Choose an active recruiter conversation from the list to view real-time encrypted messages.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Message Modal */}
      {editingMessage && (
        <ModalPortal
          isOpen={Boolean(editingMessage)}
          onClose={() => setEditingMessage(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0E2233] rounded-3xl max-w-md w-full p-6 border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-2xl space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1F2D3D] dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#00BFA6]" />
                <span>Edit Message</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingMessage(null)}
                className="text-[#8CA6B7] hover:text-[#1F2D3D] dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              className="w-full p-3 text-sm bg-[#E8F1F5] dark:bg-[#0A1A27] border border-[#D8E4EA] dark:border-[#1F2D3D] rounded-xl text-[#1F2D3D] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#00BFA6]/20 focus:border-[#00BFA6]"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingMessage(null)}
                className="px-4 py-2 text-xs font-semibold text-[#1F2D3D] dark:text-[#BACDD8] hover:bg-[#E8F1F5] dark:hover:bg-[#332F34] rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!editText.trim() || isActionLoading}
                onClick={handleSaveEdit}
                className="px-4 py-2 text-xs font-bold text-white bg-[#0E2233] hover:bg-[#163248] border border-[#00BFA6]/40 hover:border-[#00BFA6] disabled:opacity-50 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00BFA6]" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Delete Message Confirmation Modal */}
      {deletingMessage && (
        <ModalPortal
          isOpen={Boolean(deletingMessage)}
          onClose={() => setDeletingMessage(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0E2233] rounded-3xl max-w-md w-full p-6 border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-2xl space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1F2D3D] dark:text-white">
                  Delete Message?
                </h3>
                <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7] mt-0.5">
                  Are you sure you want to delete this message? This cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#E8F1F5] dark:bg-[#0A1A27] border border-[#D8E4EA] dark:border-[#1F2D3D] text-xs text-[#1F2D3D] dark:text-[#BACDD8] italic line-clamp-3">
              "{deletingMessage.decryptedContent || deletingMessage.content}"
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingMessage(null)}
                className="px-4 py-2 text-xs font-semibold text-[#1F2D3D] dark:text-[#BACDD8] hover:bg-[#E8F1F5] dark:hover:bg-[#332F34] rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Message</span>
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};
