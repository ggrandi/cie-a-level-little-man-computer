import * as React from "react";

/** theme for goober */
const theme = {} as const;

/** Theme context to use as a hook */
const ThemeContext = React.createContext(theme);

export const useTheme = () => React.useContext(ThemeContext);

export type ITheme = typeof theme;

declare module "goober" {
  // allows goober to infer the type of the theme
  export interface DefaultTheme extends ITheme {}
}
