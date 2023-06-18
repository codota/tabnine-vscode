import React from "react";
import { ViewManager } from "./components/views/ViewManager";
import { ChatStateProvider } from "./hooks/useChatState";
import { UserDetailsStateProvider } from "./hooks/useUserDetailsState";
import { LastEditorContextProvider } from "./hooks/useLastEditorContext";
import { ExtensionCommandsListenerProvider } from "./components/communication/ExtensionCommandsListenerProvider";
import { useGetChatData } from "./hooks/chatData";

function ChatApp(): React.ReactElement {
  const { data: chatData } = useGetChatData();
  if (!chatData) {
    return <>Fetching the chat data</>;
  }

  return (
    <UserDetailsStateProvider>
      <ChatStateProvider>
        <ExtensionCommandsListenerProvider chatData={chatData}>
          <LastEditorContextProvider>
            <ViewManager chatData={chatData} />
          </LastEditorContextProvider>
        </ExtensionCommandsListenerProvider>
      </ChatStateProvider>
    </UserDetailsStateProvider>
  );
}

export default ChatApp;
