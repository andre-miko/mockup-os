import { Link } from 'react-router-dom';
import { AppFrameBody, AppFrameHeader, Button, Card, PageHeader, Stat } from '@mockups/_system';
import { useFixture, useScreenState } from '@framework/hooks';
import type { Account, Transaction } from '../fixtures';

export function Overview() {
  const state = useScreenState('finch.overview');
  const fixtureId = state?.id === 'empty' ? 'finch.accounts.empty' : 'finch.accounts.default';
  const accounts = useFixture<Account[]>(fixtureId)?.data ?? [];
  const txs = useFixture<Transaction[]>('finch.transactions.default')?.data ?? [];

  const total = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <>
      <AppFrameHeader>
        <div className="text-sm font-medium">Overview</div>
        <Link to="/finch/transfer">
          <Button variant="primary">Send money</Button>
        </Link>
      </AppFrameHeader>
      <AppFrameBody>
        <PageHeader
          title="Good afternoon, Avery"
          description="Here's a snapshot of your accounts."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Stat
            label="Net balance"
            value={formatCurrency(total)}
            delta={{ value: '+2.1% MoM', positive: true }}
          />
          <Stat label="Accounts" value={`${accounts.length}`} />
          <Stat
            label="Spend this month"
            value={formatCurrency(Math.abs(txs.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0)))}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Recent activity</h2>
              <Link to="/finch/accounts" className="text-xs text-indigo-600 hover:underline">
                View all
              </Link>
            </div>
            {txs.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500">No activity yet.</div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {txs.slice(0, 5).map((t) => (
                  <li key={t.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <div className="text-sm font-medium">{t.description}</div>
                      <div className="text-xs text-zinc-500">
                        {t.category} · {t.date}
                      </div>
                    </div>
                    <div
                      className={
                        t.amount >= 0 ? 'text-sm font-medium text-emerald-600' : 'text-sm font-medium'
                      }
                    >
                      {formatCurrency(t.amount)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold">Accounts</h2>
            {accounts.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500">
                No accounts linked.
              </div>
            ) : (
              <ul className="space-y-2.5">
                {accounts.map((a) => (
                  <li key={a.id}>
                    <Link
                      to={`/finch/accounts/${a.id}`}
                      className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2 hover:bg-zinc-50"
                    >
                      <div>
                        <div className="text-sm font-medium">{a.name}</div>
                        <div className="text-xs text-zinc-500">···· {a.last4}</div>
                      </div>
                      <div className="text-sm font-medium">{formatCurrency(a.balance)}</div>
                    </Link>
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

function formatCurrency(n: number) {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
