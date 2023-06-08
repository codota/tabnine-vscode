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
import { EditorContext } from "./useEditorContext";

type ChatStateResponse = {
  currentConversation: ChatConversation | null;
  conversationMessages: ChatMessages;
  isBotTyping: boolean;
  setIsBotTyping(isBotTyping: boolean): void;
  addMessage(message: ChatMessageProps): void;
  updateLastMessageWithEditorContext(editorContext: EditorContext): void;
  submitUserMessage(userText: string): void;
  setCurrentConversationData(conversation: ChatConversation): void;
  createNewConversation(): void;
};

function useCreateChatState(): ChatStateResponse {
  const { updateConversation, chatData } = useChatDataState();

  const {
    currentConversation,
    setCurrentConversation,
    conversationMessages,
    setConversationMessages,
    resetCurrentConversation,
    setCurrentConversationData,
    clearMessages,
  } = useCurrentConversationState();

  const [isBotTyping, setIsBotTyping] = useState(false);

  const createNewConversation = useCallback(() => {
    const newId = uuidv4();
    const newConversation = {
      id: newId,
      messages: [],
    };
    updateConversation(newConversation);
    setCurrentConversation(newConversation);
    setConversationMessages([]);
  }, [setConversationMessages, setCurrentConversation, updateConversation]);

  const addMessage = useCallback(
    (message: ChatMessageProps) => {
      setConversationMessages((prevChatMessages) => [
        ...prevChatMessages,
        message,
      ]);
    },
    [setConversationMessages]
  );

  const updateLastMessageWithEditorContext = useCallback(
    (editorContext: EditorContext) => {
      setConversationMessages((prevChatMessages) => {
        prevChatMessages[
          prevChatMessages.length - 1
        ].editorContext = editorContext;
        return prevChatMessages;
      });
    },
    [setConversationMessages]
  );

  const submitUserMessage = useCallback(
    (userText: string) => {
      if (!currentConversation) {
        createNewConversation();
      }
      Events.sendUserSubmittedEvent(userText, conversationMessages);
      setIsBotTyping(true);
      addMessage({
        text: userText,
        isBot: false,
        timestamp: Date.now().toString(),
      });
    },
    [
      currentConversation,
      createNewConversation,
      addMessage,
      conversationMessages,
    ]
  );

  useEffect(() => {
    function handleResponse(eventMessage: MessageEvent) {
      const eventData = eventMessage.data;
      switch (eventData?.command) {
        case "submit-message":
          submitUserMessage(eventData.data.input);
          break;
        case "move-to-view":
          if (eventData.data.view === "history") {
            resetCurrentConversation();
            Events.sendUserClickedHeaderButtonEvent(chatData, "History");
          }
          break;
        case "create-new-conversation":
          createNewConversation();
          Events.sendUserClickedHeaderButtonEvent(
            chatData,
            "Create new conversation"
          );
          break;
        case "clear-conversation":
          clearMessages();
          Events.sendUserClickedHeaderButtonEvent(
            chatData,
            "Clear conversation"
          );
          break;
      }
    }

    window.addEventListener("message", handleResponse);
    return () => window.removeEventListener("message", handleResponse);
  }, [
    submitUserMessage,
    createNewConversation,
    resetCurrentConversation,
    clearMessages,
    chatData,
  ]);

  return {
    currentConversation,
    conversationMessages,
    isBotTyping,
    setIsBotTyping,
    submitUserMessage,
    addMessage,
    updateLastMessageWithEditorContext,
    setCurrentConversationData,
    createNewConversation,
  };
}

const [ChatStateProvider, useChatState] = constate(useCreateChatState);

export { ChatStateProvider, useChatState };
