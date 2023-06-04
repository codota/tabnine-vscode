import { MessageWrapper } from "./MessageWrapper";
import { MessageContent } from "./MessageContent";

type Props = {
  text: string;
  isBot: boolean;
};
export function AbstractMessage({ text, isBot }: Props): React.ReactElement {
  return (
    <MessageWrapper isBot={isBot}>
      <MessageContent isBot={isBot} text={text} />
    </MessageWrapper>
  );
}
