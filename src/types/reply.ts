export const platforms = [
  "Facebook",
  "Instagram",
  "WhatsApp",
  "TikTok",
  "Other",
] as const;

export const customerStages = [
  "New inquiry",
  "Asking price",
  "Price objection",
  "Follow-up",
  "Ready to buy",
] as const;

export const tones = [
  "Friendly",
  "Professional",
  "Short",
  "Strong closing",
] as const;

export const replyLanguages = [
  "English",
  "Spanish",
  "Portuguese",
  "Romanian",
  "French",
  "German",
] as const;

export type Platform = (typeof platforms)[number];
export type CustomerStage = (typeof customerStages)[number];
export type Tone = (typeof tones)[number];
export type ReplyLanguage = (typeof replyLanguages)[number];

export type ReplyRequest = {
  customerMessage: string;
  productName: string;
  productInfo: string;
  platform: Platform;
  customerStage: CustomerStage;
  tone: Tone;
  language: ReplyLanguage;
};

export type ReplyResult = {
  customer_intent: string;
  lead_quality: string;
  recommended_reply: string;
  short_reply: string;
  strong_closing_reply: string;
  follow_up_message: string;
  sales_strategy: string;
};
