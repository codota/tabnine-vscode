import { useEffect, useRef, useState } from "react";
import { ChatMessages } from "../types/ChatTypes";
import { fetchChatResponse as fetchBotResponse } from "../utils/fetchBotResponse";
import { ChatBotQueryData } from "./useChatBotQueryData";

type BotResponse = {
  data: string;
  isLoading: boolean;
  error: string | null;
};

export function useFetchBotResponse(
  chatMessages: ChatMessages,
  chatBotQueryData: ChatBotQueryData
): BotResponse {
  const [data, setData] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isProcessing = useRef(false);

  const chatContext = buildChatContext(chatMessages, chatBotQueryData);

  useEffect(() => {
    let cancelBotResponse: () => void;
    if (!isProcessing.current) {
      isProcessing.current = true;

      cancelBotResponse = fetchBotResponse(
        chatContext.map((message) => ({
          text: message.text,
          by: message.isBot ? "chat" : "user",
        })),
        (text) => setData((oldData) => oldData + text),
        () => {
          isProcessing.current = false;
          setIsLoading(false);
        },
        setError
      );
    }

    return () => {
      if (isProcessing.current) {
        cancelBotResponse?.();
      }
    };
  }, []);

  return { data, isLoading, error };
}

function buildChatContext(
  chatMessages: ChatMessages,
  chatBotQueryData: ChatBotQueryData
) {
  const allMessagesButLast = chatMessages.slice(0, chatMessages.length - 1);
  const lastMessage = chatMessages[chatMessages.length - 1];

  return [
    ...allMessagesButLast,
    {
      isBot: false,
      text: chatBotQueryData.editorContext,
      timestamp: Date.now().toString(),
    },
    lastMessage,
  ];
}
