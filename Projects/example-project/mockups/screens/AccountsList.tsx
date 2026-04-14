import { Link } from 'react-router-dom';
import { AppFrameBody, AppFrameHeader, Button, Card, EmptyState, PageHeader } from '@mockups/_system';
import { useFixture, useScreenState } from '@framework/hooks';
import type { Account } from '../fixtures';

export function AccountsList() {
  const state = useScreenState('finch.accounts.list');
  const fixtureId = state?.id === 'empty' ? 'finch.accounts.empty' : 'finch.accounts.default';
  const accounts = useFixture<Account[]>(fixtureId)?.data ?? [];

  return (
    <>
      <AppFrameHeader>
        <div className="text-sm font-medium">Accounts</div>
        <Button variant="primary">Link account</Button>
      </AppFrameHeader>
      <AppFrameBody>
        <PageHeader
          title="Accounts"
          description="Everything linked to your Finch profile."
        />

        {accounts.length === 0 ? (
          <EmptyState
            title="No accounts yet"
            description="Link a checking or savings account to start tracking your money."
            action={<Button variant="primary">Link account</Button>}
          />
        ) : (
          <Card className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 text-left text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Last 4</th>
                  <th className="px-5 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {accounts.map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-3">
                      <Link to={`/finch/accounts/${a.id}`} className="font-medium text-indigo-600 hover:underline">
                        {a.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 capitalize text-zinc-600">{a.kind}</td>
                    <td className="px-5 py-3 font-mono text-zinc-500">···· {a.last4}</td>
                    <td className="px-5 py-3 text-right font-medium">
                      {formatCurrency(a.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
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
