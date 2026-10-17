export interface SillyTavernPreset {
  name: string;
  system_prompt: string;
  post_history_instructions?: string;
}

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

export function assemblePrompt(
  preset: SillyTavernPreset | null,
  characterData?: { name: string; description: string; personality: string; scenario: string; system_prompt: string; mesExamples?: string },
  worldbookEntries?: string[],
  useVoicePrompt: boolean = true,
  userName: string = 'User'
): string {
  // Default fallback preset
  let prompt = preset ? preset.system_prompt : "【ROLEPLAY DIRECTIVE】\nYou are STRICTLY playing the role of {{char}}. You must NEVER break character, NEVER acknowledge that you are an AI language model, and ALWAYS respond exactly as {{char}} would based on the provided description.\n\n【CHARACTER DETAILS】\nDescription:\n{{description}}\n\nPersonality:\n{{personality}}\n\nScenario:\n{{scenario}}";
  
  if (characterData) {
    prompt = prompt.replace(/{{char}}/gi, characterData.name);
    prompt = prompt.replace(/{{user}}/gi, userName);
    prompt = prompt.replace(/<user>/gi, userName);
    prompt = prompt.replace(/{{description}}/gi, characterData.description || '');
    prompt = prompt.replace(/{{personality}}/gi, characterData.personality || '');
    prompt = prompt.replace(/{{scenario}}/gi, characterData.scenario || '');
    prompt = prompt.replace(/{{mesExamples}}/gi, characterData.mesExamples || '');
    
    // Handle the system prompt shipped with the character card
    if (prompt.includes('{{system_prompt}}')) {
       prompt = prompt.replace(/{{system_prompt}}/gi, characterData.system_prompt || '');
    } else if (characterData.system_prompt) {
       prompt += '\n\n' + characterData.system_prompt;
    }
  }

  // Append the world book's always-on entries
  if (worldbookEntries && worldbookEntries.length > 0) {
    prompt += '\n\nCore Background Lore:\n' + worldbookEntries.join('\n');
  }

  // Append SillyTavern's post_history_instructions
  if (preset?.post_history_instructions) {
    prompt += '\n\n' + preset.post_history_instructions.replace(/{{char}}/gi, characterData?.name || 'Assistant');
  }

  // VoiceTavern forces short replies and verbal tics
  if (useVoicePrompt) {
    prompt += '\n\n【VOICE CONVERSATION MODE】\n' +
      'You are currently engaging in a real-time voice conversation with the user. Follow these strict rules:\n' +
      '1. Keep your responses VERY CONCISE and conversational. Respond like you are chatting on a voice call (1-2 short sentences maximum per turn).\n' +
      '2. Use natural verbal tics and filler words (e.g., um, uh, hey, hmm, like) to sound like a real person talking.\n' +
      '3. Do NOT output asterisks for actions like *smiles* or *nods* as they sound unnatural when read by text-to-speech. Focus entirely on dialogue.\n' +
      '4. Sound natural, casual, and emotional based on your character\'s persona.';
  }

  return prompt.trim();
}
