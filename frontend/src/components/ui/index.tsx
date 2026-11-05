import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pitch',
  {
    variants: {
      variant: {
        primary: 'bg-pitch text-pitch-ink hover:bg-pitch/90',
        outline: 'border border-line bg-transparent text-ink hover:bg-raised',
        ghost: 'text-muted hover:text-ink hover:bg-raised',
      },
      size: { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4 text-[0.95rem]' },
    },
    defaultVariants: { variant: 'outline', size: 'md' },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = 'Button';

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('rounded-xl border border-line bg-panel', className)}>{children}</section>;
}

export function Spinner() {
  return <div className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-pitch" role="status" aria-label="Načítání" />;
}

export function ErrorNote({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : 'Něco se nepovedlo.';
  return <p className="rounded-md border border-card-red/40 bg-card-red/10 px-3 py-2 text-sm text-card-red">{message}</p>;
}
