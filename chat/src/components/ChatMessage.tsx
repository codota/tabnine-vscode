import { useMemo } from "react";
import { getMessageSegments } from "../utils/message";
import { ChatStyledMessage } from "./ChatStyledMessage";

type Props = {
    text: string;
    isBot: boolean;
};
export function ChatMessage({ text, isBot, ...props }: Props): React.ReactElement {
    const finalText = useMemo(() => getMessageSegments(text), [text]);
    return <ChatStyledMessage isBot={isBot} textSegments={finalText} />;
}
