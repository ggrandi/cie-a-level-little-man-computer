import { createGlobalStyles } from "goober/global";

/** css reset and global styles */
export const GlobalStyles = createGlobalStyles({
  "html, body, div[data-reactroot]": {
    margin: 0,
    padding: 0,
    fontFamily: `Helvetica`,
    height: "100%",
    width: "100%",
  },
  "div[data-reactroot]": {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    overflowX: "hidden",
    overflowY: "auto",
  },
});
