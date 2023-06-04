import React from "react";
import styled from "styled-components";
import tabnineLogo from "../../assets/tabnine-logo.png";
import { UserBadge } from "../profile/UserBadge";

export const GlobalHeader: React.FC = () => {
  return (
    <Header>
      <Left>
        <TabnineLogo src={tabnineLogo} />
        <ExperimentalText>Experimental</ExperimentalText>
      </Left>
      <Right>
        <UserBadge />
      </Right>
    </Header>
  );
};

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

const TabnineLogo = styled.img``;
