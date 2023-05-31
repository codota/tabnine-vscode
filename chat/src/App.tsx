import React from "react";
import { ChatViewManager } from "./components/ChatViewManager";
import { ExtensionCommunicationProvider } from "./hooks/ExtensionCommunicationProvider";
import { ChatDataStateProvider } from "./hooks/useChatDataState";
import { ChatStateProvider } from "./hooks/useChatState";

function App(): React.ReactElement {
  return (
    <ExtensionCommunicationProvider>
      <ChatDataStateProvider>
        <ChatStateProvider>
          <ChatViewManager />
        </ChatStateProvider>
      </ChatDataStateProvider>
    </ExtensionCommunicationProvider>
  );
}

export default App;
