import constate from "constate";
import { ChatConversation } from "../types/ChatTypes";
import { useUpdateConversationData } from "./chatData";
import { useEffect } from "react";

type ConversationContext = ChatConversation;

type Props = {
  conversation: ChatConversation;
};

function useCreateConversationContext({
  conversation,
}: Props): ConversationContext {
  const { mutate: updateConversationData } = useUpdateConversationData();

  useEffect(() => {
    updateConversationData(conversation);
  }, [conversation]);

  return conversation;
}

const [ConversationContextProvider, useConversationContext] = constate(
  useCreateConversationContext
);

export { ConversationContextProvider, useConversationContext };
