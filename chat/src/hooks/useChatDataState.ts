import { useCallback, useState, useEffect } from "react";
import { ChatState, ChatConversation } from "../types/ChatTypes";
import { sendRequestToExtension } from "./ExtensionCommunicationProvider";
import Events from "../utils/events";

type ChatDataStateResponse = {
  chatData: ChatState | null;
  updateConversation: (id: string, conversation: ChatConversation) => void;
  removeConversation: () => void;
};

export function useChatDataState(): ChatDataStateResponse {
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

  const updateConversation = useCallback(
    (id: string, conversation: ChatConversation) => {
      setChatData((prevChatData) => ({
        ...prevChatData,
        conversations: {
          ...prevChatData?.conversations,
          [id]: conversation,
        },
      }));
    },
    []
  );

  const removeConversation = useCallback(() => {
    Events.sendUserClearedAllConversationsEvent(
      Object.keys(chatData?.conversations || []).length
    );
    setChatData({
      conversations: {},
    });
    void sendRequestToExtension<void, void>({
      command: "clear_all_chat_conversations",
    });
  }, []);

  return {
    chatData,
    updateConversation,
    removeConversation,
  };
}
