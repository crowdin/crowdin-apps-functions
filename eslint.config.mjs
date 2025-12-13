import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([{
    extends: compat.extends("plugin:@typescript-eslint/recommended", "plugin:prettier/recommended"),

    languageOptions: {
        parser: tsParser,
        ecmaVersion: 2020,
        sourceType: "module",
    },

    rules: {
        "@typescript-eslint/camelcase": ["off"],
        eqeqeq: "error",

        "no-console": ["error", {
            allow: ["warn", "error"],
        }],

        "no-throw-literal": "error",
        "@typescript-eslint/no-unused-vars": "error",
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/explicit-function-return-type": "error",
        "@typescript-eslint/no-namespace": "off",
        "no-unused-expressions": "error",
        curly: "error",
        semi: "error",
        "brace-style": "error",
        quotes: ["error", "single", "avoid-escape"],
        "@typescript-eslint/no-use-before-define": "warn",
    },
}]);