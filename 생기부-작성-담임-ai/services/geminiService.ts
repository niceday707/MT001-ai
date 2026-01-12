import { GoogleGenAI } from "@google/genai";
import { StudentProfile, SectionInputData, RecordSection, InputMode } from '../types';

// Helper to read file as base64 for images or text for others
const readFileForGemini = async (file: File): Promise<{ inlineData?: { data: string; mimeType: string }, text?: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    if (file.type.startsWith('image/')) {
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve({
          inlineData: {
            data: base64String,
            mimeType: file.type
          }
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      reader.onload = () => {
        resolve({ text: `[Attached File Content: ${file.name}]\n${reader.result as string}\n` });
      };
      reader.onerror = reject;
      reader.readAsText(file);
    } else {
      // For unsupported files in frontend-only demo, we just pass the name
      resolve({ text: `[Attached File: ${file.name} - Content analysis not supported in browser demo]` });
    }
  });
};

export const generateSectionContent = async (
  section: RecordSection,
  student: StudentProfile,
  data: SectionInputData,
  mode: InputMode,
  integratedContext?: string // Used if mode is INTEGRATED
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Section definitions for the prompt
  const sectionPrompts = {
    [RecordSection.AUTONOMOUS]: "자율활동 특기사항 (500자 내외). 학급 임원 활동, 교내 행사 참여, 동아리 이외의 자율적 탐구 활동 등을 중심으로 작성.",
    [RecordSection.CAREER]: "진로활동 특기사항 (700자 내외). 학생의 진로 희망과 관련된 구체적 활동, 진로 탐색 과정, 전공 적합성 등을 중심으로 작성.",
    [RecordSection.BEHAVIORAL]: "행동특성 및 종합의견 (500자 내외). 학생의 인성, 잠재력, 소통 능력, 배려, 나눔, 협력, 갈등 관리 등을 종합적으로 관찰하여 작성."
  };

  const targetLength = section === RecordSection.CAREER ? 700 : 500;

  let contents: any[] = [];
  
  // System Instruction
  const systemInstruction = `
    당신은 대한민국 고등학교의 베테랑 담임교사입니다. 
    제공된 학생의 기초 정보와 활동 내역을 바탕으로 학교생활기록부(생기부)의 '${sectionPrompts[section]}' 영역을 작성해야 합니다.
    
    [작성 원칙]
    1. 문체: '~함', '~임' 등의 명사형 종결 어미를 사용하여 간결하고 전문적으로 작성하십시오. (예: 적극적으로 참여함. 탁월한 역량을 보임.)
    2. 분량: 공백 포함 약 ${targetLength}자 내외로 작성하십시오.
    3. 내용: 구체적인 활동 사례(Fact)를 먼저 제시하고, 그를 통해 드러난 학생의 역량과 성장(Opinion)을 기술하십시오.
    4. 미사여구보다는 객관적 관찰과 구체적 변화 위주로 서술하십시오.
    5. 학생의 희망 진로(${student.field} - ${student.careerPath})와 연계성을 고려하십시오.
  `;

  // Build User Prompt
  let userPrompt = `
    [학생 정보]
    이름: ${student.name}
    계열: ${student.field}
    희망 진로: ${student.careerPath}

    [입력된 활동 데이터]
  `;

  if (mode === InputMode.INTEGRATED && integratedContext) {
    userPrompt += `
      모드: 통합 입력 (전체 활동 내용에서 해당 영역에 적합한 내용을 추출하여 작성)
      전체 활동 내용:
      ${integratedContext}
      
      추가 메모: ${data.memo}
    `;
  } else {
    userPrompt += `
      모드: 영역별 입력
      내용: ${data.text}
      메모: ${data.memo}
    `;
  }

  // Handle Files
  const fileParts = await Promise.all(data.files.map(f => readFileForGemini(f)));
  
  // Combine text prompt and file parts
  contents.push({ text: userPrompt });
  fileParts.forEach(part => {
    if (part.inlineData) contents.push({ inlineData: part.inlineData });
    if (part.text) contents[0].text += `\n${part.text}`;
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7, 
        maxOutputTokens: 1000,
      }
    });

    return response.text || "생성된 내용이 없습니다.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("AI 생기부 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
  }
};