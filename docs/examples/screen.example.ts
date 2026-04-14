/**
 * Canonical example of a fully-populated ScreenDefinition.
 *
 * Copy this when authoring a new screen. Every field is shown with a
 * realistic value so you know what a "complete" metadata block looks
 * like.
 */

import { defineScreen } from '../../src/mockup-os/framework/defineScreen';

export const exampleScreen = defineScreen({
  id: 'example.dashboard',
  title: 'Dashboard',
  route: '/example/dashboard',
  description: 'Landing page for returning users. Summarizes their current state and surfaces one primary action.',
  layoutFamily: 'dashboard',
  viewport: 'responsive',
  journeys: ['example.daily-check'],
  states: [
    { id: 'populated', label: 'Populated', description: 'Returning user with data' },
    { id: 'empty', label: 'Empty', description: 'New user, first visit' },
    { id: 'loading', label: 'Loading', description: 'Initial data fetch in flight' },
  ],
  defaultStateId: 'populated',
  fixtures: ['example.accounts.default'],
  components: [
    { id: 'stat', name: 'Stat', path: 'mockups/_system/ui.tsx' },
    { id: 'card', name: 'Card', path: 'mockups/_system/ui.tsx' },
  ],
  status: 'in-review',
  version: '0.1.0',
  relatedScreens: ['example.accounts-list'],
  knownGaps: [
    {
      id: 'dashboard.error',
      description: 'Error state has not been designed yet.',
      severity: 'warn',
    },
  ],
  component: () => null,
});
