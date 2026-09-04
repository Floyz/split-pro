import { type LucideIcon } from 'lucide-react';
import React from 'react';

import { cn } from '~/lib/utils';

type HeroCardTone = 'accent' | 'positive' | 'negative' | 'muted';

const TONE_CLASSES: Record<HeroCardTone, { card: string; icon: string }> = {
  accent: {
    card: 'from-primary/25 via-primary/10 to-secondary bg-linear-to-br',
    icon: 'bg-primary/15 text-primary',
  },
  positive: {
    card: 'from-positive/20 via-positive/5 to-secondary bg-linear-to-br',
    icon: 'bg-positive/15 text-positive',
  },
  negative: {
    card: 'from-negative/20 via-negative/5 to-secondary bg-linear-to-br',
    icon: 'bg-negative/15 text-negative',
  },
  muted: {
    card: 'bg-muted',
    icon: 'bg-background/60 text-muted-foreground',
  },
};

interface HeroCardProps {
  icon: LucideIcon;
  label?: React.ReactNode;
  tone?: HeroCardTone;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Custom fork: accent-tinted summary card (gradient follows the user's accent colour) shared by the
 * balances page and the group balance summary.
 */
export const HeroCard: React.FC<HeroCardProps> = ({
  icon: Icon,
  label,
  tone = 'accent',
  className,
  children,
}) => (
  <div
    className={cn(
      'border-border relative overflow-hidden rounded-2xl border p-4',
      TONE_CLASSES[tone].card,
      className,
    )}
  >
    <Icon aria-hidden className="text-primary/10 absolute -right-4 -bottom-4 size-28" />
    <div className="relative flex items-center gap-2">
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg',
          TONE_CLASSES[tone].icon,
        )}
      >
        <Icon className="size-4" />
      </span>
      {label ? <span className="text-muted-foreground text-sm font-medium">{label}</span> : null}
    </div>
    <div className="relative mt-3">{children}</div>
  </div>
);
