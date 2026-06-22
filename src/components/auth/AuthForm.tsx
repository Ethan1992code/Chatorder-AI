"use client";

import { FormEvent, useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { createRequestId, logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
  message?: string;
  nextPath?: string;
};

function getSafeNextPath(nextPath?: string) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/dashboard";
  }

  return nextPath;
}

export function AuthForm({ mode, message, nextPath }: AuthFormProps) {
  const router = useRouter();
  const turnstileSiteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(message ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");

  const isLogin = mode === "login";
  const clearCaptchaToken = useCallback(() => setCaptchaToken(""), []);
  const handleCaptchaVerified = useCallback((token: string) => {
    setCaptchaToken(token);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setNotice("");

    if (!turnstileSiteKey) {
      setError("Human verification is not configured.");
      setIsLoading(false);
      return;
    }

    if (!captchaToken) {
      setError("Please complete the human verification.");
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const requestId = createRequestId();
    const eventPrefix = isLogin ? "auth_login" : "auth_signup";

    logger.info({
      event: `${eventPrefix}_started`,
      status: "started",
      message: isLogin ? "Login started." : "Signup started.",
      requestId,
    });

    try {
      if (isLogin) {
        const { data, error: loginError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
            options: {
              captchaToken,
            },
          });

        if (loginError) {
          logger.error({
            event: "auth_login_failed",
            status: "error",
            message: "Login failed.",
            requestId,
            providerCode: loginError.code,
          });
          clearCaptchaToken();
          setError(loginError.message);
          return;
        }

        logger.info({
          event: "auth_login_succeeded",
          status: "success",
          message: "Login succeeded.",
          requestId,
          userId: data.user.id,
        });
        router.replace(getSafeNextPath(nextPath));
        router.refresh();
        return;
      }

      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          captchaToken,
          data: {
            username: username.trim(),
          },
        },
      });

      if (signupError) {
        logger.error({
          event: "auth_signup_failed",
          status: "error",
          message: "Signup failed.",
          requestId,
          providerCode: signupError.code,
        });
        clearCaptchaToken();
        setError(signupError.message);
        return;
      }

      logger.info({
        event: "auth_signup_succeeded",
        status: "success",
        message: "Signup succeeded.",
        requestId,
        userId: data.user?.id,
        sessionCreated: Boolean(data.session),
      });

      if (data.session) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      router.replace(
        "/login?message=Account%20created.%20Please%20check%20your%20email%20if%20confirmation%20is%20enabled,%20then%20log%20in.",
      );
    } catch (caughtError) {
      logger.error({
        event: `${eventPrefix}_failed`,
        status: "error",
        message: isLogin
          ? "Login failed unexpectedly."
          : "Signup failed unexpectedly.",
        requestId,
        error: caughtError,
      });
      clearCaptchaToken();
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfdfb] px-5 py-8 text-[#17231f] sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <span className="grid size-9 place-items-center rounded-lg bg-[#1f6f5b] text-sm font-bold text-white">
            CO
          </span>
          <span>ChatOrder AI</span>
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-[#c9d8d2] bg-white px-4 py-2 text-sm font-semibold text-[#1f342d] transition hover:border-[#93b6a8]"
        >
          Back to site
        </Link>
      </div>

      <section className="mx-auto grid min-h-[calc(100vh-92px)] w-full max-w-6xl items-center py-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
        <div className="hidden lg:block">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1f6f5b]">
            ChatOrder workspace
          </p>
          <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-tight tracking-normal">
            Turn customer messages into replies your shop can send faster.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-[#536962]">
            Save your product details, draft stronger responses, and keep every
            sales conversation moving from one simple workspace.
          </p>
        </div>

        <div className="mx-auto w-full max-w-md rounded-lg border border-[#dce9e4] bg-white p-6 shadow-sm sm:p-8">
          <div>
            <h2 className="text-3xl font-semibold">
              {isLogin ? "Log in" : "Create account"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#536962]">
              {isLogin
                ? "Access your ChatOrder AI workspace."
                : "Start a protected ChatOrder AI workspace for your shop."}
            </p>
          </div>

          {notice && (
            <div className="mt-5 rounded-lg border border-[#bfe1d4] bg-[#f2faf6] px-4 py-3 text-sm leading-6 text-[#1f6f5b]">
              {notice}
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-lg border border-[#f1c8bd] bg-[#fff6f3] px-4 py-3 text-sm leading-6 text-[#b4442d]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-semibold">
                  Username
                </label>
                <input
                  id="username"
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
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 w-full rounded-lg border border-[#c9d8d2] bg-white px-3.5 text-sm outline-none transition placeholder:text-[#8a9c96] focus:border-[#1f6f5b] focus:ring-4 focus:ring-[#1f6f5b]/10"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 w-full rounded-lg border border-[#c9d8d2] bg-white px-3.5 text-sm outline-none transition placeholder:text-[#8a9c96] focus:border-[#1f6f5b] focus:ring-4 focus:ring-[#1f6f5b]/10"
                placeholder="At least 6 characters"
              />
            </div>

            <TurnstileWidget
              siteKey={turnstileSiteKey}
              onVerify={handleCaptchaVerified}
              onExpire={clearCaptchaToken}
              onError={clearCaptchaToken}
            />

            <button
              type="submit"
              disabled={isLoading || !captchaToken}
              className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#1f6f5b] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#175846] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading
                ? isLogin
                  ? "Logging in..."
                  : "Creating account..."
                : isLogin
                  ? "Log in"
                  : "Sign up"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#536962]">
            {isLogin ? "New to ChatOrder AI?" : "Already have an account?"}{" "}
            <Link
              href={isLogin ? "/signup" : "/login"}
              className="font-semibold text-[#1f6f5b] hover:text-[#175846]"
            >
              {isLogin ? "Create an account" : "Log in"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
