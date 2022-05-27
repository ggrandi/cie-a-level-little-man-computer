export type Undoable<T> = {
  /** the current state of the undoable */
  present: T;
  /** the past states of the undoable */
  past: T[];
  /** the future states of the undoable */
  future: T[];
};

/** creates a new undoable with the given `present` */
export const createUndoable = <T>(present: T): Undoable<T> => ({
  present,
  past: [],
  future: [],
});

/** sets the next value for the undoable and resets the future */
export const setNext = <T>({ past, present }: Undoable<T>, next: T): Undoable<T> => ({
  present: next,
  past: [...past, present],
  future: [],
});

/** undos one state */
export const undo = <T>(undoable: Undoable<T>): Undoable<T> => {
  // checks that it can undo, otherwise returns
  if (undoable.past.length === 0) {
    return undoable;
  }

  // gets the present from the last state in the past
  const present = undoable.past[undoable.past.length - 1];

  return {
    // the present is the state from the past
    present,
    // the past excludes the new present
    past: undoable.past.slice(0, -1),
    // the future adds the old present to the end
    future: [...undoable.future, undoable.present],
  };
};

export const redo = <T>(undoable: Undoable<T>): Undoable<T> => {
  // checks that it can redo, otherwise returns
  if (undoable.future.length === 0) {
    return undoable;
  }

  // gets the new present from the future
  const present = undoable.future[undoable.future.length - 1];

  return {
    // the new present
    present,
    // the past adds on the old present to the end
    past: [...undoable.past, undoable.present],
    // the future excludes the new present
    future: undoable.future.slice(0, -1),
  };
};
