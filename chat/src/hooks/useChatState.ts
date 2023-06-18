import constate from "constate";
import { useCallback, useEffect, useState } from "react";
import {
  ChatConversation,
  ChatMessageProps,
  ChatState,
} from "../types/ChatTypes";
import { v4 as uuidv4 } from "uuid";
import Events from "../utils/events";
import { EditorContext } from "./useEditorContext";
import { Intent } from "../utils/slashCommands";

type ChatStateResponse = {
  currentConversation: ChatConversation | null;
  isBotTyping: boolean;
  setIsBotTyping(isBotTyping: boolean): void;
  addMessage(message: ChatMessageProps): void;
  appendEditorContext(editorContext: EditorContext): void;
  submitUserMessage(userText: string, intent?: Intent): void;
  setCurrentConversationData(conversation: ChatConversation): void;
  resetCurrentConversation(): void;
  clearMessages(): void;
  createNewConversation(): void;
};

function useCreateChatState(): ChatStateResponse {
  const [isBotTyping, setIsBotTyping] = useState(false);

  const [
    currentConversation,
    setCurrentConversation,
  ] = useState<ChatConversation | null>(null);

  const resetCurrentConversation = useCallback(() => {
    setCurrentConversation(null);
  }, [setCurrentConversation]);

  const clearMessages = useCallback(() => {
    setCurrentConversation((conversation) => {
      if (!conversation) {
        return null;
      }
      return {
        ...conversation,
        messages: [],
      };
    });
  }, [setCurrentConversation]);

  const setCurrentConversationData = useCallback(
    (conversation: ChatConversation) => {
      setCurrentConversation(conversation);
    },
    [setCurrentConversation]
  );

  const createNewConversation = useCallback(() => {
    const newId = uuidv4();
    const newConversation = {
      id: newId,
      messages: [],
    };
    setCurrentConversation(newConversation);
    return newConversation;
  }, [setCurrentConversation]);

  const addMessage = useCallback(
    (message: ChatMessageProps) => {
      setCurrentConversation((conversation) => {
        if (!conversation) {
          return null;
        }
        return {
          ...conversation,
          messages: [...conversation.messages, message],
        };
      });
    },
    [setCurrentConversation]
  );

  const appendEditorContext = useCallback(
    (editorContext: EditorContext) => {
      setCurrentConversation((conversation) => {
        if (!conversation) {
          return null;
        }
        const prevChatMessages = conversation.messages;
        prevChatMessages[
          prevChatMessages.length - 1
        ].editorContext = editorContext;
        return conversation;
      });
    },
    [setCurrentConversation]
  );

  const submitUserMessage = useCallback(
    (userText: string, intent: Intent) => {
      let conversation = currentConversation;
      if (!conversation) {
        conversation = createNewConversation();
      }
      const message: ChatMessageProps = {
        id: uuidv4(),
        conversationId: conversation.id,
        text: userText,
        isBot: false,
        timestamp: Date.now().toString(),
        intent,
      };
      Events.sendUserSubmittedEvent(message, conversation.messages);
      setIsBotTyping(true);
      addMessage(message);
    },
    [currentConversation, createNewConversation, addMessage]
  );

  return {
    currentConversation,
    isBotTyping,
    setIsBotTyping,
    submitUserMessage,
    addMessage,
    appendEditorContext,
    setCurrentConversationData,
    resetCurrentConversation,
    clearMessages,
    createNewConversation,
  };
}

const [ChatStateProvider, useChatState] = constate(useCreateChatState);

export { ChatStateProvider, useChatState };
