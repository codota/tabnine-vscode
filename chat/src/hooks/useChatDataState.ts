import { useCallback, useState, useEffect } from "react";
import { ChatState, ChatConversation } from "../types/ChatTypes";
import { sendRequestToExtension } from "./ExtensionCommunicationProvider";
import Events from "../utils/events";
import constate from "constate";

type ChatDataStateResponse = {
  chatData: ChatState | null;
  conversations: { [id: string]: ChatConversation };
  updateConversation: (conversation: ChatConversation) => void;
  clearAllConversations: () => void;
};

function useCreateChatDataState(): ChatDataStateResponse {
  const [chatData, setChatData] = useState<ChatState | null>(null);

  useEffect(() => {
    const fetchChatData = async () => {
      const chatState = await sendRequestToExtension<void, ChatState>({
        command: "get_chat_state",
      });

      setChatData(chatState);
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

  const clearAllConversations = useCallback(() => {
    Events.sendUserClearedAllConversationsEvent(
      Object.keys(chatData?.conversations || []).length
    );
    setChatData({
      conversations: {},
    });
    void sendRequestToExtension<void, void>({
      command: "clear_all_chat_conversations",
    });
  }, [chatData?.conversations]);

  return {
    chatData,
    conversations: chatData?.conversations || {},
    updateConversation,
    clearAllConversations,
  };
}

const [ChatDataStateProvider, useChatDataState] = constate(
  useCreateChatDataState
);

export { ChatDataStateProvider, useChatDataState };
