export enum InputMode {
  INTEGRATED = 'INTEGRATED',
  SECTIONAL = 'SECTIONAL'
}

export enum StudentField {
  HUMANITIES = '인문계열',
  NATURE = '자연계열',
  ARTS_SPORTS = '예체능계열',
  VOCATIONAL = '실업계열',
  OTHER = '기타'
}

export enum RecordSection {
  AUTONOMOUS = 'autonomous', // 자율활동
  CAREER = 'career',         // 진로활동
  BEHAVIORAL = 'behavioral'  // 행동특성 및 종합의견
}

export interface StudentProfile {
  name: string;
  field: StudentField;
  careerPath: string; // 희망 진로/전공
}

export interface SectionInputData {
  text: string;
  files: File[];
  memo: string;
}

export interface ActivityData {
  mode: InputMode;
  integrated: SectionInputData;
  sectional: {
    [RecordSection.AUTONOMOUS]: SectionInputData;
    [RecordSection.CAREER]: SectionInputData;
    [RecordSection.BEHAVIORAL]: SectionInputData;
  };
}

export interface GeneratedRecord {
  [RecordSection.AUTONOMOUS]: string;
  [RecordSection.CAREER]: string;
  [RecordSection.BEHAVIORAL]: string;
}

export interface GenerationStatus {
  [RecordSection.AUTONOMOUS]: boolean;
  [RecordSection.CAREER]: boolean;
  [RecordSection.BEHAVIORAL]: boolean;
}