import styled from "styled-components";
import { ReactComponent as WrapLinesIcon } from "../../assets/wrap-lines.svg";

type Props = {
  onClick(): void;
  enabled: boolean;
};

export function WrapLinesButton({
  onClick,
  enabled,
}: Props): React.ReactElement {
  return (
    <Wrapper
      title={enabled ? "Unwrap lines" : "Wrap lines"}
      onClick={onClick}
      enabled={enabled}
    >
      <IconWrapper>
        <WrapLinesIcon />
      </IconWrapper>
    </Wrapper>
  );
}

const IconWrapper = styled.div`
  display: flex;
`;

const Wrapper = styled.div<{ enabled: boolean }>`
  display: flex;
  align-items: center;
  color: #40a6ff;
  gap: 0.4rem;
  cursor: pointer;

  path {
    fill: ${({ enabled }) => (enabled ? "#3794FF" : "#606060")};
  }
`;
