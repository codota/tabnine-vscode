const sizes = {
  xsmall: 360,
  small: 450,
  medium: 768,
  large: 1024,
  xlarge: 1200,
};

type SizeKey = keyof typeof sizes;

const responsive = (Object.keys(sizes) as SizeKey[]).reduce(
  (accumulator, current) => {
    accumulator[current] = `(max-width: ${sizes[current]}px)`;
    return accumulator;
  },
  {} as { [key in SizeKey]?: string }
);

export default responsive;
