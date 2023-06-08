import { useCallback, useState, useEffect } from "react";
import { ChatState, ChatConversation } from "../types/ChatTypes";
import { sendRequestToExtension } from "./ExtensionCommunicationProvider";
import Events from "../utils/events";
import constate from "constate";

type ChatDataStateResponse = {
  chatData: ChatState;
  conversations: { [id: string]: ChatConversation };
  updateConversation: (conversation: ChatConversation) => void;
  clearAllConversations: () => void;
};

function useCreateChatDataState(): ChatDataStateResponse {
  const [chatData, setChatData] = useState<ChatState>({
    conversations: {},
  });

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

  const clearAllConversations = useCallback(() => {
    Events.sendUserClearedAllConversationsEvent(chatData);
    setChatData({
      conversations: {},
    });
    void sendRequestToExtension<void, void>({
      command: "clear_all_chat_conversations",
    });
  }, [chatData]);

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
