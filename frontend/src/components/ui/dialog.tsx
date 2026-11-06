/** shadcn/ui-style Dialog on Radix (focus trap, Esc, scroll lock). */
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <DialogPrimitive.Content
          className="fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-2xl border border-line bg-panel p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[min(36rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:pb-5"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <DialogPrimitive.Title className="text-xl font-bold">{title}</DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-1 text-sm text-muted">{description}</DialogPrimitive.Description>
              ) : (
                <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close className="rounded-md p-1 text-muted hover:bg-raised hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" aria-label="Zavřít">
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
