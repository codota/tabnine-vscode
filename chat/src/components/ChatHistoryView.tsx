import React from "react";
import styled from "styled-components";
import { ChatConversationItem } from "./ChatConversationItem";
import tabnineLogo from "../assets/tabnine-logo.png";
import { UserBadge } from "./UserBadge";
import { useChatState } from "../hooks/useChatState";

export const ChatHistoryView: React.FC = () => {
  const {
    conversations: allConversations,
    setCurrentConversation,
    createNewConversation,
    clearAllConversations,
  } = useChatState();

  const handleConversationClick = (id: string) => setCurrentConversation(id);

  return (
    <Wrapper>
      <Header>
        <Left>
          <TabnineLogo src={tabnineLogo} />
          <ExperimentalText>Experimental</ExperimentalText>
        </Left>
        <Right>
          <UserBadge />
        </Right>
      </Header>
      <ConversationsList>
        <Top>
          <ChatHistoryText>Chat history</ChatHistoryText>
          <ConversationActionButton onClick={clearAllConversations}>
            Clear all conversations
          </ConversationActionButton>
        </Top>
        {Object.values(allConversations)
          .filter((conversation) => conversation.messages.length > 0)
          .sort(
            (c1, c2) =>
              Number(c2.messages[c2.messages.length - 1].timestamp) -
              Number(c1.messages[c1.messages.length - 1].timestamp)
          )
          .map((conversation) => (
            <ChatConversationItem
              key={conversation.id}
              conversation={conversation}
              onClick={() => handleConversationClick(conversation.id)}
            />
          ))}
      </ConversationsList>
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

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 10px;
  border-bottom: solid 1px var(--vscode-list-inactiveSelectionBackground);
`;

const Left = styled.div`
  display: flex;
  align-items: center;
`;

const Right = styled.div`
  display: flex;
  align-items: center;
`;

const ExperimentalText = styled.div`
  margin-left: 0.5rem;
  font-size: 0.8rem;
  color: #606060; // TODO
`;

const ConversationsList = styled.div`
  padding: 10px;
`;

const Top = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.7rem;
`;

const ConversationActionButton = styled.div`
  text-align: center;
  border: none;
  background-color: transparent;
  color: #606060; // TODO

  &:hover {
    cursor: pointer;
    color: var(--vscode-list-focusHighlightForeground);
  }
`;

const ChatHistoryText = styled.div`
  font-weight: 600;
`;

const TabnineLogo = styled.img``;
