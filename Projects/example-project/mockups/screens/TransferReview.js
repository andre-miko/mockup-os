import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { AppFrameBody, AppFrameHeader, Button, Card, PageHeader } from '@mockups/_system';
import { useFixture } from '@framework/hooks';
import { WizardSteps } from './wizard';
export function TransferReview() {
    const draft = useFixture('finch.transfer.draft')?.data;
    const accounts = useFixture('finch.accounts.default')?.data ?? [];
    const from = accounts.find((a) => a.id === draft?.fromAccountId);
    const to = accounts.find((a) => a.id === draft?.toAccountId);
    return (_jsxs(_Fragment, { children: [_jsx(AppFrameHeader, { children: _jsx("div", { className: "text-sm font-medium", children: "Review transfer" }) }), _jsxs(AppFrameBody, { children: [_jsx(WizardSteps, { current: 1 }), _jsx(PageHeader, { title: "Ready to send?", description: "Double-check the details before confirming." }), _jsxs(Card, { className: "max-w-xl", children: [_jsxs("dl", { className: "divide-y divide-zinc-100", children: [_jsx(Row, { label: "From", value: from ? `${from.name} · ···· ${from.last4}` : '—' }), _jsx(Row, { label: "To", value: to ? `${to.name} · ···· ${to.last4}` : '—' }), _jsx(Row, { label: "Amount", value: draft ? `$${draft.amount.toFixed(2)}` : '—', emphasize: true }), _jsx(Row, { label: "Memo", value: draft?.memo ?? '—' }), _jsx(Row, { label: "Arrives", value: "Instantly" }), _jsx(Row, { label: "Fee", value: "$0.00" })] }), _jsxs("div", { className: "mt-6 flex justify-end gap-2", children: [_jsx(Link, { to: "/finch/transfer", children: _jsx(Button, { variant: "ghost", children: "Back" }) }), _jsx(Link, { to: "/finch/transfer/confirmed", children: _jsx(Button, { variant: "primary", children: "Send $250.00" }) })] })] })] })] }));
}
function Row({ label, value, emphasize, }) {
    return (_jsxs("div", { className: "flex justify-between py-3", children: [_jsx("dt", { className: "text-xs uppercase tracking-wider text-zinc-500", children: label }), _jsx("dd", { className: emphasize ? 'text-lg font-semibold' : 'text-sm font-medium', children: value })] }));
}
