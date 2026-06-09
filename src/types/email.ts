export type EmailSendRequest = {
  to: string;
  subject: string;
  body: string;
  replyTo?: string;
};

export type EmailSendResult = {
  id: string;
};
