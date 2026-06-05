import { cn } from '@repo/ui/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: React.ReactNode;
  className?: string;
}

const PageHeader = ({ title, description, eyebrow, action, className }: PageHeaderProps) => {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <div className='space-y-2'>
        {eyebrow && <p className='app-section-label'>{eyebrow}</p>}
        <h1 className='font-serif-accent text-3xl tracking-tight md:text-4xl'>{title}</h1>
        {description && <p className='text-muted-foreground max-w-2xl text-sm md:text-base'>{description}</p>}
      </div>
      {action && <div className='flex shrink-0 items-center gap-2'>{action}</div>}
    </div>
  );
};

export default PageHeader;
