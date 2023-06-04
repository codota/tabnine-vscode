import styled from "styled-components";

type Props = {
  caption: string;
  onClick(): void;
  icon?: React.ReactNode;
};

export function CodeButton({
  caption,
  onClick,
  icon,
  ...props
}: Props): React.ReactElement {
  return (
    <Wrapper {...props}>
      <CopyButton onClick={onClick}>
        <TextAndIcon>
          {icon && <IconWrapper>{icon}</IconWrapper>}
          {caption}
        </TextAndIcon>
      </CopyButton>
    </Wrapper>
  );
}

const TextAndIcon = styled.div`
  display: flex;
  align-items: center;
`;

const IconWrapper = styled.div`
  margin-right: 0.5rem;
  display: flex;
  align-items: center;
`;

const CopyButton = styled.div`
  border-top: solid 1px var(--vscode-list-inactiveSelectionBackground);
  text-align: left;
  padding: 0.4rem 0.5rem;
  user-select: none;
`;

const Wrapper = styled.div`
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  padding-top: 0.3rem;

  ${CopyButton} {
    color: #40a6ff;
  }

  path {
    fill: #40a6ff;
  }

  &:hover {
    cursor: pointer;
    ${CopyButton} {
      color: #0088ff;
    }

    path {
      fill: #0088ff;
    }
  }

  &:active {
    ${CopyButton} {
      color: #0458a2;
    }

    path {
      fill: #0458a2;
    }
  }
`;
