import { styled } from "goober";

import { WIDTH_SWITCH } from "../../constants";

interface FlexChildProps {
  $flex?: number;
}

/** child of `display: flex` element with a specified flex property */
export const FlexChild = styled("div")<FlexChildProps>(
  ({ $flex: flex }) => `
  ${flex ? `flex: ${flex};` : ``}
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  @media screen and (max-width: ${WIDTH_SWITCH}px) {
    height: unset;
  }
`
);
