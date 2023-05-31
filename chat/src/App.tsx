import React from "react";
import { ChatViewManager } from "./components/ChatViewManager";
import { ExtensionCommunicationProvider } from "./hooks/ExtensionCommunicationProvider";
import { ChatDataStateProvider } from "./hooks/useChatDataState";
import { ChatStateProvider } from "./hooks/useChatState";
import { UserDetailsStateProvider } from "./hooks/useUserDetailsState";

function App(): React.ReactElement {
  return (
    <ExtensionCommunicationProvider>
      <UserDetailsStateProvider>
        <ChatDataStateProvider>
          <ChatStateProvider>
            <ChatViewManager />
          </ChatStateProvider>
        </ChatDataStateProvider>
      </UserDetailsStateProvider>
    </ExtensionCommunicationProvider>
  );
}

export default App;
