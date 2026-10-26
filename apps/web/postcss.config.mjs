const discardUnsupportedPositionTry = new URL(
  "./postcss/discard-unsupported-position-try.mjs",
  import.meta.url,
).pathname;

const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    [discardUnsupportedPositionTry]: {},
  },
};

export default config;
