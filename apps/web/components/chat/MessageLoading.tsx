import React from 'react';
import ShinyText from '@/components/ShinyText';
import IconLoading from './IconLoading';

type MessageLoadingProps = {
  isLast: boolean;
};

const MessageLoading = ({ isLast }: MessageLoadingProps) => {
  return (
    <div className='flex max-w-full items-center justify-start gap-3'>
      <IconLoading status='streaming' isLast={isLast} />
      <ShinyText text='AI is thinking...' className='font-medium' />
    </div>
  );
};

export default MessageLoading;
