---
name: x-auto-posting
description: Research and post to X automatically via Browser Relay. Use when asked to auto-post news/topics to X, schedule recurring X posts, draft concise Japanese posts from verified sources, or recover from relay/login posting failures.
---

# X Auto Posting

Use Browser Relay and cron to run reliable X posting workflows.

## Do this flow

1. Collect source links from credible outlets first.
2. Verify at least 2 sources before drafting.
3. Draft one short Japanese post in human tone.
4. Remove quotation marks, brackets, and emojis unless the user explicitly wants them.
5. Open `https://x.com/compose/post` in Browser Relay.
6. Paste the draft into the post box and publish.
7. Return posted text + post URL + sources.

## Posting style

- Keep it short and readable.
- Start with a strong first sentence.
- Include one concrete fact.
- Avoid overclaims.

## Failure handling

If Browser Relay or X login is unavailable, stop and send only a short fix instruction:

1. Re-attach Browser Relay on the X tab (badge ON)
2. Restart gateway: `openclaw gateway restart`
3. Confirm X login and retry

Do not claim posting success if publish confirmation is missing.

## Cron pattern

When asked for auto-posting, use an isolated cron job with `agentTurn` payload and announce delivery.

Recommended schedule examples:

- Hourly: `0 * * * *`
- Daily 21:00 JST: `0 21 * * *`

Include in payload:

- topic scope
- source requirements
- writing constraints
- output format: posted text + URL + sources
