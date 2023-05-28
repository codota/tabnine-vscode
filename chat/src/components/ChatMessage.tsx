import { useUserDetails } from "../hooks/useUserDetails";
import { ChatStyledMessage } from "./ChatStyledMessage";

type Props = {
  text: string;
  isBot: boolean;
};
export function ChatMessage({ text, isBot }: Props): React.ReactElement {
  const userDetails = useUserDetails();

  return (
    <ChatStyledMessage
      username={userDetails?.username ? userDetails.username : "Me"}
      text={text}
      isBot={isBot}
    />
  );
}
