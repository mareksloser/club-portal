import { useState } from 'react';
import { Link as LinkGlyph } from 'lucide-react';
import { parseIcon } from '@/lib/icons';
import { cn } from '@/lib/cn';

/** A link's icon: a curated Lucide glyph or an image URL (falls back to a link glyph if it doesn't load). */
export function LinkIcon({ icon, className }: { icon: string | null; className?: string }) {
  const parsed = parseIcon(icon);
  const [failed, setFailed] = useState(false);

  if (parsed.kind === 'image' && !failed) {
    return <img src={parsed.src} alt="" className={cn('object-contain', className)} onError={() => setFailed(true)} draggable={false} />;
  }
  const Icon = parsed.kind === 'lucide' ? parsed.Icon : LinkGlyph;
  return <Icon className={className} strokeWidth={1.75} aria-hidden="true" />;
}
