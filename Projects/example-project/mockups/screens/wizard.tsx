import clsx from 'clsx';

const STEPS = ['Details', 'Review', 'Confirmation'];

export function WizardSteps({ current }: { current: number }) {
  return (
    <ol className="mb-6 flex items-center gap-2 text-xs">
      {STEPS.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={clsx(
              'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold',
              i < current && 'bg-indigo-600 text-white',
              i === current && 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-600',
              i > current && 'bg-zinc-100 text-zinc-400',
            )}
          >
            {i + 1}
          </span>
          <span
            className={clsx(
              'uppercase tracking-wider',
              i === current ? 'text-zinc-900' : 'text-zinc-400',
            )}
          >
            {label}
          </span>
          {i < STEPS.length - 1 && <span className="h-px w-8 bg-zinc-200" />}
        </li>
      ))}
    </ol>
  );
}
