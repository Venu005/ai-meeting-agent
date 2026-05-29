'use client';

import { useRouter } from 'next/navigation';
import { ChatHistory } from '@/components/chat/ChatHistory';
import { Button } from '@repo/ui/components/button';
import { PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui/components/tooltip';
import { useIsMobile } from '@repo/ui/hooks/use-mobile';
import { useEffect } from 'react';

interface ChatSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

export function ChatSidebar({ isCollapsed, setIsCollapsed }: ChatSidebarProps) {
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobile && !isCollapsed) {
        setIsCollapsed(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, isCollapsed, setIsCollapsed]);

  return (
    <>
      {isMobile && !isCollapsed && (
        <div
          className='fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out'
          onClick={() => setIsCollapsed(true)}
        />
      )}
      <div
        className={cn(
          'bg-background flex h-full shrink-0 flex-col overflow-hidden transition-all duration-500 ease-in-out',
          isMobile && 'absolute inset-0 z-50 h-dvh',
          isMobile ? (!isCollapsed ? 'w-[80%]' : 'w-0') : isCollapsed ? 'w-0' : 'w-1/4 max-w-xs border-r border-l',
        )}
      >
        <div className={cn('flex items-center px-4 py-2', isCollapsed ? 'justify-center' : 'justify-between')}>
          {!isCollapsed && <h2 className='text-sm font-semibold'>Chat History</h2>}
          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setIsCollapsed(!isCollapsed)}
                className='h-8 w-8 shrink-0'
              >
                {isCollapsed ? <ChevronLeft className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side='left'>
              <p>{isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {!isCollapsed && <div className='mx-4 border-b' />}

        <div className={cn('flex items-center py-2', isCollapsed ? 'justify-center' : 'justify-between px-4')}>
          {isCollapsed ? (
            <Tooltip delayDuration={500}>
              <TooltipTrigger asChild>
                <Button onClick={() => router.push('/chat')} size='icon' className='h-10 w-10 rounded-full'>
                  <PlusCircle className='size-5!' />
                </Button>
              </TooltipTrigger>
              <TooltipContent side='left'>
                <p>New Chat</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button onClick={() => router.push('/chat')} className='w-full' size='sm'>
              <PlusCircle className='h-4 w-4' />
              New Chat
            </Button>
          )}
        </div>

        {!isCollapsed && <div className='mx-4 border-b' />}

        <div className='h-full flex-1 overflow-y-auto p-2'>
          <ChatHistory />
        </div>
      </div>
    </>
  );
}
