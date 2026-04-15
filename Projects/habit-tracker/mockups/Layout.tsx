import { Outlet } from 'react-router-dom';
import { AppFrame } from '@mockups/_system';
import { sproutUser } from './fixtures';

const NAV = [
  { to: '/sprout', label: 'Today', end: true },
  { to: '/sprout/habits', label: 'Habits' },
];

export function Layout() {
  return (
    <AppFrame productName="Sprout" nav={NAV} user={sproutUser}>
      <Outlet />
    </AppFrame>
  );
}
