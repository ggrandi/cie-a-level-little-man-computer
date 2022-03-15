import { useCallback, useRef } from "react";

import { Nullable } from "./type-utils";

// gets the name of the request fullscreen function dependent on the browser
const requestFullScreenName = (() => {
  if ("fullscreenElement" in document) {
    return "requestFullscreen";
  } else if ("mozFullScreenElement" in document) {
    return "mozRequestFullScreen";
  } else if ("webkitFullscreenElement" in document) {
    return "webkitRequestFullscreen";
  } else if ("msFullscreenElement" in document) {
    return "msRequestFullscreen";
  } else {
    return null;
  }
})();

/** Hook to request fullscreen on an element */
export const useFullscreen = <T extends HTMLElement>(
  options?: FullscreenOptions
):
  | [supportsFullscreen: false]
  | [
      supportsFullscreen: true,
      requestFullScreen: Element["requestFullscreen"],
      elementRef: React.MutableRefObject<Nullable<T>>
    ] => {
  // stores an element to give to the user
  const elementRef = useRef<Nullable<T>>(null);

  const requestFullScreen = useCallback(async () => {
    // checks the element is currently defined
    if (!elementRef.current) return;

    // requests fullscreen on the `ref`ed element
    return elementRef.current[requestFullScreenName as "requestFullscreen"](options);
  }, [options]);

  // return if fullscreening is not supported
  if (requestFullScreenName === null) return [false];

  return [true, requestFullScreen, elementRef];
};
