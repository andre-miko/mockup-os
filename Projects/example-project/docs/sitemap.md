# Sitemap

Authored intent for the Finch product. `✅` entries are implemented; `✨`
entries are proposed but not yet built. The Mockup OS parses this file to
populate the Sitemap tab with ghost nodes so coverage gaps are visible.

## Section: overview

- /finch — Overview ✅ finch.overview
- /finch/notifications — Notifications ✨ proposed
  - Why: CX flagged that returning users miss balance alerts — we need an inbox surfaced from Overview.

## Section: accounts

- /finch/accounts — Accounts ✅ finch.accounts.list
- /finch/accounts/:accountId — Account detail ✅ finch.accounts.detail
- /finch/accounts/:accountId/transactions — Transactions detail ✨ proposed
  - Why: Engineering requested a drill-down from Account detail into a filterable transaction list.

## Section: transfers

- /finch/transfer — Transfer · Details ✅ finch.transfer.initiate
- /finch/transfer/review — Transfer · Review ✅ finch.transfer.review
- /finch/transfer/confirmed — Transfer · Confirmed ✅ finch.transfer.confirmed

## Section: settings

- /finch/settings — Settings ✅ finch.settings
