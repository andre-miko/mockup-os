import { Link } from 'react-router-dom';
import { AppFrameBody, AppFrameHeader, Button, Card, PageHeader } from '@mockups/_system';
import { useFixture } from '@framework/hooks';
import type { Account } from '../fixtures';
import { WizardSteps } from './wizard';

export function TransferReview() {
  const draft = useFixture<{
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    memo: string;
  }>('finch.transfer.draft')?.data;
  const accounts = useFixture<Account[]>('finch.accounts.default')?.data ?? [];
  const from = accounts.find((a) => a.id === draft?.fromAccountId);
  const to = accounts.find((a) => a.id === draft?.toAccountId);

  return (
    <>
      <AppFrameHeader>
        <div className="text-sm font-medium">Review transfer</div>
      </AppFrameHeader>
      <AppFrameBody>
        <WizardSteps current={1} />
        <PageHeader
          title="Ready to send?"
          description="Double-check the details before confirming."
        />
        <Card className="max-w-xl">
          <dl className="divide-y divide-zinc-100">
            <Row label="From" value={from ? `${from.name} · ···· ${from.last4}` : '—'} />
            <Row label="To" value={to ? `${to.name} · ···· ${to.last4}` : '—'} />
            <Row
              label="Amount"
              value={draft ? `$${draft.amount.toFixed(2)}` : '—'}
              emphasize
            />
            <Row label="Memo" value={draft?.memo ?? '—'} />
            <Row label="Arrives" value="Instantly" />
            <Row label="Fee" value="$0.00" />
          </dl>
          <div className="mt-6 flex justify-end gap-2">
            <Link to="/finch/transfer"><Button variant="ghost">Back</Button></Link>
            <Link to="/finch/transfer/confirmed">
              <Button variant="primary">Send $250.00</Button>
            </Link>
          </div>
        </Card>
      </AppFrameBody>
    </>
  );
}

function Row({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex justify-between py-3">
      <dt className="text-xs uppercase tracking-wider text-zinc-500">{label}</dt>
      <dd className={emphasize ? 'text-lg font-semibold' : 'text-sm font-medium'}>
        {value}
      </dd>
    </div>
  );
}
