import constate from "constate";
import { ChatMessageProps } from "../types/ChatTypes";

type MessageContextResponse = {
  message: ChatMessageProps;
  isError: boolean;
};

type Props = {
  message: ChatMessageProps;
  isError?: boolean;
};

function useCreateMessageContext({
  message,
  isError = false,
}: Props): MessageContextResponse {
  return {
    message,
    isError,
  };
}

const [MessageContextProvider, useMessageContext] = constate(
  useCreateMessageContext
);

export { MessageContextProvider, useMessageContext };
