import constate from "constate";
import { useCallback, useEffect, useState } from "react";
import {
  ChatConversation,
  ChatMessageProps,
  ChatMessages,
  ChatState,
} from "../types/ChatTypes";
import { v4 as uuidv4 } from "uuid";
import Events from "../utils/events";
import { EditorContext } from "./useEditorContext";
import { sendRequestToExtension } from "./ExtensionCommunicationProvider";

type ChatStateResponse = {
  chatData: ChatState;
  clearAllConversations: () => void;
  currentConversation: ChatConversation | null;
  conversationMessages: ChatMessages;
  isBotTyping: boolean;
  setIsBotTyping(isBotTyping: boolean): void;
  addMessage(message: ChatMessageProps): void;
  appendEditorContext(editorContext: EditorContext): void;
  submitUserMessage(userText: string): void;
  setCurrentConversationData(conversation: ChatConversation): void;
};

function useCreateChatState(): ChatStateResponse {
  const [chatData, setChatData] = useState<ChatState>({
    conversations: {},
  });
  const [isBotTyping, setIsBotTyping] = useState(false);

  const [
    currentConversation,
    setCurrentConversation,
  ] = useState<ChatConversation | null>(null);

  const [
    conversationMessages,
    setConversationMessages,
  ] = useState<ChatMessages>([]);

  const resetCurrentConversation = useCallback(() => {
    setCurrentConversation(null);
    setConversationMessages([]);
  }, [setCurrentConversation, setConversationMessages]);

  const clearMessages = useCallback(() => {
    setConversationMessages([]);
  }, [setConversationMessages]);

  const setCurrentConversationData = useCallback(
    (conversation: ChatConversation) => {
      setCurrentConversation(conversation);
      setConversationMessages(conversation.messages);
    },
    [setCurrentConversation, setConversationMessages]
  );

  useEffect(() => {
    const fetchChatData = async () => {
      const chatDataResponse = await sendRequestToExtension<void, ChatState>({
        command: "get_chat_state",
      });

      if (chatDataResponse) {
        setChatData(chatDataResponse);
        Events.sendUserActivatedChat(chatDataResponse);
      }
    };
    fetchChatData();
  }, []);

  const updateConversation = useCallback((conversation: ChatConversation) => {
    setChatData((prevChatData) => ({
      ...prevChatData,
      conversations: {
        ...prevChatData?.conversations,
        [conversation.id]: conversation,
      },
    }));
  }, []);

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

  const clearAllConversations = useCallback(() => {
    Events.sendUserClearedAllConversationsEvent(chatData);
    setChatData({
      conversations: {},
    });
    void sendRequestToExtension<void, void>({
      command: "clear_all_chat_conversations",
    });
  }, [chatData]);

  const createNewConversation = useCallback(() => {
    const newId = uuidv4();
    const newConversation = {
      id: newId,
      messages: [],
    };
    updateConversation(newConversation);
    setCurrentConversation(newConversation);
    setConversationMessages([]);
    return newConversation;
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

  const appendEditorContext = useCallback(
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
      };
      Events.sendUserSubmittedEvent(message, conversationMessages);
      setIsBotTyping(true);
      addMessage(message);
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
    chatData,
    clearAllConversations,
    currentConversation,
    conversationMessages,
    isBotTyping,
    setIsBotTyping,
    submitUserMessage,
    addMessage,
    appendEditorContext,
    setCurrentConversationData,
  };
}

const [ChatStateProvider, useChatState] = constate(useCreateChatState);

export { ChatStateProvider, useChatState };
