"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "./LogoutButton";

export function UserNav() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (isMounted) {
        setEmail(user?.email ?? "");
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="hidden max-w-[220px] truncate rounded-lg bg-[#f2faf6] px-3 py-2 text-sm font-semibold text-[#1f6f5b] md:block">
        {email || "Signed in"}
      </div>
      <Link
        href="/dashboard"
        className="hidden rounded-lg border border-[#c9d8d2] bg-white px-4 py-2 text-sm font-semibold text-[#1f342d] transition hover:border-[#93b6a8] sm:inline-flex"
      >
        Dashboard
      </Link>
      <Link
        href="/"
        className="rounded-lg border border-[#c9d8d2] bg-white px-4 py-2 text-sm font-semibold text-[#1f342d] transition hover:border-[#93b6a8]"
      >
        Back to site
      </Link>
      <div className="hidden sm:block">
        <LogoutButton />
      </div>
    </div>
  );
}
