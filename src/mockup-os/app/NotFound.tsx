import { Link, useLocation } from 'react-router-dom';

export function NotFound() {
  const location = useLocation();
  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-2 p-10 text-center">
      <div className="text-sm uppercase tracking-wider text-zinc-500">No screen at</div>
      <div className="font-mono text-base">{location.pathname}</div>
      <Link to="/" className="mt-3 text-sm text-indigo-600 hover:underline">
        Back to the first registered screen →
      </Link>
    </div>
  );
}
