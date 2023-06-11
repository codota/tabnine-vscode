import constate from "constate";
import { ChatConversation } from "../types/ChatTypes";
import { ChatMessages } from "../types/ChatTypes";

type ConversationContext = {
  id: string;
  messages: ChatMessages;
};

type Props = {
  conversation: ChatConversation;
};

function useCreateConversationContext({
  conversation,
}: Props): ConversationContext {
  return {
    id: conversation.id,
    messages: conversation.messages,
  };
}

const [ConversationContextProvider, useConversationContext] = constate(
  useCreateConversationContext
);

export { ConversationContextProvider, useConversationContext };
