import coreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "src/payload-types.ts"] },
  ...coreWebVitals,
];

export default eslintConfig;
