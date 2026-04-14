import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link, useParams } from 'react-router-dom';
import { AppFrameBody, AppFrameHeader, Button, Card, PageHeader } from '@mockups/_system';
import { useFixture } from '@framework/hooks';
export function AccountDetail() {
    const { accountId } = useParams();
    const accounts = useFixture('finch.accounts.default')?.data ?? [];
    const txs = useFixture('finch.transactions.default')?.data ?? [];
    const account = accounts.find((a) => a.id === accountId);
    if (!account) {
        return (_jsxs(_Fragment, { children: [_jsx(AppFrameHeader, { children: _jsx("div", { className: "text-sm font-medium", children: "Account not found" }) }), _jsx(AppFrameBody, { children: _jsxs(Card, { children: [_jsxs("div", { className: "text-sm", children: ["We couldn't find an account with id ", _jsx("code", { children: accountId }), "."] }), _jsx(Link, { to: "/finch/accounts", className: "mt-3 inline-block text-sm text-indigo-600 hover:underline", children: "Back to accounts" })] }) })] }));
    }
    const accountTxs = txs.filter((t) => t.accountId === account.id);
    return (_jsxs(_Fragment, { children: [_jsxs(AppFrameHeader, { children: [_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx(Link, { to: "/finch/accounts", className: "text-zinc-500 hover:text-zinc-900", children: "Accounts" }), _jsx("span", { className: "text-zinc-300", children: "/" }), _jsx("span", { className: "font-medium", children: account.name })] }), _jsx(Link, { to: "/finch/transfer", children: _jsx(Button, { variant: "primary", children: "Transfer" }) })] }), _jsxs(AppFrameBody, { children: [_jsx(PageHeader, { title: account.name, description: `${capitalize(account.kind)} · ···· ${account.last4}` }), _jsxs("div", { className: "grid grid-cols-1 gap-4 lg:grid-cols-3", children: [_jsxs(Card, { className: "lg:col-span-1", children: [_jsx("div", { className: "text-xs font-medium uppercase tracking-wider text-zinc-500", children: "Balance" }), _jsx("div", { className: "mt-2 text-3xl font-semibold tracking-tight", children: formatCurrency(account.balance) }), _jsxs("div", { className: "mt-4 flex gap-2", children: [_jsx(Button, { variant: "primary", children: "Transfer" }), _jsx(Button, { children: "Download" })] })] }), _jsxs(Card, { className: "lg:col-span-2 p-0", children: [_jsx("div", { className: "border-b border-zinc-100 px-5 py-3 text-sm font-semibold", children: "Activity" }), accountTxs.length === 0 ? (_jsx("div", { className: "py-8 text-center text-sm text-zinc-500", children: "No activity on this account." })) : (_jsx("ul", { className: "divide-y divide-zinc-100", children: accountTxs.map((t) => (_jsxs("li", { className: "flex items-center justify-between px-5 py-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium", children: t.description }), _jsxs("div", { className: "text-xs text-zinc-500", children: [t.category, " \u00B7 ", t.date] })] }), _jsx("div", { className: t.amount >= 0
                                                        ? 'text-sm font-medium text-emerald-600'
                                                        : 'text-sm font-medium', children: formatCurrency(t.amount) })] }, t.id))) }))] })] })] })] }));
}
function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
function formatCurrency(n) {
    const sign = n < 0 ? '-' : '';
    return `${sign}$${Math.abs(n).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}
