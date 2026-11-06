import { ChevronDown, LogIn, LogOut, UserRound } from 'lucide-react';
import type { Member } from '@/lib/types';
import { membershipLabel } from '@/lib/access';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogout, useSignIn } from '@/app/queries';

export function AccountMenu({ member, accountUrl }: { member: Member | null; accountUrl: string | null }) {
  const signIn = useSignIn();
  const logout = useLogout();

  if (!member) {
    return (
      <button
        type="button"
        onClick={() => signIn.mutate({})}
        disabled={signIn.isPending}
        className="inline-flex h-9 items-center gap-2 rounded-md px-2 text-sm font-bold uppercase tracking-wide hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <LogIn className="h-4 w-4" /> Přihlásit
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-sm font-bold uppercase tracking-wide hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent data-[state=open]:text-accent">
        {member.name}
        <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <span className="block font-semibold">{member.name}</span>
          {member.email && <span className="block truncate text-xs font-normal text-muted">{member.email}</span>}
          {member.teams.length > 0 && (
            <span className="mt-1.5 block text-xs font-normal text-muted">
              {member.teams.map((t) => `${t.name} (${membershipLabel(t.membership)})`).join(', ')}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {accountUrl && (
          <DropdownMenuItem asChild>
            <a href={accountUrl}>
              <UserRound className="h-4 w-4 text-muted" /> Klubový účet
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem disabled={logout.isPending} onSelect={() => logout.mutate()}>
          <LogOut className="h-4 w-4 text-muted" /> Odhlásit se
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
