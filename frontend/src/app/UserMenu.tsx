import { ChevronDown, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import type { Dashboard } from '@/lib/types';
import { initials } from '@/lib/labels';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogout } from './queries';

export function UserMenu({ dashboard }: { dashboard: Dashboard }) {
  const logout = useLogout();
  const { member, links } = dashboard;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-1.5 hover:bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-pitch data-[state=open]:bg-raised"
        aria-label={`Uživatelské menu: ${member.name}`}
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-raised font-display text-base font-semibold ring-1 ring-line">
          {initials(member.name)}
        </span>
        <ChevronDown className="h-4 w-4 text-muted" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <span className="block text-sm font-medium">{member.name}</span>
          {member.email && <span className="block truncate text-xs font-normal text-muted">{member.email}</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={links.account}>
            <UserRound className="h-4 w-4 text-muted" /> Můj účet a zabezpečení
          </a>
        </DropdownMenuItem>
        {links.admin && (
          <DropdownMenuItem asChild>
            <a href={links.admin}>
              <ShieldCheck className="h-4 w-4 text-muted" /> Správa účtů a rolí
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={logout.isPending} onSelect={() => logout.mutate()}>
          <LogOut className="h-4 w-4 text-muted" /> Odhlásit se
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
