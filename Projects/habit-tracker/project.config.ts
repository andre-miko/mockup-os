import { defineProjectConfig } from '@framework/defineScreen';
import { Layout } from './mockups/Layout';

export default defineProjectConfig({
  layouts: [{ prefix: '/sprout', layout: Layout }],

  permissions: [
    {
      id: 'habit.delete',
      label: 'Delete habit',
      description: 'Lets the user delete one of their habits.',
      default: true,
      modes: ['hidden', 'disabled', 'denied-message'],
      defaultMode: 'disabled',
    },
  ],

  sections: [
    {
      id: 'today',
      label: 'Today',
      description: "Today's check-ins.",
      screenIds: ['sprout.today'],
    },
    {
      id: 'habits',
      label: 'Habits',
      description: 'Full habit list.',
      screenIds: ['sprout.habits'],
    },
  ],

  defaultScreenId: 'sprout.today',
});
