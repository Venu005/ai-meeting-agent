import { SidebarMenuAction, SidebarMenuButton, SidebarMenuItem } from '@repo/ui/components/sidebar';
import Link from 'next/link';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { memo } from 'react';
import { ChatType } from '@repo/shared-types/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';

const PureChatItem = ({
  chat,
  isActive,
  onEdit,
  onDelete,
  setOpenMobile,
}: {
  chat: ChatType;
  isActive: boolean;
  onEdit: () => void;
  onDelete: () => void;
  setOpenMobile: (open: boolean) => void;
}) => {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={`/chat/${chat.id}`} onClick={() => setOpenMobile(false)}>
          <span>{chat.title}</span>
        </Link>
      </SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction>
            <MoreHorizontal className='size-4' />
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side='right' align='start'>
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className='size-4' />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete}>
            <Trash2 className='text-destructive size-4' />
            <span className='text-destructive'>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export const ChatItem = memo(PureChatItem);
