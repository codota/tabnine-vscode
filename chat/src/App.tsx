import React from "react";
import { ViewManager } from "./components/views/ViewManager";
import { ExtensionCommunicationProvider } from "./hooks/ExtensionCommunicationProvider";
import { ChatDataStateProvider } from "./hooks/useChatDataState";
import { ChatStateProvider } from "./hooks/useChatState";
import { UserDetailsStateProvider } from "./hooks/useUserDetailsState";
import { LastEditorContextProvider } from "./hooks/useLastEditorContext";

function App(): React.ReactElement {
  return (
    <ExtensionCommunicationProvider>
      <UserDetailsStateProvider>
        <ChatDataStateProvider>
          <ChatStateProvider>
            <LastEditorContextProvider>
              <ViewManager />
            </LastEditorContextProvider>
          </ChatStateProvider>
        </ChatDataStateProvider>
      </UserDetailsStateProvider>
    </ExtensionCommunicationProvider>
  );
}

export default App;
