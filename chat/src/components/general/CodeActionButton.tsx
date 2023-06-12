import styled from "styled-components";

type Props = {
  caption?: string;
  onClick(): void;
  icon?: React.ReactNode;
  isDisabled?: boolean;
};

export function CodeActionButton({
  caption,
  onClick,
  icon,
  isDisabled,
  ...props
}: Props): React.ReactElement {
  return (
    <Wrapper onClick={onClick}>
      {icon && <IconWrapper>{icon}</IconWrapper>}
      {caption && <span>{caption}</span>}
    </Wrapper>
  );
}

const IconWrapper = styled.div`
  display: flex;
`;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  color: #40a6ff;
  gap: 0.4rem;

  path {
    fill: #40a6ff;
  }

  &:hover {
    cursor: pointer;
    color: #9ecffa;
    path {
      fill: #9ecffa;
    }
  }

  &:active {
    color: #0458a2;
    path {
      fill: #0458a2;
    }
  }
`;
