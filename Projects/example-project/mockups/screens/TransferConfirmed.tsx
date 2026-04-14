import { Link } from 'react-router-dom';
import { AppFrameBody, AppFrameHeader, Button, Card } from '@mockups/_system';
import { WizardSteps } from './wizard';

export function TransferConfirmed() {
  return (
    <>
      <AppFrameHeader>
        <div className="text-sm font-medium">Transfer sent</div>
      </AppFrameHeader>
      <AppFrameBody>
        <WizardSteps current={2} />
        <Card className="mx-auto max-w-xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            ✓
          </div>
          <h2 className="mt-4 text-xl font-semibold">$250.00 is on its way</h2>
          <p className="mt-1 text-sm text-zinc-500">
            We sent it to Emergency Savings. You'll see it post shortly.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link to="/finch"><Button>Back to overview</Button></Link>
            <Link to="/finch/transfer">
              <Button variant="primary">Send another</Button>
            </Link>
          </div>
        </Card>
      </AppFrameBody>
    </>
  );
}
