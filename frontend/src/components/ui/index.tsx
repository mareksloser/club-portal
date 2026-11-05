import { cva, type VariantProps } from 'class-variance-authority';
import {
  cloneElement, forwardRef, isValidElement, useId,
  type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactElement, type ReactNode, type SelectHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';

const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const buttonVariants = cva(
  `inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none ${focus}`,
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-ink hover:bg-accent/90',
        outline: 'border border-line text-ink hover:bg-raised',
        ghost: 'text-muted hover:text-ink hover:bg-raised',
        danger: 'border border-danger/50 text-danger hover:bg-danger/10',
      },
      size: { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4', icon: 'h-8 w-8' },
    },
    defaultVariants: { variant: 'outline', size: 'md' },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, type = 'button', ...props }, ref) => (
  <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = 'Button';

const field = `w-full rounded-md border border-line bg-bg px-3 text-ink placeholder:text-muted/70 ${focus} aria-[invalid=true]:border-danger`;

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={cn(field, 'h-10', className)} {...p} />
));
Input.displayName = 'Input';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...p }, ref) => (
  <select ref={ref} className={cn(field, 'h-10 pr-8', className)} {...p} />
));
Select.displayName = 'Select';

/** Label + control + hint/error, linked by id for screen readers. */
export function Field({ label, hint, error, children, className }: { label: string; hint?: ReactNode; error?: string; children: ReactNode; className?: string }) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error ?? hint;
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, { id, 'aria-describedby': note ? noteId : undefined, 'aria-invalid': error ? true : undefined })
    : children;
  return (
    <div className={cn('flex flex-col gap-1.5 text-sm', className)}>
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      {control}
      {note && (
        <span id={noteId} className={cn('text-xs', error ? 'text-danger' : 'text-muted')}>
          {note}
        </span>
      )}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <div className={cn('h-5 w-5 animate-spin rounded-full border-2 border-line border-t-accent', className)} role="status" aria-label="Načítání" />;
}

export function ErrorNote({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : 'Něco se nepovedlo.';
  return <p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{message}</p>;
}
