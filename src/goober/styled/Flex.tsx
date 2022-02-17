import { styled } from "goober";
import type { Property } from "csstype";

import { AsParamNames } from "./utils";

const Flex = styled("div")`
  width: 100%;
  height: 100%;
  display: flex;
`;

/** a `flex-direction: column` div */
export const FlexColumn = styled(Flex)<
  Partial<
    AsParamNames<{
      alignItems: Property.AlignItems;
      justifyContent: Property.JustifyContent;
    }>
  >
>(({ $alignItems, $justifyContent }) => ({
  flexDirection: "column",
  alignItems: $alignItems,
  justifyContent: $justifyContent,
}));

/** a `flex-direction: row` div */
export const FlexRow = styled(Flex)<
  Partial<
    AsParamNames<{
      alignItems?: Property.AlignItems;
      justifyContent?: Property.JustifyContent;
    }>
  >
>(({ $alignItems, $justifyContent }) => ({
  flexDirection: "row",
  alignItems: $alignItems,
  justifyContent: $justifyContent,
}));
