export type ChatMessageProps = {
  text: string;
  isBot: boolean;
  timestamp: string;
};

export type ChatMessages = ChatMessageProps[];
