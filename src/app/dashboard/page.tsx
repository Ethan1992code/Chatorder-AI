import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#fbfdfb] text-[#17231f]">
      <header className="border-b border-[#dce9e4] bg-white/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <span className="grid size-9 place-items-center rounded-lg bg-[#1f6f5b] text-sm font-bold text-white">
              CO
            </span>
            <span>ChatOrder AI</span>
          </Link>
          <LogoutButton />
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1f6f5b]">
              Dashboard
            </p>
            <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
              Welcome back to your ChatOrder AI workspace.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#536962]">
              Manage reply drafting, customer knowledge, and future shop
              workflows from this protected area.
            </p>
          </div>

          <section className="rounded-lg border border-[#dce9e4] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Current user</h2>
            <p className="mt-3 rounded-lg bg-[#f2faf6] px-4 py-3 text-sm font-semibold text-[#1f6f5b]">
              {user.email}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                href="/app"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-[#1f6f5b] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#175846]"
              >
                Open reply generator
              </Link>
              <Link
                href="/dashboard/email"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-[#17231f] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#274139]"
              >
                Send email
              </Link>
              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-[#c9d8d2] bg-white px-4 text-sm font-semibold text-[#1f342d] transition hover:border-[#93b6a8]"
              >
                Back to site
              </Link>
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {[
            {
              title: "Reply drafting",
              body: "Generate sales-ready replies from customer messages and product details.",
            },
            {
              title: "Knowledge base",
              body: "Keep product catalogs, shipping rules, FAQs, and brand notes close to the AI.",
            },
            {
              title: "Email sending",
              body: "Send customer follow-ups and order replies through a protected email API.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-lg border border-[#dce9e4] bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#536962]">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
