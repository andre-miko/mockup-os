import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppFrameBody, AppFrameHeader, Button, Card, PageHeader } from '@mockups/_system';
import { useFixture } from '@framework/hooks';
import { usePermission } from '@framework/permissions';
import type { Account, Transaction } from '../fixtures';

export function AccountDetail() {
  const { accountId } = useParams<{ accountId: string }>();
  const accounts = useFixture<Account[]>('finch.accounts.default')?.data ?? [];
  const txs = useFixture<Transaction[]>('finch.transactions.default')?.data ?? [];
  const account = accounts.find((a) => a.id === accountId);

  if (!account) {
    return (
      <>
        <AppFrameHeader>
          <div className="text-sm font-medium">Account not found</div>
        </AppFrameHeader>
        <AppFrameBody>
          <Card>
            <div className="text-sm">We couldn't find an account with id <code>{accountId}</code>.</div>
            <Link to="/finch/accounts" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
              Back to accounts
            </Link>
          </Card>
        </AppFrameBody>
      </>
    );
  }

  const accountTxs = txs.filter((t) => t.accountId === account.id);

  return (
    <>
      <AppFrameHeader>
        <div className="flex items-center gap-2 text-sm">
          <Link to="/finch/accounts" className="text-zinc-500 hover:text-zinc-900">
            Accounts
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="font-medium">{account.name}</span>
        </div>
        <Link to="/finch/transfer">
          <Button variant="primary">Transfer</Button>
        </Link>
      </AppFrameHeader>
      <AppFrameBody>
        <PageHeader
          title={account.name}
          description={`${capitalize(account.kind)} · ···· ${account.last4}`}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Balance
            </div>
            <div className="mt-2 text-3xl font-semibold tracking-tight">
              {formatCurrency(account.balance)}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="primary">Transfer</Button>
              <Button>Download</Button>
              <DeleteAccountButton name={account.name} />
            </div>
          </Card>

          <Card className="lg:col-span-2 p-0">
            <div className="border-b border-zinc-100 px-5 py-3 text-sm font-semibold">
              Activity
            </div>
            {accountTxs.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500">
                No activity on this account.
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {accountTxs.map((t) => (
                  <li key={t.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <div className="text-sm font-medium">{t.description}</div>
                      <div className="text-xs text-zinc-500">
                        {t.category} · {t.date}
                      </div>
                    </div>
                    <div
                      className={
                        t.amount >= 0
                          ? 'text-sm font-medium text-emerald-600'
                          : 'text-sm font-medium'
                      }
                    >
                      {formatCurrency(t.amount)}
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

/**
 * Reference implementation of a permission-gated action.
 *
 * The Right-panel `Permissions` section (see `shell/panels/right/PermissionsPanel.tsx`)
 * flips this button's state live. Each denial mode surfaces differently:
 *
 *   - hidden         → the button is omitted
 *   - disabled       → rendered disabled, tooltip explains why
 *   - denied-message → rendered enabled but clicking shows an inline notice
 *   - read-only      → (not expressive for a destructive action; falls through to disabled)
 */
function DeleteAccountButton({ name }: { name: string }) {
  const perm = usePermission('record.delete');
  const [notice, setNotice] = useState<string | null>(null);

  if (!perm.granted && perm.mode === 'hidden') return null;

  const isDisabled = !perm.granted && (perm.mode === 'disabled' || perm.mode === 'read-only');
  const showMessageOnClick = !perm.granted && perm.mode === 'denied-message';

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="danger"
        disabled={isDisabled}
        title={isDisabled ? (perm.definition?.description ?? 'You do not have permission.') : undefined}
        onClick={() => {
          if (showMessageOnClick) {
            setNotice(
              perm.definition?.description ??
                "You don't have permission to delete this account.",
            );
            return;
          }
          if (perm.granted) {
            setNotice(`Deleted ${name}. (mockup — nothing actually happens)`);
          }
        }}
      >
        Delete
      </Button>
      {notice && (
        <div className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-800">
          {notice}
        </div>
      )}
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatCurrency(n: number) {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
