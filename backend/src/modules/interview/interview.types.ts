export type InterviewQuestionSetResponseDto = {
  id: string;
  matchResultId: string;
  createdAt: Date;
  questions: {
    id: string;
    question: string;
    difficulty: string;
    category: string;
  }[];
};
