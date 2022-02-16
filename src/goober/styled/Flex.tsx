import { styled } from "goober";
import { AsParamNames } from "./utils";
import { Property } from "csstype";

const Flex = styled("div")`
  width: 100%;
  height: 100%;
  display: flex;
`;

/** a `flex-direction: column` div */
export const FlexColumn = styled(Flex)<
  Partial<AsParamNames<{ alignItems: Property.AlignItems; justifyContent: Property.JustifyContent }>>
>(({ $alignItems, $justifyContent }) => ({
  flexDirection: "column",
  alignItems: $alignItems,
  justifyContent: $justifyContent,
}));

/** a `flex-direction: row` div */
export const FlexRow = styled(Flex)<
  Partial<AsParamNames<{ alignItems?: Property.AlignItems; justifyContent?: Property.JustifyContent }>>
>(({ $alignItems, $justifyContent }) => ({
  flexDirection: "row",
  alignItems: $alignItems,
  justifyContent: $justifyContent,
}));
