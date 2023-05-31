import React from "react";
import styled from "styled-components";
import { ChatConversationItem } from "./ChatConversationItem";
import tabnineLogo from "../assets/tabnine-logo.png";
import { UserBadge } from "./UserBadge";
import { useChatState } from "../hooks/useChatState";
import { useChatDataState } from "../hooks/useChatDataState";

export const ChatHistoryView: React.FC = () => {
  const { conversations, clearAllConversations } = useChatDataState();

  const { setCurrentConversationData } = useChatState();

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
        {Object.values(conversations)
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
              onClick={() => setCurrentConversationData(conversation)}
            />
          ))}
      </ConversationsList>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  padding-bottom: 0.4rem;
  overflow-y: auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
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
