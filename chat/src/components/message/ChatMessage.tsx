import { ChatStyledMessageWrapper } from "./ChatStyledMessageWrapper";
import { ChatStyledMessageContent } from "./ChatStyledMessageContent";

type Props = {
  text: string;
  isBot: boolean;
};
export function ChatMessage({ text, isBot }: Props): React.ReactElement {
  return (
    <ChatStyledMessageWrapper isBot={isBot}>
      <ChatStyledMessageContent isBot={isBot} text={text} />
    </ChatStyledMessageWrapper>
  );
}
