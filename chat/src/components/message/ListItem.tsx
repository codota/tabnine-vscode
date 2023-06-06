import React from "react";
import styled from "styled-components";

type Props = {
  text: string;
};

export function ListItem({ text }: Props): React.ReactElement {
  return (
    <Wrapper>
      <Bullet />
      <Text>{text}</Text>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  padding: 0.4rem 0 0.4rem 0.4rem;
  display: flex;
`;

const Bullet = styled.div`
  background-color: var(--vscode-editor-foreground);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 6px;
  margin-right: 5px;
`;

const Text = styled.div``;
