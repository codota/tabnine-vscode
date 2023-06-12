import constate from "constate";
import { ChatConversation } from "../types/ChatTypes";

type ConversationContext = {
  id: string;
};

type Props = {
  conversation: ChatConversation;
};

function useCreateConversationContext({
  conversation,
}: Props): ConversationContext {
  return {
    id: conversation.id,
  };
}

const [ConversationContextProvider, useConversationContext] = constate(
  useCreateConversationContext
);

export { ConversationContextProvider, useConversationContext };
