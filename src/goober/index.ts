import { setup } from "goober";
import { prefix } from "goober/prefixer";
import { shouldForwardProp } from "goober/should-forward-prop";
import * as React from "react";

import { useTheme } from "./theme";

// Bootstrap goober
setup(
  React.createElement,
  prefix,
  useTheme,
  shouldForwardProp((prop) => {
    // Do NOT forward props that start with `$` symbol
    return prop["0"] !== "$";
  }),
);
