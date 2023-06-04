import constate from "constate";
import { ChatMessageProps } from "../types/ChatTypes";

type MessageContextResponse = {
  message: ChatMessageProps;
};

type Props = {
  message: ChatMessageProps;
};

function useCreateMessageContext({ message }: Props): MessageContextResponse {
  return {
    message,
  };
}

const [MessageContextProvider, useMessageContext] = constate(
  useCreateMessageContext
);

export { MessageContextProvider, useMessageContext };
