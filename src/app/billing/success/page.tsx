import Link from "next/link";

export default function BillingSuccessPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#fbfdfb] px-5 py-12 text-[#17231f] sm:px-8">
      <section className="w-full max-w-2xl rounded-lg border border-[#dce9e4] bg-white p-7 text-center shadow-[0_18px_50px_rgba(31,111,91,0.1)] sm:p-10">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#eaf7f0] text-2xl font-semibold text-[#1f6f5b]">
          ✓
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-[#1f6f5b]">
          Payment completed
        </p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
          Creem 正在同步你的订阅
        </h1>
        <p className="mt-5 text-base leading-8 text-[#536962]">
          付款已完成，订阅状态可能需要几秒钟通过 Creem Webhook
          同步。如果暂时没有看到 Pro 权限，请刷新页面或稍后查看 Billing
          页面。
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/billing"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-[#1f6f5b] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#175846]"
          >
            View billing
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-[#c9d8d2] bg-white px-5 text-sm font-semibold text-[#1f342d] transition hover:border-[#93b6a8]"
          >
            Back to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
