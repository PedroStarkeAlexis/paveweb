import { useContext } from "react";
import { SavedQuestionsContext } from "../contexts/SavedQuestionsContext.js";

export const useSavedQuestions = () => {
  const context = useContext(SavedQuestionsContext);
  if (context === undefined) {
    throw new Error(
      "useSavedQuestions deve ser usado dentro de um SavedQuestionsProvider"
    );
  }
  return context;
};
