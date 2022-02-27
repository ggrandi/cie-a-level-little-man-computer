import { styled } from "goober";
import type { Property } from "csstype";

/** a `<div />` element with the specified border */
export const Border = styled("div")<{
  $borderWidth?: Property.BorderWidth;
  $borderColor?: Property.BorderColor;
  $borderStyle?: Property.BorderStyle;
  $maxHeight?: Property.MaxHeight;
}>(({ $borderColor, $borderStyle, $borderWidth, $maxHeight }) => {
  const padding = "2px";
  const borderWidth = $borderWidth || "1px";

  return `
  border-width: ${borderWidth};
  border-color: ${$borderColor || "black"};
  border-style: ${$borderStyle || "solid"};
  padding: ${padding};
  width: calc(100% - 2 * ${borderWidth} - 2 * ${padding});
  height: calc(100% - 2 * ${borderWidth} - 2 * ${padding});
  max-height: ${$maxHeight};
`;
});
