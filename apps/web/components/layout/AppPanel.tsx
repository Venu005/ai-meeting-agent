import { cn } from '@repo/ui/lib/utils';

interface AppPanelProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

const AppPanel = ({ children, className, glow }: AppPanelProps) => {
  return (
    <div
      className={cn(
        'bg-card/80 rounded-2xl border border-white/10 backdrop-blur-sm',
        glow && 'shadow-[0_0_0_1px_rgba(222,219,200,0.08),0_8px_32px_rgba(0,0,0,0.4)]',
        className,
      )}
    >
      {children}
    </div>
  );
};

export default AppPanel;
