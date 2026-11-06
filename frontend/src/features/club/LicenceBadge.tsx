import { AlertTriangle, CheckCircle2, CircleSlash, XCircle } from 'lucide-react';
import { LICENCE_LABELS, licenceDetail, type LicenceState } from '@/lib/club';
import { cn } from '@/lib/cn';

const STYLE: Record<LicenceState, { cls: string; Icon: typeof CheckCircle2 }> = {
  expired: { cls: 'border-danger/50 bg-danger/10 text-danger', Icon: XCircle },
  expiring: { cls: 'border-warn/50 bg-warn/10 text-warn', Icon: AlertTriangle },
  missing: { cls: 'border-line text-muted', Icon: CircleSlash },
  valid: { cls: 'border-ok/40 bg-ok/10 text-ok', Icon: CheckCircle2 },
  unlimited: { cls: 'border-ok/40 bg-ok/10 text-ok', Icon: CheckCircle2 },
};

/** Status chip; icon + text, so it doesn't rely on colour alone. */
export function LicenceBadge({ status, className }: { status: LicenceState; className?: string }) {
  const { cls, Icon } = STYLE[status];
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-bold', cls, className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {LICENCE_LABELS[status]}
    </span>
  );
}

export function LicenceLine({ status, daysLeft, validUntil }: { status: LicenceState; daysLeft: number | null; validUntil: string | null }) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <LicenceBadge status={status} />
      <span className="text-muted">{licenceDetail(status, daysLeft, validUntil)}</span>
    </span>
  );
}
