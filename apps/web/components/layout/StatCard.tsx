import { cn } from '@repo/ui/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  className?: string;
  highlight?: boolean;
}

const StatCard = ({ label, value, icon: Icon, className, highlight }: StatCardProps) => {
  return (
    <div
      className={cn(
        'bg-card/80 group relative overflow-hidden rounded-2xl border border-white/10 p-5 backdrop-blur-sm transition-colors duration-200 hover:border-primary/25',
        highlight && 'border-primary/20 bg-primary/[0.03]',
        className,
      )}
    >
      <div className='from-primary/8 pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100' />
      <div className='relative space-y-3'>
        <div className='text-muted-foreground flex items-center gap-2 text-sm'>
          <div className='bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg'>
            <Icon className='h-4 w-4' />
          </div>
          {label}
        </div>
        <p className='font-serif-accent text-4xl tracking-tight'>{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
