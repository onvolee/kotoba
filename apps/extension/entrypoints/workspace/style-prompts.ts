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

export const builtInStylePrompts: StylePrompt[] = [
  {
    id: "built-in-programming-technology",
    name: "Programming technology",
    prompt: "Preserve technical names, commands, code, API names, and file paths. Use precise terminology and keep explanations compact.",
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
