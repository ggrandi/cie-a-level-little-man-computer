import * as React from "react";

export type GlobalEventListener<Ev extends keyof WindowEventMap> = (
  this: Window,
  ev: WindowEventMap[Ev]
) => unknown;

/** adds an event on the window */
export const useGlobalListener = <Ev extends keyof WindowEventMap>(
  event: Ev,
  handler: GlobalEventListener<Ev>,
  options?: AddEventListenerOptions | boolean
): void => {
  React.useEffect(() => {
    window.addEventListener(event, handler, options);

    return () => {
      window.removeEventListener(event, handler, options);
    };
  }, [event, handler, options]);
};
