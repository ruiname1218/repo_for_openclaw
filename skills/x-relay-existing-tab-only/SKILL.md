---
name: x-relay-existing-tab-only
description: Enforce strict X posting through OpenClaw Browser Relay using only the already attached existing X tab. Use when posting or auto-posting to X, and when preventing accidental new-tab opens or navigation to fresh X tabs.
---

# X Relay Existing Tab Only

## Goal

Post to X safely by operating only the currently attached Relay tab.

## Hard rules

1. Never open a new X tab.
2. Never navigate a non-attached tab to X.
3. Only act on the existing attached X tab from Browser Relay.
4. If attached tab is missing, stale, or not operable, stop and request Relay re-attach.
5. Do not claim posting success without visible post confirmation or post URL.

## Required workflow

1. Call browser status/tabs using profile `chrome`.
2. Select the currently attached X tab only.
3. Attempt snapshot/action on that tab.
4. If tab cannot be resolved (for example tab not found), stop and return reconnect instructions.
5. If posting succeeds, return posted text + post URL.

## Reconnect instructions template

- Open the target X tab in Chrome.
- Click OpenClaw Browser Relay extension on that exact tab until badge is ON.
- Keep that tab open and logged in.
- Retry posting.

## Success criteria

- Existing attached X tab was used.
- No new X tab was opened.
- Final response includes post URL.
