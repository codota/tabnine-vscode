import { MessageContainer } from "./MessageContainer";
import { MessageContent } from "./MessageContent";

export function AbstractMessage(): React.ReactElement {
  return (
    <MessageContainer>
      <MessageContent />
    </MessageContainer>
  );
}
