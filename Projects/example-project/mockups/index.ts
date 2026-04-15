/**
 * Finch — example product.
 *
 * This file is the single registration surface for the Finch mockup
 * product. It declares every screen's metadata, the journeys those
 * screens participate in, and the fixtures they consume.
 *
 * Keep screens lazy-loaded. Keep this file side-effect free.
 */

import { defineJourney, defineScreen } from '@framework/defineScreen';
import { lazy } from 'react';
import { allFixtures } from './fixtures';

// Lazy-loaded screen components. Using lazy keeps the initial bundle
// small even as the number of screens grows.
const Overview = lazy(() => import('./screens/Overview').then((m) => ({ default: m.Overview })));
const AccountsList = lazy(() =>
  import('./screens/AccountsList').then((m) => ({ default: m.AccountsList })),
);
const AccountDetail = lazy(() =>
  import('./screens/AccountDetail').then((m) => ({ default: m.AccountDetail })),
);
const TransferInitiate = lazy(() =>
  import('./screens/TransferInitiate').then((m) => ({ default: m.TransferInitiate })),
);
const TransferReview = lazy(() =>
  import('./screens/TransferReview').then((m) => ({ default: m.TransferReview })),
);
const TransferConfirmed = lazy(() =>
  import('./screens/TransferConfirmed').then((m) => ({ default: m.TransferConfirmed })),
);
const Settings = lazy(() => import('./screens/Settings').then((m) => ({ default: m.Settings })));

export const screens = [
  defineScreen({
    id: 'finch.overview',
    title: 'Overview',
    route: '/finch',
    description:
      'Home dashboard. Summarizes balances, recent activity, and surfaces the primary "Send money" action.',
    layoutFamily: 'dashboard',
    viewport: 'responsive',
    journeys: ['finch.daily-check', 'finch.send-money'],
    states: [
      { id: 'populated', label: 'Populated', description: 'Returning user with 3 accounts' },
      { id: 'empty', label: 'Empty', description: 'New user, no linked accounts' },
    ],
    defaultStateId: 'populated',
    fixtures: ['finch.accounts.default', 'finch.accounts.empty', 'finch.transactions.default'],
    components: [
      { id: 'stat', name: 'Stat', path: 'mockups/_system/ui.tsx' },
      { id: 'card', name: 'Card', path: 'mockups/_system/ui.tsx' },
    ],
    status: "draft",
    version: '0.2.0',
    relatedScreens: ['finch.accounts.list', 'finch.transfer.initiate'],
    knownGaps: [
      {
        id: 'overview.loading',
        description: 'Skeleton loading state has not been designed.',
        severity: 'warn',
      },
    ],
    sections: ['overview'],
    component: Overview,
  }),

  defineScreen({
    id: 'finch.accounts.list',
    title: 'Accounts',
    route: '/finch/accounts',
    description: 'All linked accounts in a scannable table.',
    layoutFamily: 'list',
    viewport: 'responsive',
    journeys: ['finch.daily-check'],
    states: [
      { id: 'populated', label: 'Populated' },
      { id: 'empty', label: 'Empty', description: 'No accounts linked yet' },
    ],
    defaultStateId: 'populated',
    fixtures: ['finch.accounts.default', 'finch.accounts.empty'],
    components: [
      { id: 'card', name: 'Card', path: 'mockups/_system/ui.tsx' },
      { id: 'empty-state', name: 'EmptyState', path: 'mockups/_system/ui.tsx' },
    ],
    status: 'approved',
    version: '0.1.0',
    relatedScreens: ['finch.accounts.detail', 'finch.overview'],
    knownGaps: [],
    sections: ['accounts'],
    component: AccountsList,
  }),

  defineScreen({
    id: 'finch.accounts.detail',
    title: 'Account detail',
    route: '/finch/accounts/:accountId',
    description: 'Per-account balance and activity.',
    layoutFamily: 'detail',
    viewport: 'responsive',
    journeys: ['finch.daily-check'],
    states: [{ id: 'default', label: 'Default' }],
    defaultStateId: 'default',
    fixtures: ['finch.accounts.default', 'finch.transactions.default'],
    components: [{ id: 'card', name: 'Card', path: 'mockups/_system/ui.tsx' }],
    status: 'in-review',
    version: '0.1.0',
    relatedScreens: ['finch.accounts.list', 'finch.transfer.initiate'],
    knownGaps: [
      {
        id: 'detail.404',
        description: 'Not-found state is shown inline; no dedicated error page yet.',
        severity: 'info',
      },
    ],
    permissions: ['record.delete'],
    sections: ['accounts'],
    component: AccountDetail,
  }),

  defineScreen({
    id: 'finch.transfer.initiate',
    title: 'Transfer · Details',
    route: '/finch/transfer',
    description: 'First step of the send-money wizard. Collects from/to/amount/memo.',
    layoutFamily: 'wizard',
    viewport: 'responsive',
    journeys: ['finch.send-money'],
    states: [{ id: 'default', label: 'Default' }],
    defaultStateId: 'default',
    fixtures: ['finch.accounts.default'],
    components: [{ id: 'card', name: 'Card', path: 'mockups/_system/ui.tsx' }],
    status: 'approved',
    version: '0.2.0',
    relatedScreens: ['finch.transfer.review', 'finch.overview'],
    knownGaps: [],
    permissions: ['transfer.create'],
    sections: ['transfers'],
    component: TransferInitiate,
  }),

  defineScreen({
    id: 'finch.transfer.review',
    title: 'Transfer · Review',
    route: '/finch/transfer/review',
    description: 'Second step of the wizard. Shows a final summary before confirmation.',
    layoutFamily: 'wizard',
    viewport: 'responsive',
    journeys: ['finch.send-money'],
    states: [{ id: 'default', label: 'Default' }],
    defaultStateId: 'default',
    fixtures: ['finch.accounts.default', 'finch.transfer.draft'],
    components: [{ id: 'card', name: 'Card', path: 'mockups/_system/ui.tsx' }],
    status: 'approved',
    version: '0.2.0',
    relatedScreens: ['finch.transfer.initiate', 'finch.transfer.confirmed'],
    knownGaps: [],
    permissions: ['transfer.create'],
    sections: ['transfers'],
    component: TransferReview,
  }),

  defineScreen({
    id: 'finch.transfer.confirmed',
    title: 'Transfer · Confirmed',
    route: '/finch/transfer/confirmed',
    description: 'Success state after a completed transfer.',
    layoutFamily: 'wizard',
    viewport: 'responsive',
    journeys: ['finch.send-money'],
    states: [{ id: 'default', label: 'Default' }],
    defaultStateId: 'default',
    fixtures: [],
    components: [],
    status: 'approved',
    version: '0.2.0',
    relatedScreens: ['finch.overview', 'finch.transfer.initiate'],
    knownGaps: [],
    sections: ['transfers'],
    component: TransferConfirmed,
  }),

  defineScreen({
    id: 'finch.settings',
    title: 'Settings',
    route: '/finch/settings',
    description: 'Profile and preferences.',
    layoutFamily: 'settings',
    viewport: 'responsive',
    journeys: [],
    states: [{ id: 'default', label: 'Default' }],
    defaultStateId: 'default',
    fixtures: [],
    components: [],
    status: 'draft',
    version: '0.1.0',
    relatedScreens: ['finch.overview'],
    knownGaps: [
      {
        id: 'settings.mobile',
        description: 'Mobile layout not yet designed.',
        severity: 'warn',
      },
    ],
    permissions: ['settings.edit'],
    sections: ['settings'],
    component: Settings,
  }),
];

/**
 * Journeys for this project are authored as markdown in
 * `docs/journeys/*.md` (Phase 6). The framework merges them with any
 * journeys declared here. Keeping this array empty is the preferred style;
 * leave `defineJourney` available so older projects can still author in TS.
 */
export const journeys = [] as ReturnType<typeof defineJourney>[];

export const fixtures = allFixtures;
