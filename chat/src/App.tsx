import React from "react";
import { ChatConversationsView } from "./components/ChatConversationsView";
import { ExtensionCommunicationProvider } from "./hooks/ExtensionCommunicationProvider";

function App(): React.ReactElement {
  return (
    <ExtensionCommunicationProvider>
      <ChatConversationsView />
    </ExtensionCommunicationProvider>
  );
}

export default App;
