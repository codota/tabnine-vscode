import { MessageHeader } from "./MessageHeader";
import { MessageContainer } from "./MessageContainer";
import styled from "styled-components";
import { MessageContextProvider } from "../../hooks/useMessageContext";
import { CodeButton } from "../general/CodeButton";
import { ReactComponent as RegenerateIcon } from "../../assets/regenerate-icon.svg";
import { useConversationContext } from "../../hooks/useConversationContext";

type Props = {
  onRegenerate(): void;
};

export function BotErrorMessage({ onRegenerate }: Props): React.ReactElement {
  const { id: conversationId } = useConversationContext();
  return (
    <MessageContextProvider
      isError
      message={{
        conversationId,
        isBot: true,
        text:
          "An error occurred. If this issue persists please contact us through our support page or via the following email: support@tabnine.com",
      }}
    >
      <MessageContainer>
        <MessageHeader />
        <Wrapper>
          <TextWrapper>
            <ErrorTitle>An error occurred</ErrorTitle>
            <ErrorText>
              If this issue persists please contact us through our{" "}
              <a href="https://support.tabnine.com/hc/en-us">support page</a> or
              via the following email:{" "}
              <a href="mailto:support@tabnine.com">support@tabnine.com</a>
            </ErrorText>
          </TextWrapper>
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
  border-radius: 4px;
  background-color: var(--vscode-terminal-ansiBlack);
`;

const ErrorText = styled.div``;

const ErrorTitle = styled.div`
  margin-bottom: 0.3rem;
  color: var(--vscode-editorError-foreground);
`;

const TextWrapper = styled.div`
  padding: 0.5rem 0.8rem;
`;

const StyledButton = styled(CodeButton)`
  background-color: var(--vscode-terminal-ansiBlack);
`;
