import type { FormEvent, ReactNode } from "react";
import {
  customerStages,
  platforms,
  replyLanguages,
  ReplyRequest,
  tones,
} from "@/types/reply";

type ReplyFormProps = {
  form: ReplyRequest;
  error: string;
  isLoading: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFillExample: (example: ReplyRequest) => void;
  onChange: <K extends keyof ReplyRequest>(
    key: K,
    value: ReplyRequest[K],
  ) => void;
};

const examples: Array<{ label: string; request: ReplyRequest }> = [
  {
    label: "Best price?",
    request: {
      customerMessage: "What is your best price for this? Can you give a discount?",
      productName: "Linen Tote Bag",
      productInfo:
        "$38 retail price, handmade linen tote, sage and black available, local delivery is $4.",
      platform: "Instagram",
      customerStage: "Asking price",
      tone: "Friendly",
      language: "English",
    },
  },
  {
    label: "Too expensive",
    request: {
      customerMessage: "That is too expensive. I saw similar bags cheaper.",
      productName: "Linen Tote Bag",
      productInfo:
        "$38, handmade linen, reinforced handles, washable fabric, same-day reservation available.",
      platform: "Facebook",
      customerStage: "Price objection",
      tone: "Professional",
      language: "English",
    },
  },
  {
    label: "Send catalog",
    request: {
      customerMessage: "Can you send me your catalog?",
      productName: "Spring Tote Collection",
      productInfo:
        "Includes linen totes, canvas shoppers, and mini crossbody bags from $22 to $48.",
      platform: "WhatsApp",
      customerStage: "New inquiry",
      tone: "Friendly",
      language: "English",
    },
  },
  {
    label: "Shipping cost?",
    request: {
      customerMessage: "How much is shipping to my city?",
      productName: "Linen Tote Bag",
      productInfo:
        "$38, local delivery $4, national shipping starts at $7, ships within 1 business day.",
      platform: "TikTok",
      customerStage: "Asking price",
      tone: "Short",
      language: "English",
    },
  },
  {
    label: "I will think about it",
    request: {
      customerMessage: "Thanks, I will think about it and let you know.",
      productName: "Linen Tote Bag",
      productInfo:
        "$38, limited sage stock, local delivery $4, same-day reservation available.",
      platform: "Instagram",
      customerStage: "Follow-up",
      tone: "Strong closing",
      language: "English",
    },
  },
];

export function ReplyForm({
  form,
  error,
  isLoading,
  onSubmit,
  onFillExample,
  onChange,
}: ReplyFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="h-fit rounded-lg border border-[#dce9e4] bg-white p-5 shadow-sm sm:p-6"
    >
      <div>
        <h1 className="text-2xl font-semibold">Generate Sales Reply</h1>
        <p className="mt-2 text-sm leading-6 text-[#536962]">
          Fill in the customer context and get replies your shop can send
          quickly.
        </p>
      </div>

      <div className="mt-6 space-y-5">
        <div className="rounded-lg border border-[#dce9e4] bg-[#f7fbf8] p-4">
          <p className="text-sm font-semibold text-[#17231f]">
            Try an example
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {examples.map((example) => (
              <button
                key={example.label}
                type="button"
                disabled={isLoading}
                onClick={() => onFillExample(example.request)}
                className="min-h-10 rounded-lg border border-[#c9d8d2] bg-white px-3 py-2 text-left text-sm font-semibold text-[#1f342d] transition hover:border-[#93b6a8] hover:bg-[#f2faf6] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="customerMessage">Customer Message</FieldLabel>
          <textarea
            id="customerMessage"
            required
            value={form.customerMessage}
            onChange={(event) =>
              onChange("customerMessage", event.target.value)
            }
            placeholder="Paste the customer message here..."
            className="min-h-32 w-full resize-y rounded-lg border border-[#c9d8d2] bg-white px-3.5 py-3 text-sm leading-6 outline-none transition placeholder:text-[#8a9c96] focus:border-[#1f6f5b] focus:ring-4 focus:ring-[#1f6f5b]/10"
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="productName">Product Name</FieldLabel>
          <input
            id="productName"
            required
            value={form.productName}
            onChange={(event) => onChange("productName", event.target.value)}
            placeholder="e.g., Linen Tote Bag"
            className="h-11 w-full rounded-lg border border-[#c9d8d2] bg-white px-3.5 text-sm outline-none transition placeholder:text-[#8a9c96] focus:border-[#1f6f5b] focus:ring-4 focus:ring-[#1f6f5b]/10"
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="productInfo">Product Info</FieldLabel>
          <textarea
            id="productInfo"
            required
            value={form.productInfo}
            onChange={(event) => onChange("productInfo", event.target.value)}
            placeholder="Include price, availability, delivery, variants, and any buying steps."
            className="min-h-28 w-full resize-y rounded-lg border border-[#c9d8d2] bg-white px-3.5 py-3 text-sm leading-6 outline-none transition placeholder:text-[#8a9c96] focus:border-[#1f6f5b] focus:ring-4 focus:ring-[#1f6f5b]/10"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <SelectField
            id="platform"
            label="Platform"
            value={form.platform}
            options={platforms}
            onChange={(value) => onChange("platform", value)}
          />
          <SelectField
            id="customerStage"
            label="Customer Stage"
            value={form.customerStage}
            options={customerStages}
            onChange={(value) => onChange("customerStage", value)}
          />
          <SelectField
            id="tone"
            label="Tone"
            value={form.tone}
            options={tones}
            onChange={(value) => onChange("tone", value)}
          />
          <SelectField
            id="language"
            label="Language"
            value={form.language}
            options={replyLanguages}
            onChange={(value) => onChange("language", value)}
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-[#ffd6cc] bg-[#fff2ed] px-4 py-3"
        >
          <p className="text-sm font-semibold text-[#b84e37]">
            Could not generate reply
          </p>
          <p className="mt-1 text-sm leading-6 text-[#7c3c2f]">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#1f6f5b] px-5 text-base font-semibold text-white shadow-sm transition hover:bg-[#175846] disabled:cursor-not-allowed disabled:bg-[#85aaa0]"
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Generating reply...
          </span>
        ) : (
          "Generate Reply"
        )}
      </button>
    </form>
  );
}

function FieldLabel({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor: string;
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-semibold text-[#17231f]">
      {children}
    </label>
  );
}

function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-11 w-full rounded-lg border border-[#c9d8d2] bg-white px-3.5 text-sm outline-none transition focus:border-[#1f6f5b] focus:ring-4 focus:ring-[#1f6f5b]/10"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
