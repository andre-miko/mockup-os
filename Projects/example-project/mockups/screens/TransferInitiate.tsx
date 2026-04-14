import { Link } from 'react-router-dom';
import { AppFrameBody, AppFrameHeader, Button, Card, PageHeader } from '@mockups/_system';
import { useFixture } from '@framework/hooks';
import type { Account } from '../fixtures';
import { WizardSteps } from './wizard';

export function TransferInitiate() {
  const accounts = useFixture<Account[]>('finch.accounts.default')?.data ?? [];
  return (
    <>
      <AppFrameHeader>
        <div className="text-sm font-medium">Send money</div>
      </AppFrameHeader>
      <AppFrameBody>
        <WizardSteps current={0} />
        <PageHeader
          title="Where to?"
          description="Move money between your accounts or send to someone else."
        />
        <Card>
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="From">
              <select className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm">
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} · {formatCurrency(a.balance)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="To">
              <select className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm">
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Amount">
              <div className="flex">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-500">
                  $
                </span>
                <input
                  type="text"
                  defaultValue="250.00"
                  className="w-full rounded-r-md border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>
            </Field>
            <Field label="Memo">
              <input
                type="text"
                defaultValue="Monthly savings"
                className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
              />
            </Field>
          </form>
          <div className="mt-6 flex justify-end gap-2">
            <Link to="/finch"><Button variant="ghost">Cancel</Button></Link>
            <Link to="/finch/transfer/review">
              <Button variant="primary">Review transfer</Button>
            </Link>
          </div>
        </Card>
      </AppFrameBody>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      {children}
    </label>
  );
}

function formatCurrency(n: number) {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
