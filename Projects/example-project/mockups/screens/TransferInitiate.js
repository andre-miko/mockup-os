import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { AppFrameBody, AppFrameHeader, Button, Card, PageHeader } from '@mockups/_system';
import { useFixture } from '@framework/hooks';
import { WizardSteps } from './wizard';
export function TransferInitiate() {
    const accounts = useFixture('finch.accounts.default')?.data ?? [];
    return (_jsxs(_Fragment, { children: [_jsx(AppFrameHeader, { children: _jsx("div", { className: "text-sm font-medium", children: "Send money" }) }), _jsxs(AppFrameBody, { children: [_jsx(WizardSteps, { current: 0 }), _jsx(PageHeader, { title: "Where to?", description: "Move money between your accounts or send to someone else." }), _jsxs(Card, { children: [_jsxs("form", { className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: [_jsx(Field, { label: "From", children: _jsx("select", { className: "w-full rounded-md border border-zinc-200 px-3 py-2 text-sm", children: accounts.map((a) => (_jsxs("option", { value: a.id, children: [a.name, " \u00B7 ", formatCurrency(a.balance)] }, a.id))) }) }), _jsx(Field, { label: "To", children: _jsx("select", { className: "w-full rounded-md border border-zinc-200 px-3 py-2 text-sm", children: accounts.map((a) => (_jsx("option", { value: a.id, children: a.name }, a.id))) }) }), _jsx(Field, { label: "Amount", children: _jsxs("div", { className: "flex", children: [_jsx("span", { className: "inline-flex items-center rounded-l-md border border-r-0 border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-500", children: "$" }), _jsx("input", { type: "text", defaultValue: "250.00", className: "w-full rounded-r-md border border-zinc-200 px-3 py-2 text-sm" })] }) }), _jsx(Field, { label: "Memo", children: _jsx("input", { type: "text", defaultValue: "Monthly savings", className: "w-full rounded-md border border-zinc-200 px-3 py-2 text-sm" }) })] }), _jsxs("div", { className: "mt-6 flex justify-end gap-2", children: [_jsx(Link, { to: "/finch", children: _jsx(Button, { variant: "ghost", children: "Cancel" }) }), _jsx(Link, { to: "/finch/transfer/review", children: _jsx(Button, { variant: "primary", children: "Review transfer" }) })] })] })] })] }));
}
function Field({ label, children }) {
    return (_jsxs("label", { className: "block", children: [_jsx("div", { className: "mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500", children: label }), children] }));
}
function formatCurrency(n) {
    const sign = n < 0 ? '-' : '';
    return `${sign}$${Math.abs(n).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}
