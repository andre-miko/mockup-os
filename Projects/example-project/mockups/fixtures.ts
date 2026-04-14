/**
 * Fixture registration.
 *
 * Fixture *data* lives in `Projects/<id>/data/<fixtureId>.json` — see
 * Phase 8. This file binds each JSON payload to a `FixtureDefinition` so
 * the framework can validate ids, the Data tab can enumerate bindings,
 * and the sidecar has a single place to overwrite data from uploads.
 *
 * Keep this file small: id + description + JSON import. Schemas stay in
 * TypeScript so screens consume typed data via `useFixture<Account[]>(id)`.
 */

import { defineFixture } from '@framework/defineScreen';

import accountsDefault from '../data/finch.accounts.default.json';
import accountsEmpty from '../data/finch.accounts.empty.json';
import transactionsDefault from '../data/finch.transactions.default.json';
import transferDraft from '../data/finch.transfer.draft.json';

export interface Account {
  id: string;
  name: string;
  kind: 'checking' | 'savings' | 'card';
  balance: number;
  last4: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  description: string;
  amount: number;
  date: string;
  category: string;
}

export interface TransferDraft {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  memo: string;
}

export const finchUser = {
  name: 'Avery Kim',
  email: 'avery@example.com',
};

export const accountsFixture = defineFixture<Account[]>({
  id: 'finch.accounts.default',
  description: 'Three personal accounts across checking, savings, card',
  data: accountsDefault as Account[],
});

export const accountsEmptyFixture = defineFixture<Account[]>({
  id: 'finch.accounts.empty',
  description: 'New user with no linked accounts',
  data: accountsEmpty as Account[],
});

export const transactionsFixture = defineFixture<Transaction[]>({
  id: 'finch.transactions.default',
  description: 'Recent activity across the three accounts',
  data: transactionsDefault as Transaction[],
});

export const transferDraftFixture = defineFixture<TransferDraft>({
  id: 'finch.transfer.draft',
  description: 'Pre-filled transfer used by the wizard review step',
  data: transferDraft as TransferDraft,
});

export const allFixtures = [
  accountsFixture,
  accountsEmptyFixture,
  transactionsFixture,
  transferDraftFixture,
];
