/**
 * Sprout — habit tracker. Minimal second product used to exercise
 * multi-project switching in the shell.
 */

import { defineJourney, defineScreen } from '@framework/defineScreen';
import { lazy } from 'react';
import { allFixtures } from './fixtures';

const Today = lazy(() => import('./screens/Today').then((m) => ({ default: m.Today })));
const Habits = lazy(() => import('./screens/Habits').then((m) => ({ default: m.Habits })));

export const screens = [
  defineScreen({
    id: 'sprout.today',
    title: 'Today',
    route: '/sprout',
    description: "Today's pending and completed habits.",
    layoutFamily: 'dashboard',
    viewport: 'responsive',
    journeys: [],
    states: [{ id: 'default', label: 'Default' }],
    defaultStateId: 'default',
    fixtures: ['sprout.habits.default'],
    components: [
      { id: 'stat', name: 'Stat', path: 'mockups/_system/ui.tsx' },
      { id: 'card', name: 'Card', path: 'mockups/_system/ui.tsx' },
    ],
    status: 'draft',
    version: '0.1.0',
    relatedScreens: ['sprout.habits'],
    knownGaps: [],
    sections: ['today'],
    component: Today,
  }),

  defineScreen({
    id: 'sprout.habits',
    title: 'Habits',
    route: '/sprout/habits',
    description: 'Full habit list with streak counts.',
    layoutFamily: 'list',
    viewport: 'responsive',
    journeys: [],
    states: [{ id: 'default', label: 'Default' }],
    defaultStateId: 'default',
    fixtures: ['sprout.habits.default'],
    components: [{ id: 'card', name: 'Card', path: 'mockups/_system/ui.tsx' }],
    status: 'draft',
    version: '0.1.0',
    relatedScreens: ['sprout.today'],
    knownGaps: [],
    permissions: ['habit.delete'],
    sections: ['habits'],
    component: Habits,
  }),
];

export const journeys = [] as ReturnType<typeof defineJourney>[];

export const fixtures = allFixtures;
