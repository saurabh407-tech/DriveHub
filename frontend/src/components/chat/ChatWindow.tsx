import { useCallback, useEffect, useRef, useState } from 'react';
import { getSocket } from '@/services/socket';
import { listMessages, markConversationRead } from '@/services/chatApi';
import type { ChatMessage } from '@/services/chatApi';
import { useAppSelector } from '@/hooks/useAppRedux';

export function ChatWindow({ conversationId }: { conversationId: string }) {
  const user = useAppSelector((s) => s.auth.user);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    let cancelled = false;
    listMessages(conversationId)
      .then((res) => {
        if (cancelled) return;
        setMessages(res.data.messages);
        markConversationRead(conversationId).catch(() => {});
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('join_conversation', conversationId);

    const onNewMessage = (message: ChatMessage) => {
      if (message.conversation !== conversationId) return;
      setMessages((prev) => [...prev, message]);
      if (typeof message.sender === 'object' && message.sender._id !== user?._id) {
        markConversationRead(conversationId).catch(() => {});
      }
    };

    const onTyping = ({ isTyping }: { userId: string; isTyping: boolean }) => {
      setOtherTyping(isTyping);
    };

    socket.on('new_message', onNewMessage);
    socket.on('typing', onTyping);

    return () => {
      socket.emit('leave_conversation', conversationId);
      socket.off('new_message', onNewMessage);
      socket.off('typing', onTyping);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const onDraftChange = (value: string) => {
    setDraft(value);
    const socket = getSocket();
    socket.emit('typing', { conversationId, isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { conversationId, isTyping: false });
    }, 1500);
  };

  const onSend = () => {
    const text = draft.trim();
    if (!text) return;
    setIsSending(true);
    const socket = getSocket();
    socket.emit('send_message', { conversationId, text }, (res: { success: boolean; error?: string }) => {
      setIsSending(false);
      if (res.success) setDraft('');
    });
  };

  return (
    <div className="flex h-[28rem] flex-col rounded-2xl border border-paper-line bg-paper-soft">
      <div className="flex-1 overflow-y-auto p-4" role="log" aria-live="polite" aria-label="Conversation messages">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-xs text-slate">Loading conversation…</div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-slate">
            No messages yet — say hello.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((m) => {
              const senderId = typeof m.sender === 'object' ? m.sender._id : m.sender;
              const mine = senderId === user?._id;
              return (
                <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                      mine ? 'bg-ink text-paper' : 'bg-ink/5 text-ink'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>
                    <p className={`mt-1 text-[10px] ${mine ? 'text-mist' : 'text-slate'}`}>
                      {new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {otherTyping && (
        <p className="px-4 pb-1 text-xs text-slate" role="status" aria-live="polite">
          Typing…
        </p>
      )}

      <div className="flex items-center gap-2 border-t border-paper-line p-3">
        <input
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Write a message…"
          aria-label="Write a message"
          className="flex-1 rounded-lg border border-paper-line bg-paper px-3.5 py-2 text-sm text-ink placeholder:text-slate/60 focus:outline-none focus:ring-2 focus:ring-route/40 focus:border-route"
        />
        <button
          onClick={onSend}
          disabled={isSending || !draft.trim()}
          className="rounded-lg bg-route px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
