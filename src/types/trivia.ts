export type Difficulty = "easy" | "medium" | "hard";
export type Kind = "boolean" | "multiple";

export type Trivia = {
  id: string;
  type: Kind;
  difficulty: Difficulty;
  question: string;
  choices: string[];
  correctAnswer: string;
  category: string; 
};
