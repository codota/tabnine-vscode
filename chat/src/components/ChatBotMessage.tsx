import { useFetchStream } from "../hooks/useGetBotResponse";
import { getMessageSegments } from "../utils/message";
import { ChatStyledMessage } from "./ChatStyledMessage";
import { ChatContext } from "./Message";

type Props = {
    chatContext: ChatContext;
    onTextChange: () => void;
    onFinish: (finalBotResponse: string) => void;
};

export function ChatBotMessage({ chatContext, onFinish, onTextChange }: Props): React.ReactElement | null {
    const { data, isLoading, error } = useFetchStream(chatContext);
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
