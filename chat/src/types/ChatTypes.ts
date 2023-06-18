import { EditorContext } from "../hooks/useEditorContext";
import { Intent } from "../utils/slashCommands";

export type ChatMessageProps = {
  id?: string;
  conversationId: string;
  text: string;
  isBot: boolean;
  timestamp?: string;
  editorContext?: EditorContext;
  intent?: Intent;
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
