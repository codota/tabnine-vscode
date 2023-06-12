import styled from "styled-components";
import { vs2015 as selectedStyle } from "react-syntax-highlighter/dist/esm/styles/hljs";

type Props = {
  children: React.ReactNode;
};

export function CodeActionsFooter({
  children,
  ...props
}: Props): React.ReactElement {
  return <Wrapper {...props}>{children}</Wrapper>;
}

const Wrapper = styled.div`
  background-color: ${selectedStyle.hljs.background};
  border-top: solid 1px var(--vscode-list-inactiveSelectionBackground);
  padding: 0.4rem 0.7rem;
  text-align: left;
  user-select: none;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  display: flex;
`;
