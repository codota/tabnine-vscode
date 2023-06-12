import { MessageHeader } from "./MessageHeader";
import { MessageContainer } from "./MessageContainer";
import styled from "styled-components";
import { MessageContextProvider } from "../../hooks/useMessageContext";
import { CodeActionButton } from "../general/CodeActionButton";
import { ReactComponent as RegenerateIcon } from "../../assets/regenerate-icon.svg";
import { useConversationContext } from "../../hooks/useConversationContext";
import { CodeActionsFooter } from "../general/CodeActionsFooter";

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
          "If this issue persists please contact us through our (support page)[https://support.tabnine.com/hc/en-us] or via the following email: support@tabnine.com",
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
          <CodeActionsFooterStyled>
            <CodeActionButton
              caption="Regenerate"
              onClick={onRegenerate}
              icon={<RegenerateIcon />}
            />
          </CodeActionsFooterStyled>
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

const CodeActionsFooterStyled = styled(CodeActionsFooter)`
  background-color: var(--vscode-terminal-ansiBlack);
`;
