import React from "react";
import { ViewManager } from "./components/views/ViewManager";
import { ExtensionCommunicationProvider } from "./hooks/ExtensionCommunicationProvider";
import { ChatStateProvider } from "./hooks/useChatState";
import { UserDetailsStateProvider } from "./hooks/useUserDetailsState";
import { LastEditorContextProvider } from "./hooks/useLastEditorContext";

function App(): React.ReactElement {
  return (
    <ExtensionCommunicationProvider>
      <UserDetailsStateProvider>
        <ChatStateProvider>
          <LastEditorContextProvider>
            <ViewManager />
          </LastEditorContextProvider>
        </ChatStateProvider>
      </UserDetailsStateProvider>
    </ExtensionCommunicationProvider>
  );
}

export default App;
