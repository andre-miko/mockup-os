import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { AppFrameBody, AppFrameHeader, Button, Card, EmptyState, PageHeader } from '@mockups/_system';
import { useFixture, useScreenState } from '@framework/hooks';
export function AccountsList() {
    const state = useScreenState('finch.accounts.list');
    const fixtureId = state?.id === 'empty' ? 'finch.accounts.empty' : 'finch.accounts.default';
    const accounts = useFixture(fixtureId)?.data ?? [];
    return (_jsxs(_Fragment, { children: [_jsxs(AppFrameHeader, { children: [_jsx("div", { className: "text-sm font-medium", children: "Accounts" }), _jsx(Button, { variant: "primary", children: "Link account" })] }), _jsxs(AppFrameBody, { children: [_jsx(PageHeader, { title: "Accounts", description: "Everything linked to your Finch profile." }), accounts.length === 0 ? (_jsx(EmptyState, { title: "No accounts yet", description: "Link a checking or savings account to start tracking your money.", action: _jsx(Button, { variant: "primary", children: "Link account" }) })) : (_jsx(Card, { className: "p-0", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "border-b border-zinc-200 text-left text-xs uppercase tracking-wider text-zinc-500", children: _jsxs("tr", { children: [_jsx("th", { className: "px-5 py-3", children: "Name" }), _jsx("th", { className: "px-5 py-3", children: "Type" }), _jsx("th", { className: "px-5 py-3", children: "Last 4" }), _jsx("th", { className: "px-5 py-3 text-right", children: "Balance" })] }) }), _jsx("tbody", { className: "divide-y divide-zinc-100", children: accounts.map((a) => (_jsxs("tr", { className: "hover:bg-zinc-50", children: [_jsx("td", { className: "px-5 py-3", children: _jsx(Link, { to: `/finch/accounts/${a.id}`, className: "font-medium text-indigo-600 hover:underline", children: a.name }) }), _jsx("td", { className: "px-5 py-3 capitalize text-zinc-600", children: a.kind }), _jsxs("td", { className: "px-5 py-3 font-mono text-zinc-500", children: ["\u00B7\u00B7\u00B7\u00B7 ", a.last4] }), _jsx("td", { className: "px-5 py-3 text-right font-medium", children: formatCurrency(a.balance) })] }, a.id))) })] }) }))] })] }));
}
function formatCurrency(n) {
    const sign = n < 0 ? '-' : '';
    return `${sign}$${Math.abs(n).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}
