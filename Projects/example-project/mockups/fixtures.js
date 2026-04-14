import { defineFixture } from '@framework/defineScreen';
export const finchUser = {
    name: 'Avery Kim',
    email: 'avery@example.com',
};
export const accountsFixture = defineFixture({
    id: 'finch.accounts.default',
    description: 'Three personal accounts across checking, savings, card',
    data: [
        { id: 'acc_1', name: 'Everyday Checking', kind: 'checking', balance: 4820.55, last4: '4021' },
        { id: 'acc_2', name: 'Emergency Savings', kind: 'savings', balance: 18500, last4: '9911' },
        { id: 'acc_3', name: 'Travel Card', kind: 'card', balance: -321.14, last4: '0044' },
    ],
});
export const accountsEmptyFixture = defineFixture({
    id: 'finch.accounts.empty',
    description: 'New user with no linked accounts',
    data: [],
});
export const transactionsFixture = defineFixture({
    id: 'finch.transactions.default',
    data: [
        { id: 'tx_1', accountId: 'acc_1', description: 'Blue Bottle Coffee', amount: -5.5, date: '2026-04-13', category: 'Food' },
        { id: 'tx_2', accountId: 'acc_1', description: 'Payroll — Acme Inc', amount: 3200, date: '2026-04-12', category: 'Income' },
        { id: 'tx_3', accountId: 'acc_1', description: 'Uber', amount: -14.3, date: '2026-04-11', category: 'Transport' },
        { id: 'tx_4', accountId: 'acc_2', description: 'Transfer from Checking', amount: 500, date: '2026-04-10', category: 'Transfer' },
        { id: 'tx_5', accountId: 'acc_3', description: 'Delta Airlines', amount: -421.14, date: '2026-04-09', category: 'Travel' },
    ],
});
export const transferDraftFixture = defineFixture({
    id: 'finch.transfer.draft',
    description: 'Pre-filled transfer used by the wizard review step',
    data: {
        fromAccountId: 'acc_1',
        toAccountId: 'acc_2',
        amount: 250,
        memo: 'Monthly savings',
    },
});
export const allFixtures = [
    accountsFixture,
    accountsEmptyFixture,
    transactionsFixture,
    transferDraftFixture,
];
