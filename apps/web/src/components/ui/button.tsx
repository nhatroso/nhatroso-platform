import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'link'
    | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    const variants = {
      primary: 'bg-black text-white hover:bg-black/90 active:scale-[0.98]',
      secondary:
        'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 active:scale-[0.98]',
      outline:
        'border border-zinc-200 bg-transparent hover:bg-zinc-50 active:scale-[0.98]',
      ghost: 'hover:bg-zinc-100 text-zinc-700',
      link: 'text-zinc-900 underline-offset-4 hover:underline',
      destructive: 'bg-red-500 text-white hover:bg-red-600 active:scale-[0.98]',
    };

    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 px-3 text-xs',
      lg: 'h-11 px-8 text-base',
      icon: 'h-10 w-10',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button };
