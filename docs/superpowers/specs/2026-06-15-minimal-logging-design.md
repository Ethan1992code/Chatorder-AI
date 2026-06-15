# Minimal Logging Design

## Scope

Add structured JSON logging to the flows that currently exist: browser-side login and signup, the AI reply route, and the root Next.js error boundary.

The project does not currently contain business-record persistence, credits, subscriptions, or payment webhooks. No placeholder features or fake log calls will be added for those absent flows.

## Design

- `src/lib/logger.ts` owns log formatting, request ID creation, error normalization, and sensitive-field removal.
- Every entry includes `event`, `status`, `message`, `timestamp`, and `requestId`.
- Server logs use `console.info` or `console.error`; browser Auth and error-boundary logs use the same logger and therefore appear in the browser console.
- Auth logs exclude email, password, tokens, and Supabase session details.
- AI logs exclude customer messages, product details, prompts, provider credentials, and generated reply text.
- The AI route accepts an incoming `x-request-id` when present, otherwise creates one, and returns it in the response header.

## Events

- `auth_login_started`, `auth_login_succeeded`, `auth_login_failed`
- `auth_signup_started`, `auth_signup_succeeded`, `auth_signup_failed`
- `ai_reply_generate_started`, `ai_reply_generate_succeeded`, `ai_reply_generate_failed`
- `app_unhandled_error`

## Verification

Use Node's built-in test runner for the logger, then run TypeScript, ESLint, and the Next.js production build.
