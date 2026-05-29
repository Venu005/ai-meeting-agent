import { Bot } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@repo/ui/lib/utils';

interface AppLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md';
  href?: string;
}

const AppLogo = ({ className, showText = true, size = 'md', href = '/dashboard' }: AppLogoProps) => {
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const boxSize = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';

  return (
    <Link href={href} className={cn('group flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'bg-primary text-primary-foreground flex shrink-0 items-center justify-center rounded-lg shadow-sm transition-colors duration-200 group-hover:bg-primary/90',
          boxSize,
        )}
      >
        <Bot className={iconSize} />
      </div>
      {showText && (
        <span className={cn('font-semibold tracking-tight', size === 'sm' ? 'text-sm' : 'text-base')}>Meetra</span>
      )}
    </Link>
  );
};

export default AppLogo;
