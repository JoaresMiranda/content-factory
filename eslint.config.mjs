import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default [
  ...nextVitals,
  ...nextTs,
  { ignores: ['**/.next/**', '**/node_modules/**', '**/dist/**', '**/next-env.d.ts'] },
  { rules: { '@next/next/no-html-link-for-pages': 'off' } },
];
