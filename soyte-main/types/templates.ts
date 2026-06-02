export interface InfoOptionNode {
  key: number | string;
  value: string;
}

export interface InfoNode {
  key?: string | number;
  title: string;
  value: string;
  type: string;
  status: boolean;
  isValidate?: boolean;
  isDisable?: boolean;
  option: InfoOptionNode[];
  facilityTypeFilter?: string[];
}

export interface OptionNode {
  key?: number | string;
  content: string;
  method: string;
  productOut: string;
  progress: { type: string; value: number };
  rating: { type: string; value: number };
  ratingVote?: { type: string; value: number };
  note?: string;
  answerType?: 'score1_5' | 'single_choice' | 'percentage' | 'text' | 'facility_multiselect';
  facilityTypeFilter?: string[];
  answerOptions?: { key: number | string; value: string }[];
  status: boolean;
  isValidate?: boolean;
}

export interface GroupNode {
  name: string;
  status: boolean;
  isValidate?: boolean;
  Roman?: "number" | "roman";
  option: OptionNode[];
}

export interface TemplateData {
  id?: string;
  name: string;
  description: string;
  status: boolean;
  type?: string;
  info?: InfoNode[];
  data: GroupNode[];
  startDate?: Date | string | null;
  endDate?: Date | string | null;
}
