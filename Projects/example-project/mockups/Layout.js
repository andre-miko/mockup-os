import { jsx as _jsx } from "react/jsx-runtime";
import { Outlet } from 'react-router-dom';
import { AppFrame } from '@mockups/_system';
import { finchUser } from './fixtures';
const NAV = [
    { to: '/finch', label: 'Overview', end: true },
    { to: '/finch/accounts', label: 'Accounts' },
    { to: '/finch/transfer', label: 'Transfer' },
    { to: '/finch/settings', label: 'Settings' },
];
export function Layout() {
    return (_jsx(AppFrame, { productName: "Finch", nav: NAV, user: finchUser, children: _jsx(Outlet, {}) }));
}
