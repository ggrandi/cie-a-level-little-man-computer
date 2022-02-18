import { styled } from "goober";
import type { Property } from "csstype";

import { WIDTH_SWITCH } from "../../constants";

import { AsParamNames } from "./utils";

const Flex = styled("div")`
  width: 100%;
  height: 100%;
  display: flex;
  @media screen and (max-width: ${WIDTH_SWITCH}px) {
    height: unset;
  }
`;

/** a `flex-direction: column` div */
export const FlexColumn = styled(Flex)<
  Partial<
    AsParamNames<{
      alignItems: Property.AlignItems;
      justifyContent: Property.JustifyContent;
      padding: Property.Padding;
      backgroundColor: Property.BackgroundColor;
    }>
  >
>(({ $alignItems, $justifyContent, $padding, $backgroundColor }) => ({
  flexDirection: "column",
  alignItems: $alignItems,
  justifyContent: $justifyContent,
  padding: $padding,
  backgroundColor: $backgroundColor,
}));

/** a `flex-direction: row` div */
export const FlexRow = styled(Flex)<
  Partial<
    AsParamNames<{
      alignItems: Property.AlignItems;
      justifyContent: Property.JustifyContent;
      padding: Property.Padding;
      backgroundColor: Property.BackgroundColor;
    }>
  >
>(({ $alignItems, $justifyContent, $padding, $backgroundColor }) => ({
  flexDirection: "row",
  alignItems: $alignItems,
  justifyContent: $justifyContent,
  padding: $padding,
  backgroundColor: $backgroundColor,
}));

export const FlexRowMaxWidth = styled(FlexRow)`
  @media screen and (max-width: ${WIDTH_SWITCH}px) {
    display: unset;
  }
`;
