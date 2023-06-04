import { MessageHeader } from "./MessageHeader";
import { MessageContainer } from "./MessageContainer";
import styled from "styled-components";

type Props = {
  onRegenerate(): void;
};

export function BotErrorMessage({ onRegenerate }: Props): React.ReactElement {
  return (
    <MessageContainer isBot>
      <MessageHeader
        message={{
          isBot: true,
          text:
            "An error occurred. If this issue persists please contact us through our support page or at support@tabnine.com",
        }}
      />
      <Wrapper>
        <ErrorText>
          An error occurred. If this issue persists please contact us through
          our <a href="https://support.tabnine.com/hc/en-us">support page</a> or
          at <a href="mailto:support@tabnine.com">support@tabnine.com</a>
        </ErrorText>
        <RegenerateButton onClick={onRegenerate}>Regenerate</RegenerateButton>
      </Wrapper>
    </MessageContainer>
  );
}

const Wrapper = styled.div`
  border: 1px solid var(--vscode-editorError-foreground);
  border-radius: 4px;
  background-color: black;
`;

const ErrorText = styled.div`
  padding: 0.5rem;
`;

const RegenerateButton = styled.div`
  padding: 0.5rem;
  border-top: 1px solid var(--vscode-textSeparator-foreground);

  text-align: left;
  color: var(--vscode-inputValidation-infoBorder);

  &:hover {
    cursor: pointer;
  }

  &:active {
    color: var(--vscode-list-activeSelectionBackground);
  }
`;
