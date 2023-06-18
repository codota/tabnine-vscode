import { UseQueryResult, useMutation, useQuery } from "react-query";
import { sendRequestToExtension } from "../components/communication/ExtensionCommunicationProvider";
import { ChatConversation, ChatState } from "../types/ChatTypes";
import Events from "../utils/events";
import queryClient from "../utils/queryClient";

const GET_CHAT_DATA_KEY = "GET_CHAT_DATA_KEY";

export function useGetChatData(): UseQueryResult<ChatState, unknown> {
  return useQuery({
    queryKey: [GET_CHAT_DATA_KEY],
    queryFn: async () =>
      await sendRequestToExtension<void, ChatState>({
        command: "get_chat_state",
      }),
  });
}

export function useUpdateConversationData() {
  return useMutation({
    async mutationFn(updatedConversation: ChatConversation) {
      await sendRequestToExtension<ChatConversation, void>({
        command: "update_chat_conversation",
        data: updatedConversation,
      });
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: [GET_CHAT_DATA_KEY] });
    },
  });
}

export function useClearChatData() {
  const { data: chatData } = useGetChatData();
  return useMutation({
    async mutationFn() {
      if (chatData) {
        Events.sendUserClearedAllConversationsEvent(chatData);
      }
      await sendRequestToExtension<void, void>({
        command: "clear_all_chat_conversations",
      });
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: [GET_CHAT_DATA_KEY] });
    },
  });
}
