export type Iterator = {
  next: () => number;
  prev: () => number;
  current: () => number;
};

export function rotate(value: number): Iterator {
  let current = 0;
  return {
    next() {
      current += 1;
      if (current > value) {
        current = 0;
      }
      return current;
    },
    prev() {
      current -= 1;
      if (current < 0) {
        current = value;
      }
      return current;
    },
    current() {
      return current;
    },
  };
}
