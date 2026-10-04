import path from 'node:path';

export default {
  '*.{ts,tsx}': (filenames) => {
    const relativePaths = filenames
      .map((f) => path.relative(process.cwd(), f).replace(/\\/g, '/'))
      .map((f) => `"${f}"`)
      .join(' ');
    return [`eslint --fix ${relativePaths}`, `prettier --write ${relativePaths}`];
  },
  '*.{js,mjs,cjs,json,css,md,html,yml,yaml}': (filenames) => {
    const relativePaths = filenames
      .map((f) => path.relative(process.cwd(), f).replace(/\\/g, '/'))
      .map((f) => `"${f}"`)
      .join(' ');
    return [`prettier --write ${relativePaths}`];
  },
};
