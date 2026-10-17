export function extractRawTextFromCard(cardData: any): string {
  const data = cardData.data || cardData || {};
  let embeddedLore = '';
  if (data.character_book?.entries && Array.isArray(data.character_book.entries)) {
    embeddedLore = data.character_book.entries
      .filter((e: any) => e.constant && e.enabled !== false)
      .sort((a: any, b: any) => (a.insertion_order || 0) - (b.insertion_order || 0))
      .map((e: any) => e.content)
      .join('\n\n');
  }

  return `
Name: ${data.name || ''}
Description: ${data.description || ''}
Personality: ${data.personality || ''}
Scenario: ${data.scenario || ''}
System Prompt: ${data.system_prompt || data.extensions?.chub?.system_prompt || data.extensions?.depth_prompt?.prompt || ''}
Lorebook: ${embeddedLore}
`.trim();
}

export async function processCharacterCard(apiKey: string, cardData: any): Promise<string> {
  if (!apiKey) throw new Error("API Key is missing");

  const rawText = extractRawTextFromCard(cardData);

  const systemMessage = `You are an expert at optimizing AI character definitions.
The user will hand you a character definition meant for text RPGs (detailed settings, rules, background — but also mixed with complex XML tags like <UpdateVariable>, <Analysis>, affinity-score output and so on).
Because those formatting instructions badly disrupt a pure voice model's natural conversation (making the AI say things like "body text" or "affinity +1"), your job is to sanitize it WITHOUT losing information.

Requirements:
1. Never summarize or shorten: absolutely do not condense, summarize or trim the source! Preserve every bit of background story, detail, special rule (e.g. turn-count triggers) and dialogue example from the original 1:1 wherever possible.
2. Remove precisely: delete only (or convert into natural language) the "formatting wrappers" that harm a pure voice model, such as:
   - XML tags (e.g. <UpdateVariable>, <summary>)
   - JSON output requirements
   - layout/state-tracking instructions such as "always output in this fixed format" or "end every line with an affinity score".
3. If the source contains lots of bulleted settings or long rule explanations, keep their information intact — just strip the constraints demanding a special output format.
4. The result must be a single block of plain text that can be fed straight to a model as a system prompt. Do not add any greeting or explanation of your own.`;

  const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "qwen3.8-max",
      max_tokens: 100000,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: `Please clean up and merge the following character definition and output clean, pure plain-text settings:\n\n${rawText}` }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Dashscope API Error: ${response.status} ${errorText}`);
  }

  const json = await response.json();
  if (json.choices && json.choices.length > 0) {
    return json.choices[0].message.content.trim();
  } else {
    throw new Error("No response from Qwen-Max");
  }
}
