import { AppFrameBody, AppFrameHeader, Button, Card, PageHeader } from '@mockups/_system';
import { finchUser } from '../fixtures';

export function Settings() {
  return (
    <>
      <AppFrameHeader>
        <div className="text-sm font-medium">Settings</div>
      </AppFrameHeader>
      <AppFrameBody>
        <PageHeader title="Settings" description="Manage your profile and preferences." />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="text-sm font-semibold">Profile</h2>
            <div className="mt-4 space-y-3 text-sm">
              <Row label="Name" value={finchUser.name} />
              <Row label="Email" value={finchUser.email} />
              <Row label="2FA" value="Enabled" />
            </div>
            <div className="mt-6">
              <Button>Edit profile</Button>
            </div>
          </Card>
          <Card>
            <h2 className="text-sm font-semibold">Preferences</h2>
            <div className="mt-4 space-y-3 text-sm">
              <Row label="Currency" value="USD" />
              <Row label="Language" value="English" />
              <Row label="Notifications" value="Email only" />
            </div>
          </Card>
        </div>
      </AppFrameBody>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-zinc-100 pb-2 last:border-0">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
