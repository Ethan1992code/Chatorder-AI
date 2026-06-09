const features = [
  {
    title: "Instant reply drafts",
    description:
      "Turn messy DMs about price, stock, colors, and delivery into a polished response your team can send fast.",
  },
  {
    title: "Sales-ready details",
    description:
      "Include the right product notes, payment next steps, and pickup or delivery options without rewriting every message.",
  },
  {
    title: "Built for small shops",
    description:
      "Simple enough for a busy owner, helpful enough for part-time staff, and focused on everyday customer conversations.",
  },
];

const steps = [
  "Paste or connect a customer message",
  "Review the suggested sales reply",
  "Send it back with confidence",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fbfdfb] text-[#17231f]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <a href="#" className="flex items-center gap-3 font-semibold">
          <span className="grid size-9 place-items-center rounded-lg bg-[#1f6f5b] text-sm font-bold text-white">
            CO
          </span>
          <span>ChatOrder AI</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm font-medium text-[#52645e] md:flex">
          <a href="#problem" className="transition hover:text-[#17231f]">
            Problem
          </a>
          <a href="#features" className="transition hover:text-[#17231f]">
            Features
          </a>
          <a href="#how-it-works" className="transition hover:text-[#17231f]">
            How it works
          </a>
        </nav>
        <a
          href="/app"
          className="rounded-lg bg-[#17231f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#274139]"
        >
          Start drafting
        </a>
      </header>

      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1fr_0.92fr] lg:pb-24 lg:pt-16">
        <div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-normal text-[#13201c] sm:text-6xl lg:text-7xl">
            ChatOrder AI
          </h1>
          <p className="mt-6 max-w-xl text-xl leading-8 text-[#536962]">
            Turn social media customer messages into sales-ready replies so your
            shop can answer faster, sound clearer, and close more orders.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="/app"
              className="inline-flex items-center justify-center rounded-lg bg-[#1f6f5b] px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-[#175846]"
            >
              Try the reply workflow
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-lg border border-[#c9d8d2] bg-white px-6 py-3.5 text-base font-semibold text-[#1f342d] transition hover:border-[#93b6a8]"
            >
              See how it works
            </a>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#d7e5df] bg-white p-4 shadow-[0_24px_70px_rgba(31,111,91,0.14)]">
          <div className="rounded-[22px] bg-[#f2faf6] p-4 sm:p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#213b34]">
                  Message desk
                </p>
                <p className="text-xs text-[#6a8178]">Instagram inquiry</p>
              </div>
              <div className="flex gap-1.5">
                <span className="size-2.5 rounded-full bg-[#ff8f6b]" />
                <span className="size-2.5 rounded-full bg-[#f4c86a]" />
                <span className="size-2.5 rounded-full bg-[#6fc49b]" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="ml-auto max-w-[82%] rounded-2xl rounded-tr-md bg-white px-4 py-3 text-sm leading-6 text-[#324640] shadow-sm">
                Hi! Is the linen tote still available in sage? How much with
                delivery?
              </div>
              <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-[#1f6f5b] px-4 py-3 text-sm leading-6 text-white shadow-sm">
                Yes, the sage linen tote is in stock. It is $38, and local
                delivery is $4. I can reserve one for you today.
              </div>
              <div className="rounded-2xl border border-[#d6e6df] bg-white p-4">
                <p className="text-xs font-semibold uppercase text-[#d7654d]">
                  Suggested next step
                </p>
                <p className="mt-2 text-sm leading-6 text-[#314840]">
                  Ask for delivery address and offer same-day checkout link.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="problem"
        className="border-y border-[#e1ece7] bg-white px-5 py-20 sm:px-8"
      >
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Shop messages move quickly. Sales often do not.
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              "Questions arrive across multiple social channels.",
              "Staff rewrite the same answers over and over.",
              "Potential buyers wait while details get checked.",
            ].map((item) => (
              <div key={item} className="rounded-lg bg-[#f7fbf8] p-5">
                <p className="text-base leading-7 text-[#536962]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Clear replies for real customer questions.
          </h2>
          <p className="mt-4 text-lg leading-8 text-[#536962]">
            ChatOrder AI keeps the response practical: answer the question,
            mention the buying step, and make the customer feel looked after.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className="rounded-lg border border-[#dce9e4] bg-white p-6 shadow-sm"
            >
              <div className="mb-8 grid size-11 place-items-center rounded-lg bg-[#fff2ed] text-sm font-bold text-[#d7654d]">
                0{index + 1}
              </div>
              <h3 className="text-xl font-semibold text-[#17231f]">
                {feature.title}
              </h3>
              <p className="mt-3 text-base leading-7 text-[#536962]">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="how-it-works"
        className="bg-[#eaf7f0] px-5 py-20 sm:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
                From customer message to ready reply in three steps.
              </h2>
              <p className="mt-4 text-lg leading-8 text-[#536962]">
                Keep your process lightweight while giving each customer a
                helpful, order-focused answer.
              </p>
            </div>
            <ol className="space-y-4">
              {steps.map((step, index) => (
                <li
                  key={step}
                  className="flex gap-5 rounded-lg bg-white p-5 shadow-sm"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#1f6f5b] text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">{step}</h3>
                    <p className="mt-2 text-base leading-7 text-[#536962]">
                      {index === 0 &&
                        "Bring in the message exactly as the customer wrote it."}
                      {index === 1 &&
                        "Adjust tone, product details, and next steps before sending."}
                      {index === 2 &&
                        "Reply through your normal social channel and keep the order moving."}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="cta" className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl rounded-[28px] bg-[#17231f] px-6 py-14 text-center text-white sm:px-10">
          <h2 className="mx-auto max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">
            Help every shop message become a better sales moment.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#c9d8d2]">
            Start with reply drafting today. Add deeper workflows later when
            your shop is ready.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="mailto:hello@chatorder.ai"
              className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3.5 text-base font-semibold text-[#17231f] transition hover:bg-[#eef6f2]"
            >
              Request early access
            </a>
            <a
              href="mailto:hello@chatorder.ai?subject=ChatOrder%20AI%20feedback"
              className="inline-flex items-center justify-center rounded-lg border border-[#5b746d] px-6 py-3.5 text-base font-semibold text-white transition hover:border-[#c9d8d2] hover:bg-white/10"
            >
              Send feedback
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
