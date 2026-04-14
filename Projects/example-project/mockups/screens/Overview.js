import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { AppFrameBody, AppFrameHeader, Button, Card, PageHeader, Stat } from '@mockups/_system';
import { useFixture, useScreenState } from '@framework/hooks';
export function Overview() {
    const state = useScreenState('finch.overview');
    const fixtureId = state?.id === 'empty' ? 'finch.accounts.empty' : 'finch.accounts.default';
    const accounts = useFixture(fixtureId)?.data ?? [];
    const txs = useFixture('finch.transactions.default')?.data ?? [];
    const total = accounts.reduce((sum, a) => sum + a.balance, 0);
    return (_jsxs(_Fragment, { children: [_jsxs(AppFrameHeader, { children: [_jsx("div", { className: "text-sm font-medium", children: "Overview" }), _jsx(Link, { to: "/finch/transfer", children: _jsx(Button, { variant: "primary", children: "Send money" }) })] }), _jsxs(AppFrameBody, { children: [_jsx(PageHeader, { title: "Good afternoon, Avery", description: "Here's a snapshot of your accounts." }), _jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-3", children: [_jsx(Stat, { label: "Net balance", value: formatCurrency(total), delta: { value: '+2.1% MoM', positive: true } }), _jsx(Stat, { label: "Accounts", value: `${accounts.length}` }), _jsx(Stat, { label: "Spend this month", value: formatCurrency(Math.abs(txs.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0))) })] }), _jsxs("div", { className: "mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3", children: [_jsxs(Card, { className: "lg:col-span-2", children: [_jsxs("div", { className: "mb-3 flex items-center justify-between", children: [_jsx("h2", { className: "text-sm font-semibold", children: "Recent activity" }), _jsx(Link, { to: "/finch/accounts", className: "text-xs text-indigo-600 hover:underline", children: "View all" })] }), txs.length === 0 ? (_jsx("div", { className: "py-8 text-center text-sm text-zinc-500", children: "No activity yet." })) : (_jsx("ul", { className: "divide-y divide-zinc-100", children: txs.slice(0, 5).map((t) => (_jsxs("li", { className: "flex items-center justify-between py-2.5", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium", children: t.description }), _jsxs("div", { className: "text-xs text-zinc-500", children: [t.category, " \u00B7 ", t.date] })] }), _jsx("div", { className: t.amount >= 0 ? 'text-sm font-medium text-emerald-600' : 'text-sm font-medium', children: formatCurrency(t.amount) })] }, t.id))) }))] }), _jsxs(Card, { children: [_jsx("h2", { className: "mb-3 text-sm font-semibold", children: "Accounts" }), accounts.length === 0 ? (_jsx("div", { className: "py-8 text-center text-sm text-zinc-500", children: "No accounts linked." })) : (_jsx("ul", { className: "space-y-2.5", children: accounts.map((a) => (_jsx("li", { children: _jsxs(Link, { to: `/finch/accounts/${a.id}`, className: "flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2 hover:bg-zinc-50", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium", children: a.name }), _jsxs("div", { className: "text-xs text-zinc-500", children: ["\u00B7\u00B7\u00B7\u00B7 ", a.last4] })] }), _jsx("div", { className: "text-sm font-medium", children: formatCurrency(a.balance) })] }) }, a.id))) }))] })] })] })] }));
}
function formatCurrency(n) {
    const sign = n < 0 ? '-' : '';
    return `${sign}$${Math.abs(n).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}
