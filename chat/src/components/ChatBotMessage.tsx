import { useFetchBotResponse } from "../hooks/useFetchBotResponse";
import { getMessageSegments } from "../utils/message";
import { ChatStyledMessage } from "./ChatStyledMessage";
import { ChatMessages } from "../types/ChatTypes";
import { ChatBotQueryData } from "../hooks/useChatBotQueryData";

type Props = {
    chatMessages: ChatMessages;
    chatBotQueryData: ChatBotQueryData;
    onTextChange: () => void;
    onFinish: (finalBotResponse: string) => void;
};

export function ChatBotMessage({ chatMessages, chatBotQueryData, onFinish, onTextChange }: Props): React.ReactElement | null {
    const { data, isLoading, error } = useFetchBotResponse(chatMessages, chatBotQueryData);
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
