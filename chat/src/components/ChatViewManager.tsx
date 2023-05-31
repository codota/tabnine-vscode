import React from "react";
import styled from "styled-components";
import { useChatState } from "../hooks/useChatState";
import { ChatConversationView } from "./ChatConversationView";
import { ChatHistoryView } from "./ChatHistoryView";
import { ChatInput } from "./ChatInput";

export const ChatViewManager: React.FC = () => {
  const {
    isBotTyping,
    submitUserMessage,
    currentConversation,
  } = useChatState();
  return (
    <Wrapper>
      {!currentConversation ? (
        <ChatHistoryView />
      ) : (
        <>
          <ChatConversationView />
        </>
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
