import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { AppFrameBody, AppFrameHeader, Button, Card, PageHeader } from '@mockups/_system';
import { finchUser } from '../fixtures';
export function Settings() {
    return (_jsxs(_Fragment, { children: [_jsx(AppFrameHeader, { children: _jsx("div", { className: "text-sm font-medium", children: "Settings" }) }), _jsxs(AppFrameBody, { children: [_jsx(PageHeader, { title: "Settings", description: "Manage your profile and preferences." }), _jsxs("div", { className: "grid grid-cols-1 gap-4 lg:grid-cols-2", children: [_jsxs(Card, { children: [_jsx("h2", { className: "text-sm font-semibold", children: "Profile" }), _jsxs("div", { className: "mt-4 space-y-3 text-sm", children: [_jsx(Row, { label: "Name", value: finchUser.name }), _jsx(Row, { label: "Email", value: finchUser.email }), _jsx(Row, { label: "2FA", value: "Enabled" })] }), _jsx("div", { className: "mt-6", children: _jsx(Button, { children: "Edit profile" }) })] }), _jsxs(Card, { children: [_jsx("h2", { className: "text-sm font-semibold", children: "Preferences" }), _jsxs("div", { className: "mt-4 space-y-3 text-sm", children: [_jsx(Row, { label: "Currency", value: "USD" }), _jsx(Row, { label: "Language", value: "English" }), _jsx(Row, { label: "Notifications", value: "Email only" })] })] })] })] })] }));
}
function Row({ label, value }) {
    return (_jsxs("div", { className: "flex justify-between border-b border-zinc-100 pb-2 last:border-0", children: [_jsx("span", { className: "text-zinc-500", children: label }), _jsx("span", { className: "font-medium", children: value })] }));
}
