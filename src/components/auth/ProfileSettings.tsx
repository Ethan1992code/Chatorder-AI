"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ProfileSettingsProps = {
  email?: string;
  initialUsername?: string;
};

export function ProfileSettings({
  email,
  initialUsername = "",
}: ProfileSettingsProps) {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const trimmedUsername = username.trim();

    if (trimmedUsername.length < 2) {
      setError("Username must be at least 2 characters.");
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          username: trimmedUsername,
        },
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setUsername(trimmedUsername);
      setNotice("Username saved.");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-lg border border-[#dce9e4] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Account settings</h2>
      <p className="mt-2 text-sm leading-6 text-[#536962]">
        Set the name shown across your ChatOrder AI workspace.
      </p>

      {email && (
        <p className="mt-4 rounded-lg bg-[#f2faf6] px-4 py-3 text-sm font-semibold text-[#1f6f5b]">
          {email}
        </p>
      )}

      {notice && (
        <div className="mt-4 rounded-lg border border-[#bfe1d4] bg-[#f2faf6] px-4 py-3 text-sm leading-6 text-[#1f6f5b]">
          {notice}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-[#f1c8bd] bg-[#fff6f3] px-4 py-3 text-sm leading-6 text-[#b4442d]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="space-y-2">
          <label htmlFor="profile-username" className="text-sm font-semibold">
            Username
          </label>
          <input
            id="profile-username"
            type="text"
            required
            minLength={2}
            maxLength={40}
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="h-12 w-full rounded-lg border border-[#c9d8d2] bg-white px-3.5 text-sm outline-none transition placeholder:text-[#8a9c96] focus:border-[#1f6f5b] focus:ring-4 focus:ring-[#1f6f5b]/10"
            placeholder="Your display name"
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#1f6f5b] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#175846] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        >
          {isSaving ? "Saving..." : "Save username"}
        </button>
      </form>
    </section>
  );
}
