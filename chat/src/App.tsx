import React from "react";
import { ChatViewManager } from "./components/ChatViewManager";
import { ExtensionCommunicationProvider } from "./hooks/ExtensionCommunicationProvider";
import { ChatStateProvider } from "./hooks/useChatState";

function App(): React.ReactElement {
  return (
    <ExtensionCommunicationProvider>
      <ChatStateProvider>
        <ChatViewManager />
      </ChatStateProvider>
    </ExtensionCommunicationProvider>
  );
}

export default App;
