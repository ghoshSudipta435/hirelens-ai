export type InterviewQuestion = {
  id: string;
  question: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  category: string;
};

export type InterviewQuestionSet = {
  id: string;
  matchResultId: string;
  createdAt: string;
  questions: InterviewQuestion[];
};
