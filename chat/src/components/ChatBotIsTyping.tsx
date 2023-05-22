import { ChatMessages } from "../types/ChatTypes";
import { ChatBotMessage } from "./ChatBotMessage";
import { useChatBotQueryData } from "../hooks/useChatBotQueryData";

type Props = {
    chatMessages: ChatMessages;
    onTextChange: () => void;
    onFinish: (finalBotResponse: string) => void;
};

export function ChatBotIsTyping({ chatMessages, onFinish, onTextChange }: Props): React.ReactElement | null {
    const chatBotQueryData = useChatBotQueryData();
    console.log(chatBotQueryData?.editorContext);
    if (!chatBotQueryData) {
        return null;
    }

    return <ChatBotMessage
        chatMessages={chatMessages}
        chatBotQueryData={chatBotQueryData}
        onFinish={onFinish}
        onTextChange={onTextChange}
    />;
}
