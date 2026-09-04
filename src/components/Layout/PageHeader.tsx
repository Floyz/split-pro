import {
  ChartPieIcon,
  ListBulletIcon,
  PlusCircleIcon,
  UserCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/solid';
import { Repeat } from 'lucide-react';
import React from 'react';

type HeaderIcon = React.ComponentType<{ className?: string }>;

/**
 * Custom fork: icon per top-level tab, keyed by the first segment of `router.pathname` so dynamic
 * routes (`/groups/[groupId]`) inherit their tab icon. Mirrors the bottom navigation icons.
 */
const PAGE_ICONS: Record<string, HeaderIcon> = {
  account: UserCircleIcon,
  activity: ListBulletIcon,
  add: PlusCircleIcon,
  balances: ChartPieIcon,
  groups: UserGroupIcon,
  recurring: Repeat,
};

const getPageIcon = (pathname: string): HeaderIcon | undefined =>
  PAGE_ICONS[pathname.split('/')[1] ?? ''];

interface PageHeaderProps {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  currentPath: string;
}

/** Page title band: tab icon in a tinted tile, title, actions, and a hairline under the whole band. */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, actions, currentPath }) => {
  if (!title) {
    return null;
  }

  // Sub-pages pass JSX titles that already start with a back chevron: keep the band, skip the icon.
  const Icon = 'string' === typeof title ? getPageIcon(currentPath) : undefined;

  return (
    <div className="border-border mb-2 flex items-center justify-between gap-3 border-b px-4 py-4">
      <div className="flex min-w-0 items-center gap-3">
        {Icon ? (
          <span className="bg-primary/15 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
            <Icon className="size-6" />
          </span>
        ) : null}
        <div className="text-foreground min-w-0 text-3xl font-bold">{title}</div>
      </div>
      {actions}
    </div>
  );
};
