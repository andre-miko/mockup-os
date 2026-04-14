import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { AppFrameBody, AppFrameHeader, Button, Card } from '@mockups/_system';
import { WizardSteps } from './wizard';
export function TransferConfirmed() {
    return (_jsxs(_Fragment, { children: [_jsx(AppFrameHeader, { children: _jsx("div", { className: "text-sm font-medium", children: "Transfer sent" }) }), _jsxs(AppFrameBody, { children: [_jsx(WizardSteps, { current: 2 }), _jsxs(Card, { className: "mx-auto max-w-xl text-center", children: [_jsx("div", { className: "mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600", children: "\u2713" }), _jsx("h2", { className: "mt-4 text-xl font-semibold", children: "$250.00 is on its way" }), _jsx("p", { className: "mt-1 text-sm text-zinc-500", children: "We sent it to Emergency Savings. You'll see it post shortly." }), _jsxs("div", { className: "mt-6 flex justify-center gap-2", children: [_jsx(Link, { to: "/finch", children: _jsx(Button, { children: "Back to overview" }) }), _jsx(Link, { to: "/finch/transfer", children: _jsx(Button, { variant: "primary", children: "Send another" }) })] })] })] })] }));
}
