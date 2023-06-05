import { useEffect, useState } from "react";
import { ChatConversation, ChatMessages } from "../types/ChatTypes";
import { sendRequestToExtension } from "./ExtensionCommunicationProvider";
import { useChatDataState } from "./useChatDataState";

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
  const { updateConversation } = useChatDataState();

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

  useEffect(() => {
    if (currentConversation && conversationMessages.length > 0) {
      const updatedConversation = {
        id: currentConversation.id,
        messages: conversationMessages,
      };

      updateConversation(updatedConversation);
      void sendRequestToExtension<ChatConversation, void>({
        command: "update_chat_conversation",
        data: updatedConversation,
      });
    }
  }, [currentConversation, conversationMessages, updateConversation]);

  return {
    currentConversation,
    setCurrentConversation,
    conversationMessages,
    setConversationMessages,
    resetCurrentConversation,
    setCurrentConversationData,
  };
}
