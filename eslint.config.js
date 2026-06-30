import typescriptEslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier/recommended";
import nextPlugin from "eslint-config-next";

export default [
  {
    ignores: ["node_modules", "dist", "build", ".next", "coverage"],
  },
  ...typescriptEslint.configs.recommended,
  prettier,
  {
    rules: {
      "prettier/prettier": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
        },
      ],
      "no-console": [
        "warn",
        {
          allow: ["warn", "error"],
        },
      ],
      "react/react-in-jsx-scope": "off",
    },
  },
];
