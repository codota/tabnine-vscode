import { useUserDetails } from "../hooks/useUserDetails";
import { ChatStyledMessage } from "./ChatStyledMessage";

type Props = {
  text: string;
  isBot: boolean;
};
export function ChatMessage({ text, isBot }: Props): React.ReactElement {
  return <ChatStyledMessage text={text} isBot={isBot} />;
}
