import { useFetchStream } from "../hooks/useGetBotResponse";
import { getMessageSegments } from "../utils/message";
import { ChatStyledMessage } from "./ChatStyledMessage";
import { ChatMessages } from "../types/ChatTypes";

type Props = {
    chatMessages: ChatMessages;
    onTextChange: () => void;
    onFinish: (finalBotResponse: string) => void;
};

export function ChatBotMessage({ chatMessages, onFinish, onTextChange }: Props): React.ReactElement | null {
    const { data, isLoading, error } = useFetchStream(chatMessages);
    const finalText = getMessageSegments(data);
    onTextChange();
    if (error) {
        onFinish(error);
    }
    if (!isLoading) {
        onFinish(data);
    }

    return <ChatStyledMessage isBot textSegments={finalText} />;
}
