/**
 * Finch — example product.
 *
 * This file is the single registration surface for the Finch mockup
 * product. It declares every screen's metadata, the journeys those
 * screens participate in, and the fixtures they consume.
 *
 * Keep screens lazy-loaded. Keep this file side-effect free.
 */
import { Layout } from './Layout';
export declare const screens: import("@/framework").ScreenDefinition[];
export declare const journeys: import("@/framework").JourneyDefinition[];
export declare const fixtures: (import("@/framework").FixtureDefinition<import("./fixtures").Account[]> | import("@/framework").FixtureDefinition<import("./fixtures").Transaction[]> | import("@/framework").FixtureDefinition<{
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    memo: string;
}>)[];
export declare const productLayouts: readonly [{
    readonly prefix: "/finch";
    readonly layout: typeof Layout;
}];
