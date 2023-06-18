import React from "react";
import { QueryClientProvider } from "react-query";
import queryClient from "./utils/queryClient";
import ChatApp from "./ChatApp";
import { ExtensionCommunicationProvider } from "./components/communication/ExtensionCommunicationProvider";

function App(): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <ExtensionCommunicationProvider>
        <ChatApp />
      </ExtensionCommunicationProvider>
    </QueryClientProvider>
  );
}

export default App;
