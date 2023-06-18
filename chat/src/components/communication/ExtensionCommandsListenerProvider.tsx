import { PropsWithChildren, useEffect } from "react";
import { ChatState } from "../../types/ChatTypes";
import Events from "../../utils/events";
import { useChatState } from "../../hooks/useChatState";

type Props = {
  chatData: ChatState;
};

type Command =
  | { command: "submit-message"; data: { input: string } }
  | { command: "move-to-view"; data: { view: string } }
  | { command: "create-new-conversation" }
  | { command: "clear-conversation" };

export function ExtensionCommandsListenerProvider({
  chatData,
  children,
}: PropsWithChildren<Props>): React.ReactElement {
  const {
    submitUserMessage,
    resetCurrentConversation,
    createNewConversation,
    clearMessages,
  } = useChatState();

  useEffect(() => {
    function handleResponse(eventMessage: MessageEvent<Command | undefined>) {
      const eventData = eventMessage.data;
      switch (eventData?.command) {
        case "submit-message":
          submitUserMessage(eventData.data.input);
          break;
        case "move-to-view":
          if (eventData.data.view === "history") {
            resetCurrentConversation();
            Events.sendUserClickedHeaderButtonEvent(chatData, "History");
          }
          break;
        case "create-new-conversation":
          createNewConversation();
          Events.sendUserClickedHeaderButtonEvent(
            chatData,
            "Create new conversation"
          );
          break;
        case "clear-conversation":
          clearMessages();
          Events.sendUserClickedHeaderButtonEvent(
            chatData,
            "Clear conversation"
          );
          break;
      }
    }

    window.addEventListener("message", handleResponse);
    return () => window.removeEventListener("message", handleResponse);
  }, [
    submitUserMessage,
    createNewConversation,
    resetCurrentConversation,
    clearMessages,
  ]);

  return <>{children}</>;
}
