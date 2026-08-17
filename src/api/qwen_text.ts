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

  const systemMessage = `你是一个专业的 AI 角色设定优化大师。
用户将给你一份用于文字 RPG 的角色设定（包含各种细节规则、背景设定，但也混杂了复杂的 XML 标签、如 <UpdateVariable>、<Analysis>、好感度输出等）。
由于复杂的格式指令会严重干扰“纯语音对话模型”的自然交流（导致 AI 说出类似“正文”、“好感度加一”等奇怪的话），你的任务是对其进行【无损净化】。

要求：
1. 【禁止概括与缩减】：绝对不要概括、总结或精简原文本！必须尽可能 1:1 保留原文中所有的背景故事、细节设定、特殊规则（如特定回合数触发机制等）以及对话样例。
2. 【精准剔除】：仅仅删除（或将其转化为自然语言描述）那些对纯语音模型有害的“格式化包装”，比如：
   - XML 标签（如 <UpdateVariable>、<summary> 等）
   - JSON 格式输出要求
   - “必须以固定格式输出”、“每句话结尾必须包含好感度”等排版跟踪指令。
3. 如果原文中有大量的分点设定、长篇规则说明，请原封不动地保留它们的信息量，只要去掉其中要求大模型以特殊格式输出的限制即可。
4. 输出的结果必须是可以直接喂给大模型作为 System Prompt 的一段纯文本，不要包含任何你自己的开头寒暄或解释说明。`;

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
        { role: "user", content: `请帮我清洗并合并以下角色设定，输出干净纯粹的纯文本设定：\n\n${rawText}` }
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
