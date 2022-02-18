import type { Property } from "csstype";
import { styled } from "goober";

interface WidthHeightProps {
  $width?: Property.Width;
  $height?: Property.Height;
}

export const WidthHeight = styled("div")<WidthHeightProps>(
  ({ $width, $height }) => `
  width: ${$width || "100%"};
  height: ${$height || "100%"};
`
);
