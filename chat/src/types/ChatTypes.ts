export type ChatMessageProps = {
  text: string;
  isBot: boolean;
  timestamp?: string;
};

export type ChatMessages = ChatMessageProps[];

export type ChatConversation = {
  id: string;
  messages: ChatMessages;
};

export type ChatState = {
  conversations: { [id: string]: ChatConversation };
};
