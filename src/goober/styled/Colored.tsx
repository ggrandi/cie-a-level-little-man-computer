import type { Property } from "csstype";
import { DefaultTheme, styled, StyledVNode } from "goober";

type ColoredProps =
  | { $color: Property.Color; $background?: undefined }
  | { $color?: undefined; $background: Property.Color }
  | { $color: Property.Color; $background: Property.Color };

function createColored<T extends keyof JSX.IntrinsicElements>(
  tag: T
): StyledVNode<
  Omit<
    JSX.LibraryManagedAttributes<T, JSX.IntrinsicElements[T]> & DefaultTheme & ColoredProps,
    never
  >
> {
  return styled(tag)<ColoredProps>(({ $color, $background }) => ({
    color: $color,
    backgroundColor: $background,
  }));
}

export const ColoredSpan = createColored("span");
export const ColoredP = createColored("p");
