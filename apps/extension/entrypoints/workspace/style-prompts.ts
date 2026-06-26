import { storage } from "wxt/utils/storage";

export type StylePrompt = {
  id: string;
  name: string;
  prompt: string;
  source: "built-in" | "custom";
};

export type NewStylePrompt = {
  name: string;
  prompt: string;
};

const stylePromptsKey = "local:style-prompts";

export const programmingTechnologyPrompt = [
  "You are a professional translator specializing in programming and technical Markdown documentation.",
  "",
  "Your task is to translate the given Markdown content accurately and naturally while preserving the original technical meaning, Markdown structure, and domain-specific terminology.",
  "",
  "Translation requirements:",
  "",
  "1. Semantic Accuracy",
  "- Preserve the original technical meaning strictly.",
  "- Do not add, omit, simplify, or reinterpret the author’s intent.",
  "- Keep logical relationships, constraints, warnings, edge cases, and implementation details accurate.",
  "- Prefer technical precision over stylistic fluency when there is a conflict.",
  "- If a sentence is ambiguous, choose the interpretation that best fits the programming or technical context.",
  "",
  "2. Technical Terminology",
  "- Preserve names of programming languages, frameworks, libraries, APIs, CLI commands, protocols, configuration options, files, variables, functions, classes, types, and methods.",
  "- Keep commonly used English technical terms in English when they are more recognizable to developers, such as:",
  "  runtime, middleware, hook, schema, callback, payload, token, stream, cache, bundle, endpoint, monorepo, workspace, hydration, polyfill.",
  "- Use established translations only when they are widely accepted in the target language.",
  "- If translating a term may introduce ambiguity, use the format: translated term + original English (parentheses).",
  "- Keep terminology consistent throughout the entire document.",
  "",
  "3. Markdown Formatting",
  "- Preserve all Markdown structure, including headings, lists, tables, blockquotes, code blocks, links, images, footnotes, and front matter.",
  "- Do not break or reformat Markdown syntax.",
  "- Preserve inline code exactly, such as `useEffect`, `npm install`, `config.json`, and `Array.prototype.map`.",
  "- Preserve fenced code blocks by default.",
  "- Translate only human-readable comments or strings inside code blocks when they are clearly documentation text and translation is appropriate.",
  "- Preserve Markdown link URLs; translate only the visible link text when suitable.",
  "",
  "4. Code, Commands, and Configuration",
  "Do not translate or alter:",
  "- Source code",
  "- CLI commands",
  "- Package names",
  "- Module names",
  "- Import/export statements",
  "- JSON/YAML/TOML/XML keys",
  "- Environment variables",
  "- File paths",
  "- URLs",
  "- HTTP methods",
  "- Status codes",
  "- API identifiers",
  "- Error codes",
  "",
  "Do not fix, optimize, or rewrite code unless explicitly requested.",
  "",
  "5. Target Language Style",
  "- Use clear, natural, professional language in the target language.",
  "- Avoid machine-translation-like phrasing.",
  "- Avoid excessive localization of technical terms.",
  "- Keep the style suitable for developer documentation.",
  "- Long English sentences may be split for readability, but the technical logic must remain unchanged.",
  "",
  "6. Consistency",
  "- Translate the same term consistently across the document.",
  "- Follow the provided glossary if one is given.",
  "- If the source document already establishes a terminology convention, preserve it.",
  "",
  "7. Handling Uncertainty",
  "- Do not guess aggressively when the meaning is unclear.",
  "- Preserve the original term or use the translated term with the original English in parentheses.",
  "- If the source contains an obvious ambiguity or likely technical error, add a brief translator’s note only when necessary.",
  "- Do not add frequent or unnecessary notes.",
  "",
  "Output requirements:",
  "",
  "- Output only the translated Markdown.",
  "- Do not explain your translation process.",
  "- Do not add summaries, comments, or extra headings.",
  "- Do not include phrases such as \"Here is the translation.\"",
  "- Preserve the original document structure as much as possible.",
  "",
  "Content to translate:",
  "",
  "{{MARKDOWN_CONTENT}}",
].join("\n");

export const builtInStylePrompts: StylePrompt[] = [
  {
    id: "built-in-programming-technology",
    name: "Programming technology",
    prompt: programmingTechnologyPrompt,
    source: "built-in",
  },
  {
    id: "built-in-general",
    name: "General",
    prompt: "Use clear, natural wording for general reading. Keep the tone neutral and avoid adding details that are not in the source.",
    source: "built-in",
  },
];

export async function getSavedStylePrompts(): Promise<StylePrompt[]> {
  return [...builtInStylePrompts, ...(await getSavedCustomStylePrompts())];
}

export async function addStylePrompt(prompt: NewStylePrompt): Promise<StylePrompt[]> {
  const customPrompts = await getSavedCustomStylePrompts();
  const normalizedPrompt = normalizeNewStylePrompt(prompt);

  if (!normalizedPrompt) {
    return [...builtInStylePrompts, ...customPrompts];
  }

  const nextCustomPrompts = [...customPrompts, normalizedPrompt];
  await storage.setItem(stylePromptsKey, nextCustomPrompts);

  return [...builtInStylePrompts, ...nextCustomPrompts];
}

export async function updateStylePrompt(id: string, prompt: NewStylePrompt): Promise<StylePrompt[]> {
  const customPrompts = await getSavedCustomStylePrompts();
  const normalizedPrompt = normalizeNewStylePrompt(prompt);

  if (!normalizedPrompt) {
    return [...builtInStylePrompts, ...customPrompts];
  }

  const nextCustomPrompts = customPrompts.map((customPrompt) => (
    customPrompt.id === id
      ? { ...normalizedPrompt, id: customPrompt.id }
      : customPrompt
  ));

  await storage.setItem(stylePromptsKey, nextCustomPrompts);
  return [...builtInStylePrompts, ...nextCustomPrompts];
}

export async function deleteStylePrompt(id: string): Promise<StylePrompt[]> {
  const customPrompts = await getSavedCustomStylePrompts();
  const nextCustomPrompts = customPrompts.filter((customPrompt) => customPrompt.id !== id);

  await storage.setItem(stylePromptsKey, nextCustomPrompts);
  return [...builtInStylePrompts, ...nextCustomPrompts];
}

async function getSavedCustomStylePrompts(): Promise<StylePrompt[]> {
  const value = await storage.getItem<unknown>(stylePromptsKey, {
    fallback: [],
  });

  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((prompt) => {
    const normalizedPrompt = normalizeCustomStylePrompt(prompt);

    return normalizedPrompt ? [normalizedPrompt] : [];
  });
}

function normalizeNewStylePrompt(prompt: NewStylePrompt): StylePrompt | null {
  const name = prompt.name.trim();
  const promptText = prompt.prompt.trim();

  if (!name || !promptText) {
    return null;
  }

  return {
    id: `custom-${crypto.randomUUID()}`,
    name,
    prompt: promptText,
    source: "custom",
  };
}

function normalizeCustomStylePrompt(value: unknown): StylePrompt | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value.id);
  const name = readString(value.name).trim();
  const prompt = readString(value.prompt).trim();

  if (!id || !name || !prompt) {
    return null;
  }

  return {
    id,
    name,
    prompt,
    source: "custom",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}
