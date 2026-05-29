'use client';

import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { SidebarGroup, SidebarGroupContent, SidebarMenu, useSidebar } from '@repo/ui/components/sidebar';
import { ChatItem } from './ChatItem';
import useSWRInfinite from 'swr/infinite';
import { ChatType } from '@repo/shared-types/types';
import { ChatService, GetChatsResponse } from '@/services';
import { LoaderIcon } from 'lucide-react';
import { useDeleteChat } from '@/queries/chat';
import { CustomAlertDialog } from '../general/CustomAlertDialog';
import EditChatDialog from './EditChatDialog';

type GroupedChats = {
  today: ChatType[];
  yesterday: ChatType[];
  lastWeek: ChatType[];
  lastMonth: ChatType[];
  older: ChatType[];
};

const groupChatsByDate = (chats: ChatType[]): GroupedChats => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return chats.reduce(
    (groups, chat) => {
      const chatDate = new Date(chat.createdAt);

      if (isToday(chatDate)) {
        groups.today.push(chat);
      } else if (isYesterday(chatDate)) {
        groups.yesterday.push(chat);
      } else if (chatDate > oneWeekAgo) {
        groups.lastWeek.push(chat);
      } else if (chatDate > oneMonthAgo) {
        groups.lastMonth.push(chat);
      } else {
        groups.older.push(chat);
      }

      return groups;
    },
    {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    } as GroupedChats,
  );
};

export function getChatHistoryPaginationKey(pageIndex: number, previousPageData: GetChatsResponse) {
  if (previousPageData && previousPageData.pagination.hasNextPage === false) {
    return null;
  }

  if (pageIndex === 0) return '1';

  return String(pageIndex + 1);
}

export function ChatHistory() {
  const { setOpenMobile } = useSidebar();
  const { id } = useParams();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const {
    data: paginatedChatHistories,
    setSize,
    isValidating,
    isLoading,
    mutate,
  } = useSWRInfinite<GetChatsResponse>(
    getChatHistoryPaginationKey,
    async (page) => {
      const res = await ChatService.getChats({
        limit: 10,
        page: Number(page),
      });
      if (res) {
        return res;
      } else {
        return {
          chats: [],
          pagination: {
            hasNextPage: false,
            hasPreviousPage: false,
            totalPages: 0,
            totalItems: 0,
            limit: 10,
            page: 1,
            total: 0,
          },
        };
      }
    },
    {
      fallbackData: [],
      revalidateFirstPage: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      persistSize: true,
    },
  );

  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editChat, setEditChat] = useState<ChatType | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const hasReachedEnd = paginatedChatHistories
    ? paginatedChatHistories.some((page) => page.pagination.hasNextPage === false)
    : false;

  const hasEmptyChatHistory = paginatedChatHistories
    ? paginatedChatHistories.every((page) => page.chats.length === 0)
    : false;

  const { mutate: deleteChat, isPending: isDeletingChat } = useDeleteChat();

  const handleDelete = () => {
    if (!deleteId) return;
    deleteChat(deleteId, {
      onSuccess: () => {
        mutate((chatHistories) => {
          if (chatHistories) {
            return chatHistories.map((chatHistory) => ({
              ...chatHistory,
              chats: chatHistory.chats.filter((chat) => chat.id !== deleteId),
            }));
          }
        });
        setShowDeleteDialog(false);
        setDeleteId(null);
        if (deleteId === id) {
          router.push('/chat');
        }
      },
    });
  };

  useEffect(() => {
    if (!loadMoreRef.current || hasReachedEnd || isValidating) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isValidating && !hasReachedEnd) {
          setSize((size) => size + 1);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px', // Start loading 100px before the element is visible
      },
    );

    observer.observe(loadMoreRef.current);

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasReachedEnd, isValidating, setSize]);

  if (isLoading) {
    return (
      <SidebarGroup>
        <div className='text-sidebar-foreground/50 px-2 py-1 text-xs'>Today</div>
        <SidebarGroupContent>
          <div className='flex flex-col'>
            {[44, 32, 28, 64, 52].map((item) => (
              <div key={item} className='flex h-8 items-center gap-2 rounded-md px-2'>
                <div
                  className='bg-sidebar-accent-foreground/10 h-4 max-w-[--skeleton-width] flex-1 rounded-md'
                  style={
                    {
                      '--skeleton-width': `${item}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (hasEmptyChatHistory) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className='text-muted-foreground flex w-full flex-row items-center justify-center gap-2 px-2 text-sm'>
            Your conversations will appear here once you start chatting!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {paginatedChatHistories &&
              (() => {
                const chatsFromHistory = paginatedChatHistories.flatMap(
                  (paginatedChatHistory) => paginatedChatHistory.chats,
                );

                const uniqueChats = Array.from(new Map(chatsFromHistory.map((chat) => [chat.id, chat])).values());

                const groupedChats = groupChatsByDate(uniqueChats);

                return (
                  <div className='flex flex-col gap-2'>
                    {groupedChats.today.length > 0 && (
                      <div>
                        <div className='text-sidebar-foreground/50 px-2 py-1 text-xs font-medium'>Today</div>
                        {groupedChats.today.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            onEdit={() => {
                              setEditChat(chat);
                              setShowEditDialog(true);
                            }}
                            isActive={chat.id === id}
                            onDelete={() => {
                              setDeleteId(chat.id);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </div>
                    )}

                    {groupedChats.yesterday.length > 0 && (
                      <div>
                        <div className='text-sidebar-foreground/50 px-2 py-1 text-xs font-medium'>Yesterday</div>
                        {groupedChats.yesterday.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            onEdit={() => {
                              setEditChat(chat);
                              setShowEditDialog(true);
                            }}
                            isActive={chat.id === id}
                            onDelete={() => {
                              setDeleteId(chat.id);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </div>
                    )}

                    {groupedChats.lastWeek.length > 0 && (
                      <div>
                        <div className='text-sidebar-foreground/50 px-2 py-1 text-xs font-medium'>Last 7 days</div>
                        {groupedChats.lastWeek.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            onEdit={() => {
                              setEditChat(chat);
                              setShowEditDialog(true);
                            }}
                            isActive={chat.id === id}
                            onDelete={() => {
                              setDeleteId(chat.id);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </div>
                    )}

                    {groupedChats.lastMonth.length > 0 && (
                      <div>
                        <div className='text-sidebar-foreground/50 px-2 py-1 text-xs font-medium'>Last 30 days</div>
                        {groupedChats.lastMonth.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            onEdit={() => {
                              setEditChat(chat);
                              setShowEditDialog(true);
                            }}
                            onDelete={() => {
                              setDeleteId(chat.id);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </div>
                    )}

                    {groupedChats.older.length > 0 && (
                      <div>
                        <div className='text-sidebar-foreground/50 px-2 py-1 text-xs font-medium'>
                          Older than last month
                        </div>
                        {groupedChats.older.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            onEdit={() => {
                              setEditChat(chat);
                              setShowEditDialog(true);
                            }}
                            onDelete={() => {
                              setDeleteId(chat.id);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
          </SidebarMenu>

          <div ref={loadMoreRef} className='h-10 w-full' />

          {hasReachedEnd ? (
            <div className='flex w-full flex-row items-center justify-center gap-2 px-2 text-sm text-zinc-500'>
              You have reached the end of your chat history.
            </div>
          ) : (
            <div className='flex flex-row items-center gap-2 p-2 text-zinc-500 dark:text-zinc-400'>
              <div className='animate-spin'>
                <LoaderIcon />
              </div>
              <div>Loading Chats...</div>
            </div>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      {editChat && showEditDialog && (
        <EditChatDialog
          chat={editChat}
          isOpen={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setEditChat(null);
          }}
        />
      )}
      <CustomAlertDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        isLoading={isDeletingChat}
        title='Delete Chat'
        description='Are you sure you want to delete this chat? This action cannot be undone.'
        cancelText='Cancel'
        confirmText='Delete'
      />
    </>
  );
}
