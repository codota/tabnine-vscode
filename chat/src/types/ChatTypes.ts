import { EditorContext } from "../hooks/useEditorContext";

export type ChatMessageProps = {
  id?: string;
  conversationId: string;
  text: string;
  isBot: boolean;
  timestamp?: string;
  editorContext?: EditorContext;
};

export type ChatMessages = ChatMessageProps[];

export type ChatConversation = {
  id: string;
  messages: ChatMessages;
};

export type ChatState = {
  conversations: { [id: string]: ChatConversation };
};

export type MessageResponse = {
  id: string;
  content: string;
};
