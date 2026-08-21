// import { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
// import { DashboardLayout } from '@/components/layout/DashboardLayout';
// import { EmptyState } from '@/components/ui/EmptyState';
// import { SkeletonList } from '@/components/ui/Skeleton';
// import { useAppSelector } from '@/hooks/useAppRedux';
// import { listConversations } from '@/services/chatApi';
// import type { ConversationSummary } from '@/services/chatApi';

// export default function MessagesInboxPage() {
//   const user = useAppSelector((s) => s.auth.user);
//   const [conversations, setConversations] = useState<ConversationSummary[]>([]);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     listConversations()
//       .then((res) => setConversations(res.data.conversations))
//       .finally(() => setIsLoading(false));
//   }, []);

//   return (
//     <DashboardLayout>
//       <h1 className="font-display text-2xl font-semibold text-ink">Messages</h1>
//       <p className="mt-1 text-sm text-slate">Conversations tied to your bookings.</p>

//       <div className="mt-6 flex flex-col gap-3">
//         {isLoading ? (
//           <SkeletonList count={3} className="h-20 rounded-2xl" />
//         ) : conversations.length === 0 ? (
//           <EmptyState
//             title="No conversations yet"
//             description="Once you book a vehicle (or receive a booking), a message thread with the other side appears here."
//           />
//         ) : (
//           conversations.map((c) => {
//             const other = c.participants.find((p) => p._id !== user?._id);
//             return (
//               <Link
//                 key={c._id}
//                 to={c.booking ? `/bookings/${c.booking._id}` : '#'}
//                 className="flex items-center justify-between rounded-2xl border border-paper-line bg-paper-soft p-4 transition-shadow hover:shadow-md"
//               >
//                 <div>
//                   <p className="text-sm font-medium text-ink">{other?.name || 'Conversation'}</p>
//                   <p className="mt-0.5 text-xs text-slate line-clamp-1">
//                     {c.lastMessagePreview || 'No messages yet'}
//                   </p>
//                   {c.booking && <p className="mt-0.5 text-xs text-slate">{c.booking.bookingCode}</p>}
//                 </div>
//                 {c.lastMessageAt && (
//                   <span className="text-xs text-slate">
//                     {new Date(c.lastMessageAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
//                   </span>
//                 )}
//               </Link>
//             );
//           })
//         )}
//       </div>
//     </DashboardLayout>
//   );
// }




import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useAppSelector } from '@/hooks/useAppRedux';
import { listConversations } from '@/services/chatApi';
import type { ConversationSummary } from '@/services/chatApi';

export default function MessagesInboxPage() {
  const user = useAppSelector((s) => s.auth.user);

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    listConversations()
      .then((res) => setConversations(res.data.conversations))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredConversations = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) return conversations;

    return conversations.filter((conversation) => {
      const otherUser = conversation.participants.find(
        (participant) => participant._id !== user?._id
      );

      return (
        otherUser?.name?.toLowerCase().includes(searchText) ||
        conversation.lastMessagePreview?.toLowerCase().includes(searchText) ||
        conversation.booking?.bookingCode?.toLowerCase().includes(searchText)
      );
    });
  }, [conversations, search, user?._id]);

  const getInitials = (name?: string) => {
    if (!name) return 'D';

    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const formatMessageDate = (date?: string) => {
    if (!date) return '';

    const messageDate = new Date(date);
    const today = new Date();

    const isToday =
      messageDate.getDate() === today.getDate() &&
      messageDate.getMonth() === today.getMonth() &&
      messageDate.getFullYear() === today.getFullYear();

    if (isToday) {
      return messageDate.toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
      });
    }

    return messageDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-6xl">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-r from-[#5b2c6f] via-[#7c3f8c] to-[#a55cb7] px-6 py-7 shadow-xl sm:px-8">
          {/* Background decorative circles */}
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-14 right-32 h-40 w-40 rounded-full bg-[#ffc857]/20 blur-2xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl shadow-lg backdrop-blur">
                  💬
                </div>

                <div>
                  <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
                    Messages
                  </h1>

                  <p className="mt-1 text-sm text-white/80">
                    Stay connected with vehicle owners and customers.
                  </p>
                </div>
              </div>
            </div>

            <div className="w-fit rounded-2xl border border-white/20 bg-white/15 px-5 py-3 backdrop-blur-md">
              <p className="text-xs font-medium uppercase tracking-wider text-white/70">
                Conversations
              </p>

              <p className="mt-1 text-2xl font-bold text-white">
                {conversations.length}
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mt-6 rounded-3xl border border-paper-line bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="relative">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" strokeLinecap="round" />
            </svg>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, message, or booking ID..."
              className="h-13 w-full rounded-2xl border border-paper-line bg-[#faf8fc] py-3 pl-12 pr-4 text-sm text-ink outline-none transition-all duration-300 placeholder:text-slate/70 focus:border-[#8b4d9b] focus:bg-white focus:ring-4 focus:ring-[#8b4d9b]/10"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="mt-6 overflow-hidden rounded-3xl border border-paper-line bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-paper-line bg-[#fcf9fd] px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-ink">
                Your conversations
              </h2>

              <p className="mt-0.5 text-xs text-slate">
                Select a conversation to view booking messages.
              </p>
            </div>

            {!isLoading && conversations.length > 0 && (
              <span className="rounded-full bg-[#8b4d9b]/10 px-3 py-1 text-xs font-semibold text-[#6d367c]">
                {filteredConversations.length} shown
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="p-5">
              <SkeletonList
                count={5}
                className="h-24 rounded-2xl"
              />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex min-h-[380px] flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#f3dff6] to-[#ead7ee] text-4xl shadow-inner">
                💬
              </div>

              <h3 className="mt-6 text-xl font-bold text-ink">
                No conversations yet
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate">
                When you book a vehicle, you can communicate with the vehicle
                owner directly from this section.
              </p>

              <Link
                to="/vehicles"
                className="mt-6 rounded-xl bg-gradient-to-r from-[#7c3f8c] to-[#9a55aa] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                Explore vehicles
              </Link>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-10 text-center">
              <div className="text-5xl">🔎</div>

              <h3 className="mt-4 text-lg font-bold text-ink">
                No matching conversations
              </h3>

              <p className="mt-2 text-sm text-slate">
                Try searching with another name or booking ID.
              </p>

              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-5 rounded-xl border border-[#8b4d9b]/20 bg-[#8b4d9b]/5 px-5 py-2.5 text-sm font-semibold text-[#6d367c] transition hover:bg-[#8b4d9b]/10"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="divide-y divide-paper-line">
              {filteredConversations.map((conversation) => {
                const otherUser = conversation.participants.find(
                  (participant) => participant._id !== user?._id
                );

                const otherUserName =
                  otherUser?.name || 'DriveHub User';

                return (
                  <Link
                    key={conversation._id}
                    to={
                      conversation.booking
                        ? `/bookings/${conversation.booking._id}`
                        : '#'
                    }
                    className="group flex items-center gap-4 px-5 py-5 transition-all duration-300 hover:bg-[#faf5fc]"
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3f8c] to-[#b46bc3] text-base font-bold text-white shadow-md transition-transform duration-300 group-hover:scale-105">
                        {getInitials(otherUserName)}
                      </div>

                      <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
                    </div>

                    {/* Message content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="truncate text-sm font-bold text-ink">
                          {otherUserName}
                        </h3>

                        <span className="shrink-0 text-xs font-medium text-slate">
                          {formatMessageDate(
                            conversation.lastMessageAt
                          )}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-2">
                        <p className="truncate text-sm text-slate">
                          {conversation.lastMessagePreview ||
                            'Start your conversation about the booking.'}
                        </p>
                      </div>

                      {conversation.booking && (
                        <div className="mt-2">
                          <span className="inline-flex rounded-full bg-[#8b4d9b]/10 px-2.5 py-1 text-[11px] font-semibold text-[#6d367c]">
                            Booking #{conversation.booking.bookingCode}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Open arrow */}
                    <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8b4d9b]/5 text-[#7c3f8c] transition-all duration-300 group-hover:translate-x-1 group-hover:bg-[#8b4d9b] group-hover:text-white sm:flex">
                      →
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}