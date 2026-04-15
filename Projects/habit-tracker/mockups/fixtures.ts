import { defineFixture } from '@framework/defineScreen';

import habitsDefault from '../data/sprout.habits.default.json';

export interface Habit {
  id: string;
  name: string;
  icon: string;
  cadence: 'daily' | 'weekly';
  streak: number;
  doneToday: boolean;
}

export const sproutUser = {
  name: 'Jordan Patel',
  email: 'jordan@example.com',
};

export const habitsFixture = defineFixture<Habit[]>({
  id: 'sprout.habits.default',
  description: 'Four personal habits with mixed streak and completion state',
  data: habitsDefault as Habit[],
});

export const allFixtures = [habitsFixture];
