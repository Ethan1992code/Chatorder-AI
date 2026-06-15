# AGENTS.md

## 1. Project Principle

This project follows the lowest-cost MVP principle.

The goal is to build a simple, usable, and maintainable AI software product with the minimum necessary code, features, dependencies, and infrastructure.

Do not over-engineer.

Do not build complex systems before there is real user demand.

Do not add unnecessary features.

Do not rewrite existing code unless it is required for the current task.

---

## 2. Product Goal

Build an AI software product that helps users solve one clear problem.

The product should be:

* Simple to understand
* Fast to test
* Cheap to run
* Easy to modify
* Easy to deploy
* Easy to maintain by one person

---

## 3. Development Rules

Before making any code changes:

1. Read this `AGENTS.md` file.
2. Understand the current project structure.
3. Make the smallest possible change.
4. Do not modify unrelated files.
5. Do not introduce new dependencies unless necessary.
6. Do not change the database schema unless explicitly requested.
7. Do not change environment variable names unless explicitly requested.
8. Do not rewrite working code just to make it look better.
9. Do not create duplicate components, functions, or folders.
10. Keep the code simple and readable.

---

## 4. Architecture Rules

Keep the project modular and easy to understand.

Recommended structure:

```txt
app/              # Pages and routes
components/       # Reusable UI components
lib/              # Business logic and server-side utilities
lib/ai/           # AI prompt and AI API logic
lib/db/           # Database logic
lib/auth/         # Authentication logic
public/           # Static assets
docs/             # Product and architecture documents
```

Rules:

* UI logic should stay in UI components.
* AI prompt logic should stay in `lib/ai`.
* Database logic should stay in `lib/db`.
* Authentication logic should stay in `lib/auth`.
* API routes should only connect inputs, business logic, and outputs.
* Do not mix UI, database, API, and AI prompt logic in one file.

---

## 5. MVP Feature Rules

Only build features that are necessary for the first usable version.

Allowed MVP features:

* Landing page
* User login
* One core AI function
* Basic result display
* Simple history or saved records if necessary
* Basic pricing page if needed
* Simple deployment to Vercel

Avoid at the MVP stage:

* Complex admin panel
* Complex analytics
* Multi-role permission system
* Overly advanced UI animation
* Too many AI modes
* Too many settings
* Unnecessary dashboards
* Unnecessary third-party integrations

---

## 6. Cost Control Rules

Prefer free or low-cost tools.

Default choices:

* Frontend: Next.js + TypeScript
* Deployment: Vercel
* Database/Auth: Supabase
* Email: Resend
* AI API: OpenAI, DeepSeek, or OpenRouter
* Styling: Tailwind CSS if already installed

Rules:

* Do not add paid services unless explicitly requested.
* Do not add background jobs unless necessary.
* Do not add queues, workers, or microservices at MVP stage.
* Do not add complex cloud infrastructure.
* Do not use expensive AI models by default.
* Use environment variables for all API keys.

---

## 7. Code Quality Rules

Code should be:

* Simple
* Clear
* Modular
* Easy to delete
* Easy to test
* Easy for a solo founder to understand

Avoid:

* Large files
* Deep abstraction
* Duplicate logic
* Unused code
* Unused imports
* Hardcoded secrets
* Overly clever solutions
* Changing many files for a small task

---

## 8. Safety Rules

Never hardcode secrets.

Never expose private API keys to the browser.

Use environment variables for sensitive values.

Required pattern:

```txt
OPENAI_API_KEY=
DEEPSEEK_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Only variables starting with `NEXT_PUBLIC_` may be exposed to the frontend.

---

## 9. Task Execution Rules

For every task:

1. Restate the task briefly.
2. Identify the files that need to be changed.
3. Make the smallest possible change.
4. Avoid touching unrelated files.
5. Run TypeScript checks if available.
6. Explain what changed.
7. Explain how to test it.

After code changes, run:

```bash
npx tsc --noEmit
```

If the project has a build script, also run:

```bash
npm run build
```

---

## 10. Forbidden Behaviors

Do not:

* Rewrite the whole project
* Change the product direction without permission
* Add unnecessary dependencies
* Add unnecessary folders
* Add mock features and call them complete
* Break existing working pages
* Mix frontend and backend logic carelessly
* Create multiple competing versions of the same component
* Change database schema without explicit instruction
* Store API keys in code
* Build features that were not requested

---

## 11. Default Working Style

Always prefer:

* Small steps
* Clear files
* Simple implementation
* One task at a time
* MVP first
* Manual testing before automation
* Low cost before scalability
* Clarity before cleverness

The best solution is the simplest solution that works.
