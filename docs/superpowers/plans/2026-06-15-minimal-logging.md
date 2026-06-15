# Minimal Logging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a small, consistent, privacy-conscious logging layer to existing Auth, AI API, and global error flows.

**Architecture:** A dependency-free logger emits one structured object through `console.info` or `console.error`. Existing flows create or reuse a request ID and pass only non-sensitive metadata.

**Tech Stack:** Next.js 16.2.7, React 19, TypeScript, Node built-in test runner

---

### Task 1: Structured logger

**Files:**
- Create: `src/lib/logger.ts`
- Create: `src/lib/logger.test.ts`

- [ ] Write tests for required fields, request IDs, errors, and sensitive-field filtering.
- [ ] Run the tests and confirm they fail because the logger does not exist.
- [ ] Implement the smallest logger that satisfies the tests.
- [ ] Run the tests and confirm they pass.

### Task 2: Existing flow integration

**Files:**
- Modify: `src/components/auth/AuthForm.tsx`
- Modify: `src/app/api/generate-reply/route.ts`
- Create: `src/app/global-error.tsx`

- [ ] Add start, success, and failure events to login and signup without user credentials.
- [ ] Add correlated start, success, validation, authorization, provider, and exception events to the AI route.
- [ ] Add a root error boundary that logs unexpected render errors and offers retry.

### Task 3: Verification

**Files:**
- No additional files.

- [ ] Run `node --experimental-strip-types --test src/lib/logger.test.ts`.
- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
