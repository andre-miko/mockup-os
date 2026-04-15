import { AppFrameBody, AppFrameHeader, Button, Card, PageHeader } from '@mockups/_system';
import { useFixture } from '@framework/hooks';
import type { Habit } from '../fixtures';

export function Habits() {
  const habits = useFixture<Habit[]>('sprout.habits.default')?.data ?? [];

  return (
    <>
      <AppFrameHeader>
        <div className="text-sm font-medium">Habits</div>
        <Button variant="primary">New habit</Button>
      </AppFrameHeader>
      <AppFrameBody>
        <PageHeader title="All habits" description="Your full habit roster and streaks." />

        <Card>
          {habits.length === 0 ? (
            <div className="py-8 text-center text-sm text-zinc-500">
              No habits yet. Add one to get started.
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {habits.map((h) => (
                <li key={h.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{h.icon}</span>
                    <div>
                      <div className="text-sm font-medium">{h.name}</div>
                      <div className="text-xs text-zinc-500 capitalize">{h.cadence}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-medium">{h.streak} days</div>
                      <div className="text-xs text-zinc-500">
                        {h.doneToday ? 'Done today' : 'Not yet today'}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </AppFrameBody>
    </>
  );
}
