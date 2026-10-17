export interface SillyTavernPreset {
  name: string;
  system_prompt: string;
  post_history_instructions?: string;
}

/** A user-authored prompt block, stacked around the character card. */
export interface AuxPrompt {
  id: string;
  name: string;
  content: string;
  /** 'before' = right after the main prompt; 'after' = after card + lore. */
  position: 'before' | 'after';
  enabled: boolean;
}

export interface CharacterFields {
  name: string;
  description: string;
  personality: string;
  scenario: string;
  system_prompt: string;
  mesExamples?: string;
}

export const DEFAULT_MAIN_PROMPT =
  '【ROLEPLAY DIRECTIVE】\nYou are STRICTLY playing the role of {{char}}. You must NEVER break character, NEVER acknowledge that you are an AI language model, and ALWAYS respond exactly as {{char}} would based on the provided description.\n\n【CHARACTER DETAILS】\nDescription:\n{{description}}\n\nPersonality:\n{{personality}}\n\nScenario:\n{{scenario}}';

export function parseSillyTavernPreset(jsonStr: string, defaultName: string): SillyTavernPreset {
  try {
    const data = JSON.parse(jsonStr);
    return {
      name: data.name || defaultName,
      system_prompt: data.system_prompt || data.system || '',
      post_history_instructions: data.post_history_instructions || ''
    };
  } catch (e) {
    throw new Error('Invalid preset JSON');
  }
}

/**
 * Import auxiliary prompts from a SillyTavern preset (which carries a `prompts`
 * array), a bare array of prompt objects, or a single prompt object.
 */
export function parseAuxPromptImport(jsonStr: string): AuxPrompt[] {
  let data: any;
  try {
    data = JSON.parse(jsonStr);
  } catch {
    throw new Error('Invalid JSON — expected a SillyTavern preset or a list of prompts');
  }
  const list: any[] = Array.isArray(data) ? data : Array.isArray(data?.prompts) ? data.prompts : [data];
  return list
    .filter((p) => p && typeof p === 'object' && typeof (p.content ?? p.prompt ?? p.value) === 'string')
    .map((p, i) => ({
      id: `aux-${Date.now()}-${i}`,
      name: String(p.name || p.identifier || `Prompt ${i + 1}`),
      content: String(p.content ?? p.prompt ?? p.value),
      position: p.injection_position === 1 || p.position === 'after' ? 'after' : 'before',
      enabled: p.enabled !== false && p.disable !== true,
    }));
}

/** {{char}}/{{user}}/card-field substitution, applied to every prompt block. */
function substitute(text: string, characterData?: CharacterFields, userName = 'User'): string {
  let out = text
    .replace(/{{char}}/gi, characterData?.name || 'Assistant')
    .replace(/{{user}}/gi, userName)
    .replace(/<user>/gi, userName);
  if (characterData) {
    out = out
      .replace(/{{description}}/gi, characterData.description || '')
      .replace(/{{personality}}/gi, characterData.personality || '')
      .replace(/{{scenario}}/gi, characterData.scenario || '')
      .replace(/{{mesExamples}}/gi, characterData.mesExamples || '')
      .replace(/{{system_prompt}}/gi, characterData.system_prompt || '');
  }
  return out.trim();
}

/**
 * Stack order (SillyTavern-shaped):
 *   1. main prompt (preset or default), 2. aux prompts marked 'before',
 *   3. character card system prompt, 4. lore (constants + keyword matches),
 *   5. aux prompts marked 'after', 6. post-history instructions,
 *   7. the voice-mode block last, so nothing after it can override the length rules.
 */
export function assemblePrompt(
  preset: SillyTavernPreset | null,
  characterData?: CharacterFields,
  worldbookEntries?: string[],
  useVoicePrompt: boolean = true,
  userName: string = 'User',
  auxPrompts: AuxPrompt[] = []
): string {
  const sections: string[] = [];
  const active = auxPrompts.filter((p) => p.enabled && p.content.trim());
  const pick = (where: AuxPrompt['position']) =>
    active.filter((p) => p.position === where).map((p) => substitute(p.content, characterData, userName));

  const mainRaw = preset?.system_prompt || DEFAULT_MAIN_PROMPT;
  sections.push(substitute(mainRaw, characterData, userName), ...pick('before'));

  // The card's own system prompt, unless the main prompt already pulls it in.
  if (characterData?.system_prompt && !/{{system_prompt}}/i.test(mainRaw)) {
    sections.push(substitute(characterData.system_prompt, characterData, userName));
  }

  const lore = [...new Set((worldbookEntries || []).map((e) => substitute(e, characterData, userName)).filter(Boolean))];
  if (lore.length > 0) {
    sections.push('Core Background Lore:\n' + lore.join('\n'));
  }

  sections.push(...pick('after'));

  if (preset?.post_history_instructions) {
    sections.push(substitute(preset.post_history_instructions, characterData, userName));
  }

  if (useVoicePrompt) {
    sections.push(
      '【VOICE CONVERSATION MODE】\n' +
        'You are currently engaging in a real-time voice conversation with the user. Follow these strict rules:\n' +
        '1. Keep your responses VERY CONCISE and conversational. Respond like you are chatting on a voice call (1-2 short sentences maximum per turn).\n' +
        '2. Use natural verbal tics and filler words (e.g., um, uh, hey, hmm, like) to sound like a real person talking.\n' +
        '3. Do NOT output asterisks for actions like *smiles* or *nods* as they sound unnatural when read by text-to-speech. Focus entirely on dialogue.\n' +
        "4. Sound natural, casual, and emotional based on your character's persona."
    );
  }

  return sections.filter((s) => s && s.trim()).join('\n\n').trim();
}
