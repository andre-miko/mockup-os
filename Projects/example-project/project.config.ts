import { defineProjectConfig } from '@framework/defineScreen';
import { Layout } from './mockups/Layout';

export default defineProjectConfig({
  layouts: [{ prefix: '/finch', layout: Layout }],

  permissions: [
    {
      id: 'record.delete',
      label: 'Delete record',
      description:
        'Lets the user delete an owned record such as an account, transfer, or saved payee.',
      default: true,
      modes: ['hidden', 'disabled', 'denied-message'],
      defaultMode: 'disabled',
    },
    {
      id: 'transfer.create',
      label: 'Create transfer',
      description:
        'Lets the user initiate a new money transfer between their own accounts or to a payee.',
      default: true,
      modes: ['hidden', 'disabled', 'denied-message', 'read-only'],
      defaultMode: 'disabled',
    },
    {
      id: 'settings.edit',
      label: 'Edit settings',
      description:
        'Lets the user modify profile preferences. When denied, forms render as read-only.',
      default: true,
      modes: ['disabled', 'read-only', 'denied-message'],
      defaultMode: 'read-only',
    },
  ],

  sections: [
    {
      id: 'overview',
      label: 'Overview',
      description: 'Home dashboards and high-level summaries.',
      screenIds: ['finch.overview'],
    },
    {
      id: 'accounts',
      label: 'Accounts',
      description: 'Linked account browsing and detail screens.',
      screenIds: ['finch.accounts.list', 'finch.accounts.detail'],
    },
    {
      id: 'transfers',
      label: 'Transfers',
      description: 'Money-movement wizard: initiate, review, confirmed.',
      screenIds: [
        'finch.transfer.initiate',
        'finch.transfer.review',
        'finch.transfer.confirmed',
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Profile and preferences.',
      screenIds: ['finch.settings'],
    },
  ],

  defaultScreenId: 'finch.overview',
});
