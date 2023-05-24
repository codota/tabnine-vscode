import React from "react";
import { Chat } from "./components/Chat";
import { ExtensionCommunicationProvider } from "./hooks/ExtensionCommunicationProvider";

function App(): React.ReactElement {
  return (
    <ExtensionCommunicationProvider>
      <Chat />
    </ExtensionCommunicationProvider>
  );
}

export default App;
