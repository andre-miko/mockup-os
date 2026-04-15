# Audience

## Primary — Returning retail customers

Returning retail customers who open Finch on weekday mornings to check balances and move money between their own accounts. They are tech-literate and goal-directed: they arrive knowing what they want to do and measure the product by how quickly it gets out of their way.

**Context of use.** Sessions are brief — typically under two minutes — often squeezed between commute steps or before a meeting. The device is a personal laptop or phone-sized browser window at responsive-web breakpoints.

**Goals.** Confirm current balance at a glance, initiate an internal transfer, and leave. Occasionally drill into a recent transaction to resolve a discrepancy.

**Pain points.** Slow overview renders break trust before the page is even usable. Ambiguous account labels cause hesitation when selecting a transfer source. Too many confirmation steps feel like friction on a routine task.

**Design implications.** The overview must render meaningful data in under one second. Account labels must be unambiguous without requiring the customer to open a detail view. Transfer flows should require the minimum number of taps to complete a repeat action.

## Secondary — Support staff

Support staff who shoulder-surf or co-navigate customer sessions during assisted service calls. They are not the account holder but need to read the same screen fluently to guide the customer without asking them to describe what they see.

**Context of use.** They view the product on a separate monitor alongside a CRM panel, or directly on the customer's shared screen. They may be managing several conversations simultaneously.

**Goals.** Quickly orient to the customer's account state, identify the relevant balance or transaction, and confirm the outcome of any action the customer takes.

**Pain points.** Visual hierarchy that differs from what the support script describes causes confusion. Anything that requires privileged access they don't have breaks the assisted flow mid-session.

**Design implications.** Hierarchy and labelling must be consistent enough that a support agent can navigate by verbal instruction alone. No element should be gated behind a permission that support staff would not hold during a standard customer session.
