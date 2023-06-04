import React from "react";
import styled from "styled-components";
import { useChatState } from "../../hooks/useChatState";
import { HistoryView } from "./HistoryView";
import { ChatInput } from "../general/ChatInput";
import { GlobalHeader } from "../general/GlobalHeader";
import { ConversationView } from "./ConversationView";

export const ViewManager: React.FC = () => {
  const {
    isBotTyping,
    submitUserMessage,
    currentConversation,
  } = useChatState();
  return (
    <Wrapper>
      <GlobalHeader />
      {!currentConversation ? <HistoryView /> : <ConversationView />}
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
