import { MessageHeader } from "./MessageHeader";
import { MessageContainer } from "./MessageContainer";
import styled from "styled-components";
import { MessageContextProvider } from "../../hooks/useMessageContext";
import { CodeButton } from "../general/CodeButton";
import { ReactComponent as RegenerateIcon } from "../../assets/regenerate-icon.svg";

type Props = {
  onRegenerate(): void;
};

export function BotErrorMessage({ onRegenerate }: Props): React.ReactElement {
  return (
    <MessageContextProvider
      message={{
        isBot: true,
        text:
          "An error occurred. If this issue persists please contact us through our support page or at support@tabnine.com",
      }}
    >
      <MessageContainer>
        <MessageHeader />
        <Wrapper>
          <ErrorText>
            An error occurred. If this issue persists please contact us through
            our <a href="https://support.tabnine.com/hc/en-us">support page</a>{" "}
            or at <a href="mailto:support@tabnine.com">support@tabnine.com</a>
          </ErrorText>
          <StyledButton
            caption="Regenerate"
            onClick={onRegenerate}
            icon={<RegenerateIcon />}
          />
        </Wrapper>
      </MessageContainer>
    </MessageContextProvider>
  );
}

const Wrapper = styled.div`
  border: 1px solid var(--vscode-editorError-foreground);
  border-radius: 4px;
  background-color: var(--vscode-terminal-ansiBlack);
`;

const ErrorText = styled.div`
  padding: 0.5rem;
`;

const StyledButton = styled(CodeButton)`
  background-color: var(--vscode-terminal-ansiBlack);
`;
