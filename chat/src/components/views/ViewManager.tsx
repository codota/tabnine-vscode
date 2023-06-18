import React, { useEffect } from "react";
import styled from "styled-components";
import { useChatState } from "../../hooks/useChatState";
import { HistoryView } from "./HistoryView";
import { ChatInput } from "../general/ChatInput";
import { GlobalHeader } from "../general/GlobalHeader";
import { ConversationView } from "./ConversationView";
import { ConversationContextProvider } from "../../hooks/useConversationContext";
import { ChatState } from "../../types/ChatTypes";
import Events from "../../utils/events";

type Props = {
  chatData: ChatState;
};

export const ViewManager: React.FC<Props> = ({ chatData }) => {
  const {
    isBotTyping,
    submitUserMessage,
    currentConversation,
  } = useChatState();

  useEffect(() => Events.sendUserActivatedChat(chatData), []);

  return (
    <Wrapper>
      <GlobalHeader />
      {!currentConversation ? (
        <HistoryView />
      ) : (
        <ConversationContextProvider conversation={currentConversation}>
          <ConversationView />
        </ConversationContextProvider>
      )}
      <ChatInputStyled isDisabled={isBotTyping} onSubmit={submitUserMessage} />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  color: var(--vscode-editor-foreground);
  position: relative;
  height: 100%;
`;

const ChatInputStyled = styled(ChatInput)`
  flex-grow: 0;
`;
