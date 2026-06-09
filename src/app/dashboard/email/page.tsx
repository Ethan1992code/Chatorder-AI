import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { EmailComposer } from "@/components/email/EmailComposer";
import { createClient } from "@/lib/supabase/server";

export default async function EmailPage() {
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
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg border border-[#c9d8d2] bg-white px-4 py-2 text-sm font-semibold text-[#1f342d] transition hover:border-[#93b6a8]"
            >
              Dashboard
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1f6f5b]">
            Email module
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-normal">
            Send sales emails from ChatOrder AI.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#536962]">
            Signed in as {user.email}. This module is ready for manual sending
            now, and can later power automated follow-ups.
          </p>
        </div>

        <EmailComposer />
      </section>
    </main>
  );
}
