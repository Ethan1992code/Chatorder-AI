const salesNextStepHref =
  "mailto:hello@chatorder.ai?subject=ChatOrder%20AI%20demo%20request&body=Hi%20ChatOrder%20AI%2C%0A%0AI%20want%20to%20see%20whether%20this%20fits%20our%20shop.%0A%0AShop%20name%3A%0ASales%20channels%3A%0AMessages%20per%20day%3A%0A";

const proofPoints = [
  "Answers price, stock, delivery, and payment questions",
  "Keeps every reply pointed toward checkout or reservation",
  "Gives owners one consistent script for staff to follow",
];

const qualificationSignals = [
  "You sell through Instagram, Facebook, TikTok, WhatsApp, or DMs.",
  "Customers ask the same product and delivery questions every day.",
  "Slow replies mean people disappear before they place an order.",
];

const workflowSteps = [
  {
    title: "Show us your real customer messages",
    description:
      "We review the questions that actually slow your team down: price, stock, shipping, payment, pickup, and product fit.",
  },
  {
    title: "Turn those messages into sales-ready replies",
    description:
      "ChatOrder AI drafts clear responses that answer the question and move the buyer to checkout, reservation, or the next selling step.",
  },
  {
    title: "Start with the conversations worth saving",
    description:
      "If the workflow fits, your team gets a simple workspace for replying faster without changing the channels you already use.",
  },
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
          <a href="#fit" className="transition hover:text-[#17231f]">
            Who it is for
          </a>
          <a href="#workflow" className="transition hover:text-[#17231f]">
            Next step
          </a>
          <a href="#demo" className="transition hover:text-[#17231f]">
            Demo
          </a>
        </nav>
        <a
          href="/login"
          className="rounded-lg bg-[#17231f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#274139]"
        >
          Sign up / Log in
        </a>
      </header>

      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-18 pt-10 sm:px-8 lg:grid-cols-[0.92fr_1fr] lg:pb-24 lg:pt-16">
        <div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-normal text-[#13201c] sm:text-6xl lg:text-7xl">
            Turn customer DMs into paid orders.
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-8 text-[#536962]">
            ChatOrder AI helps small shops reply faster, answer buying
            questions clearly, and move each conversation toward checkout
            instead of another open tab.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href={salesNextStepHref}
              className="inline-flex items-center justify-center rounded-lg bg-[#1f6f5b] px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-[#175846]"
            >
              Request a 15-minute demo
            </a>
            <a
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg border border-[#c9d8d2] bg-white px-6 py-3.5 text-base font-semibold text-[#1f342d] transition hover:border-[#93b6a8]"
            >
              Create workspace
            </a>
          </div>
          <p className="mt-4 text-sm leading-6 text-[#667a73]">
            Best for shops already receiving daily social messages from buyers.
          </p>
        </div>

        <div className="rounded-[24px] border border-[#d7e5df] bg-white p-4 shadow-[0_24px_70px_rgba(31,111,91,0.14)]">
          <div className="rounded-[18px] bg-[#f2faf6] p-4 sm:p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#213b34]">
                  Sales reply desk
                </p>
                <p className="text-xs text-[#6a8178]">Instagram buyer message</p>
              </div>
              <div className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#1f6f5b] shadow-sm">
                Ready to send
              </div>
            </div>

            <div className="space-y-4">
              <div className="ml-auto max-w-[86%] rounded-2xl rounded-tr-md bg-white px-4 py-3 text-sm leading-6 text-[#324640] shadow-sm">
                Hi! Is the sage linen tote still available? How much with
                delivery, and can I pay today?
              </div>
              <div className="max-w-[90%] rounded-2xl rounded-tl-md bg-[#1f6f5b] px-4 py-3 text-sm leading-6 text-white shadow-sm">
                Yes, the sage linen tote is in stock. It is $38, local delivery
                is $4, and I can reserve one for you today. Send your delivery
                address and I will share the checkout link.
              </div>
              <div className="grid gap-3 rounded-2xl border border-[#d6e6df] bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-normal text-[#d7654d]">
                    Selling move
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#314840]">
                    Confirms availability, names the price, and asks for the
                    exact detail needed to close.
                  </p>
                </div>
                <a
                  href={salesNextStepHref}
                  className="inline-flex items-center justify-center rounded-lg bg-[#17231f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#274139]"
                >
                  See this live
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#e1ece7] bg-white px-5 py-10 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          {proofPoints.map((point) => (
            <div key={point} className="flex gap-3">
              <span className="mt-2 size-2 shrink-0 rounded-full bg-[#1f6f5b]" />
              <p className="text-base leading-7 text-[#536962]">{point}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="fit" className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
              If these messages are costing you orders, the demo is worth your
              time.
            </h2>
            <p className="mt-4 text-lg leading-8 text-[#536962]">
              This page has one job: find shops with active buyer conversations
              and move them into a quick fit check.
            </p>
          </div>
          <div className="grid gap-4">
            {qualificationSignals.map((signal, index) => (
              <article
                key={signal}
                className="rounded-lg border border-[#dce9e4] bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-semibold text-[#1f6f5b]">
                  Signal {index + 1}
                </p>
                <p className="mt-2 text-lg leading-8 text-[#314840]">
                  {signal}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="bg-[#eaf7f0] px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
              The next step is not a newsletter. It is a sales conversation.
            </h2>
            <p className="mt-4 text-lg leading-8 text-[#536962]">
              A short demo should prove whether ChatOrder AI can help your team
              turn common messages into repeatable selling replies.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-lg bg-white p-6 shadow-sm"
              >
                <div className="mb-8 grid size-11 place-items-center rounded-lg bg-[#1f6f5b] text-sm font-bold text-white">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold text-[#17231f]">
                  {step.title}
                </h3>
                <p className="mt-3 text-base leading-7 text-[#536962]">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
              Bring one real message. Leave knowing the next sales reply.
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#536962]">
              Send a sample customer question when you request the demo. We will
              show how ChatOrder AI answers it, adds the buying step, and keeps
              the tone natural for your shop.
            </p>
          </div>
          <div className="rounded-lg border border-[#dce9e4] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-normal text-[#d7654d]">
              Demo agenda
            </p>
            <ul className="mt-5 space-y-4 text-base leading-7 text-[#536962]">
              <li>Review your message volume and channels.</li>
              <li>Draft replies from your actual buyer questions.</li>
              <li>Decide whether to create a workspace for your team.</li>
            </ul>
            <a
              href={salesNextStepHref}
              className="mt-7 inline-flex w-full items-center justify-center rounded-lg bg-[#1f6f5b] px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-[#175846]"
            >
              Request demo
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
