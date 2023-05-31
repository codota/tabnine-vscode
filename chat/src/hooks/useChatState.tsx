import constate from "constate";
import { useCallback, useEffect, useState } from "react";
import {
  ChatConversation,
  ChatMessageProps,
  ChatMessages,
  ChatState,
} from "../types/ChatTypes";
import { sendRequestToExtension } from "./ExtensionCommunicationProvider";
import { v4 as uuidv4 } from "uuid";
import Events from "../utils/events";

type ChatStateResponse = {
  currentConversation: ChatConversation | null;
  conversationMessages: ChatMessages;
  isBotTyping: boolean;
  conversations: { [id: string]: ChatConversation };
  setIsBotTyping(isBotTyping: boolean): void;
  addMessage(message: ChatMessageProps): void;
  submitUserMessage(userText: string): void;
  setCurrentConversation(id: string): void;
  backToHistory(): void;
  createNewConversation(): void;
  clearAllConversations(): void;
};

function useCreateChatState(): ChatStateResponse {
  const [chatData, setChatData] = useState<ChatState | null>(null);
  const [
    currentConversation,
    setCurrentConversation,
  ] = useState<ChatConversation | null>(null);
  const [
    conversationMessages,
    setConversationMessages,
  ] = useState<ChatMessages>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);

  useEffect(() => {
    const fetchChatData = async () => {
      const chatState = await sendRequestToExtension<void, ChatState>({
        command: "get_chat_state",
      });

      setChatData(chatState);
    };
    fetchChatData();
  }, []);

  const createNewConversation = useCallback(() => {
    const newId = uuidv4();
    const newConversation = {
      id: newId,
      messages: [],
    };
    if (chatData) {
      chatData.conversations[newId] = newConversation;
      setChatData((prevChatData) => ({
        ...prevChatData,
        conversations: {
          ...prevChatData?.conversations,
          [newId]: newConversation,
        },
      }));
      setCurrentConversation(newConversation);
      setConversationMessages([]);
    }
  }, [chatData]);

  const addMessage = (message: ChatMessageProps) => {
    setConversationMessages((prevChatMessages) => [
      ...prevChatMessages,
      message,
    ]);
  };

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

      sendRequestToExtension<ChatConversation, void>({
        command: "update_chat_conversation",
        data: updatedConversation,
      });

      setChatData((prevChatData) => ({
        ...prevChatData,
        conversations: {
          ...prevChatData?.conversations,
          [currentConversation.id]: updatedConversation,
        },
      }));
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
    setCurrentConversation(id: string) {
      if (!chatData) {
        return;
      }
      const conversation = chatData.conversations[id];
      setCurrentConversation(conversation);
      setConversationMessages(conversation.messages);
    },
    backToHistory() {
      setCurrentConversation(null);
      setConversationMessages([]);
    },
    createNewConversation,
    clearAllConversations() {
      Events.sendUserClearedAllConversationsEvent(
        chatData?.conversations ? Object.keys(chatData.conversations).length : 0
      );
      setChatData({
        conversations: {},
      });
      void sendRequestToExtension<void, void>({
        command: "clear_all_chat_conversations",
      });
    },
  };
}

const [ChatStateProvider, useChatState] = constate(useCreateChatState);

export { ChatStateProvider, useChatState };
