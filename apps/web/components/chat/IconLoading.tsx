import { cn } from '@repo/ui/lib/utils';
import { ChatStatus } from 'ai';
import Image from 'next/image';

type IconLoadingProps = {
  status: ChatStatus;
  isLast: boolean;
};
const IconLoading = ({ status, isLast }: IconLoadingProps) => {
  const shouldAnimate = (status === 'streaming' || status === 'submitted') && isLast;
  return (
    <div className='mt-2 flex max-w-full items-center gap-3'>
      <div className='relative flex items-center justify-center'>
        {shouldAnimate && <div className='bg-primary/20 absolute size-8 animate-ping rounded-full' />}
        <Image
          src='/images/logo.webp'
          alt='AI'
          width={500}
          height={500}
          className={cn('size-6 dark:grayscale dark:invert', shouldAnimate && 'animate-spin-recoil')}
        />
      </div>
      <style jsx>{`
        @keyframes spin-recoil {
          0% {
            transform: rotate(0deg);
          }
          60% {
            transform: rotate(360deg);
          }
          75% {
            transform: rotate(345deg);
          }
          90% {
            transform: rotate(355deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        :global(.animate-spin-recoil) {
          animation: spin-recoil 1.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default IconLoading;
