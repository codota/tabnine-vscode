import { MessageContainer } from "./MessageContainer";
import { MessageContent } from "./MessageContent";
import { ChatMessageProps } from "../../types/ChatTypes";

type Props = {
  message: ChatMessageProps;
};

export function AbstractMessage({ message }: Props): React.ReactElement {
  return (
    <MessageContainer isBot={message.isBot}>
      <MessageContent message={message} />
    </MessageContainer>
  );
}
