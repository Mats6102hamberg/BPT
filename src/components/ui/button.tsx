import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-semibold transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/40 hover:shadow-xl hover:shadow-blue-500/50 hover:-translate-y-0.5':
              variant === 'primary',
            'bg-gradient-to-r from-slate-200 to-slate-300 text-slate-900 shadow-md hover:from-slate-300 hover:to-slate-400 hover:-translate-y-0.5':
              variant === 'secondary',
            'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/40 hover:shadow-xl hover:shadow-red-500/50 hover:-translate-y-0.5':
              variant === 'danger',
            'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/50 hover:-translate-y-0.5':
              variant === 'success',
            'hover:bg-slate-100 text-slate-700': variant === 'ghost',
          },
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-6 py-3 text-base': size === 'md',
            'px-8 py-4 text-lg': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
