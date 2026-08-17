export interface TavernCardV2 {
  spec: 'chara_card_v2';
  spec_version: '2.0';
  data: {
    name: string;
    description: string;
    personality: string;
    scenario: string;
    first_mes: string;
    mes_example: string;
    creator_notes?: string;
    system_prompt?: string;
    post_history_instructions?: string;
    tags?: string[];
    creator?: string;
    character_version?: string;
    alternate_greetings?: string[];
    extensions?: Record<string, any>;
  };
}

export async function parseCharacterCardPNG(file: File): Promise<{ card: TavernCardV2; avatarUrl: string }> {
  const buffer = await file.arrayBuffer();
  const dataView = new DataView(buffer);
  
  if (dataView.getUint32(0) !== 0x89504E47 || dataView.getUint32(4) !== 0x0D0A1A0A) {
    throw new Error('Not a valid PNG file');
  }

  let offset = 8;
  while (offset < dataView.byteLength) {
    const length = dataView.getUint32(offset);
    const type = String.fromCharCode(
      dataView.getUint8(offset + 4),
      dataView.getUint8(offset + 5),
      dataView.getUint8(offset + 6),
      dataView.getUint8(offset + 7)
    );

    if (type === 'tEXt') {
      const chunkData = new Uint8Array(buffer, offset + 8, length);
      const textDecoder = new TextDecoder('iso-8859-1');
      const text = textDecoder.decode(chunkData);
      const nullIdx = text.indexOf('\0');
      
      if (nullIdx !== -1) {
        const keyword = text.substring(0, nullIdx);
        if (keyword === 'chara') {
          const charaBase64 = text.substring(nullIdx + 1);
          const decoded = decodeBase64UTF8(charaBase64);
          const card = JSON.parse(decoded) as TavernCardV2;
          
          const avatarUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          return { card, avatarUrl };
        }
      }
    }

    // Move to next chunk: 4(length) + 4(type) + length + 4(CRC)
    offset += 12 + length;
  }

  throw new Error('No chara data found in PNG');
}

export async function parseCharacterCardJSON(file: File): Promise<{ card: TavernCardV2; avatarUrl: string }> {
  const text = await file.text();
  return { card: JSON.parse(text), avatarUrl: '' };
}

function decodeBase64UTF8(base64: string): string {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}
