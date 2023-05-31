import constate from "constate";
import { useCallback, useEffect, useState } from "react";
import {
  ChatConversation,
  ChatMessageProps,
  ChatMessages,
} from "../types/ChatTypes";
import { v4 as uuidv4 } from "uuid";
import Events from "../utils/events";
import { useChatDataState } from "./useChatDataState";
import { useCurrentConversationState } from "./useCurrentConversationState";

type ChatStateResponse = {
  currentConversation: ChatConversation | null;
  conversationMessages: ChatMessages;
  isBotTyping: boolean;
  conversations: { [id: string]: ChatConversation };
  setIsBotTyping(isBotTyping: boolean): void;
  addMessage(message: ChatMessageProps): void;
  submitUserMessage(userText: string): void;
  setCurrentConversationData(conversation: ChatConversation): void;
  goToHistory(): void;
  createNewConversation(): void;
  clearAllConversations(): void;
};

function useCreateChatState(): ChatStateResponse {
  const {
    chatData,
    removeConversation,
    updateConversation,
  } = useChatDataState();

  const {
    currentConversation,
    setCurrentConversation,
    conversationMessages,
    setConversationMessages,
    resetCurrentConversation,
    setCurrentConversationData,
  } = useCurrentConversationState();

  const [isBotTyping, setIsBotTyping] = useState(false);

  const createNewConversation = useCallback(() => {
    const newId = uuidv4();
    const newConversation = {
      id: newId,
      messages: [],
    };
    updateConversation(newId, newConversation);
    setCurrentConversation(newConversation);
    setConversationMessages([]);
  }, []);

  const addMessage = useCallback((message: ChatMessageProps) => {
    setConversationMessages((prevChatMessages) => [
      ...prevChatMessages,
      message,
    ]);
  }, []);

  const submitUserMessage = useCallback(
    (userText: string) => {
      if (!currentConversation) {
        createNewConversation();
      }
      Events.sendUserSubmittedEvent(userText);
      setIsBotTyping(true);
      addMessage({
        text: userText,
        isBot: false,
        timestamp: Date.now().toString(),
      });
    },
    [currentConversation, createNewConversation, addMessage]
  );

  useEffect(() => {
    function handleResponse(eventMessage: MessageEvent) {
      const eventData = eventMessage.data;
      switch (eventData?.command) {
        case "submit-message":
          submitUserMessage(eventData.data.input);
      }
    }

    window.addEventListener("message", handleResponse);
    return () => window.removeEventListener("message", handleResponse);
  }, [submitUserMessage]);

  useEffect(() => {
    if (currentConversation && conversationMessages.length > 0) {
      const updatedConversation = {
        id: currentConversation.id,
        messages: conversationMessages,
      };
      updateConversation(currentConversation.id, updatedConversation);
    }
  }, [currentConversation, conversationMessages]);

  return {
    currentConversation,
    conversationMessages,
    isBotTyping,
    conversations: chatData?.conversations || {},
    setIsBotTyping,
    submitUserMessage,
    addMessage,
    setCurrentConversationData,
    goToHistory: resetCurrentConversation,
    createNewConversation,
    clearAllConversations() {
      Events.sendUserClearedAllConversationsEvent(
        chatData?.conversations ? Object.keys(chatData.conversations).length : 0
      );
      removeConversation();
    },
  };
}

const [ChatStateProvider, useChatState] = constate(useCreateChatState);

export { ChatStateProvider, useChatState };
