import { styled } from "goober";

interface FlexChildProps {
  $flex: number;
}

/** child of `display: flex` element with a specified flex property */
export const FlexChild = styled("div")<FlexChildProps>(
  ({ $flex: flex }) => `
  flex: ${flex};
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`,
);
