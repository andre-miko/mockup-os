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
export declare const finchUser: {
    name: string;
    email: string;
};
export declare const accountsFixture: import("@/framework").FixtureDefinition<Account[]>;
export declare const accountsEmptyFixture: import("@/framework").FixtureDefinition<Account[]>;
export declare const transactionsFixture: import("@/framework").FixtureDefinition<Transaction[]>;
export declare const transferDraftFixture: import("@/framework").FixtureDefinition<{
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    memo: string;
}>;
export declare const allFixtures: (import("@/framework").FixtureDefinition<Account[]> | import("@/framework").FixtureDefinition<Transaction[]> | import("@/framework").FixtureDefinition<{
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    memo: string;
}>)[];
