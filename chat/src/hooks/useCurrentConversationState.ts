import { useState } from "react";
import { ChatConversation, ChatMessages } from "../types/ChatTypes";

type CurrentConversationStateResponse = {
  currentConversation: ChatConversation | null;
  setCurrentConversation: React.Dispatch<
    React.SetStateAction<ChatConversation | null>
  >;
  conversationMessages: ChatMessages;
  setConversationMessages: React.Dispatch<React.SetStateAction<ChatMessages>>;
  resetCurrentConversation: () => void;
  setCurrentConversationData: (conversation: ChatConversation) => void;
};

export function useCurrentConversationState(): CurrentConversationStateResponse {
  const [
    currentConversation,
    setCurrentConversation,
  ] = useState<ChatConversation | null>(null);
  const [
    conversationMessages,
    setConversationMessages,
  ] = useState<ChatMessages>([]);

  const resetCurrentConversation = () => {
    setCurrentConversation(null);
    setConversationMessages([]);
  };

  const setCurrentConversationData = (conversation: ChatConversation) => {
    setCurrentConversation(conversation);
    setConversationMessages(conversation.messages);
  };

  return {
    currentConversation,
    setCurrentConversation,
    conversationMessages,
    setConversationMessages,
    resetCurrentConversation,
    setCurrentConversationData,
  };
}
