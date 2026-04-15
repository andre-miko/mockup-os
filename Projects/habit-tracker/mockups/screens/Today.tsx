import { AppFrameBody, AppFrameHeader, Card, PageHeader, Stat } from '@mockups/_system';
import { useFixture } from '@framework/hooks';
import type { Habit } from '../fixtures';

export function Today() {
  const habits = useFixture<Habit[]>('sprout.habits.default')?.data ?? [];
  const done = habits.filter((h) => h.doneToday);
  const pending = habits.filter((h) => !h.doneToday);

  return (
    <>
      <AppFrameHeader>
        <div className="text-sm font-medium">Today</div>
      </AppFrameHeader>
      <AppFrameBody>
        <PageHeader
          title="Good morning, Jordan"
          description="Here's what's on your plate today."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Stat label="Completed" value={`${done.length}/${habits.length}`} />
          <Stat label="Pending" value={`${pending.length}`} />
          <Stat
            label="Longest streak"
            value={`${habits.reduce((m, h) => Math.max(m, h.streak), 0)} days`}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="mb-3 text-sm font-semibold">Pending</h2>
            {pending.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500">All done. Nice.</div>
            ) : (
              <ul className="space-y-2">
                {pending.map((h) => (
                  <li
                    key={h.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{h.icon}</span>
                      <div>
                        <div className="text-sm font-medium">{h.name}</div>
                        <div className="text-xs text-zinc-500">
                          {h.streak > 0 ? `${h.streak}-day streak` : 'Start a new streak'}
                        </div>
                      </div>
                    </div>
                    <button className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs hover:bg-zinc-50">
                      Check in
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold">Completed</h2>
            {done.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500">Nothing checked yet.</div>
            ) : (
              <ul className="space-y-2">
                {done.map((h) => (
                  <li
                    key={h.id}
                    className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{h.icon}</span>
                      <div className="text-sm font-medium">{h.name}</div>
                    </div>
                    <div className="text-xs font-medium text-emerald-700">
                      {h.streak}-day streak
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </AppFrameBody>
    </>
  );
}
