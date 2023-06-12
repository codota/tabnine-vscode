import styled from "styled-components";
import emptyHistoryIcon from "../../assets/empty-history.png";

export function HistoryEmptyState(): React.ReactElement {
  return (
    <Wrapper>
      <EmptyHistoryIconStyled src={emptyHistoryIcon} />
      <Text>
        Once you start using Tabnine Chat
        <br />
        you’ll see your chat history here
      </Text>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  background-color: var(--vscode-editor-background);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 40px 10px;
  border-radius: 4px;
`;

const Text = styled.div`
  margin-top: 0.5rem;
  text-align: center;
  font-size: 1rem;
  line-height: 1.3;
`;

const EmptyHistoryIconStyled = styled.img``;
