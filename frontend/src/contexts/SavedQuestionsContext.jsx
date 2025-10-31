import React, { useState, useEffect, useCallback } from 'react';
import { SavedQuestionsContext } from './SavedQuestionsContext.js';

const SAVED_QUESTIONS_STORAGE_KEY = 'savedPaveQuestionIds';

export const SavedQuestionsProvider = ({ children }) => {
  const [savedQuestionIds, setSavedQuestionIds] = useState(() => {
    try {
      const item = window.localStorage.getItem(SAVED_QUESTIONS_STORAGE_KEY);
      return item ? JSON.parse(item) : [];
    } catch (error) {
      console.error("Erro ao carregar questões salvas do localStorage:", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(SAVED_QUESTIONS_STORAGE_KEY, JSON.stringify(savedQuestionIds));
    } catch (error) {
      console.error("Erro ao salvar questões no localStorage:", error);
    }
  }, [savedQuestionIds]);

  const addSavedQuestion = useCallback((questionId) => {
    if (typeof questionId !== 'string' && typeof questionId !== 'number') return;
    const idStr = questionId.toString();
    setSavedQuestionIds((prevIds) => {
      if (!prevIds.includes(idStr)) {
        return [...prevIds, idStr];
      }
      return prevIds;
    });
  }, []);

  const removeSavedQuestion = useCallback((questionId) => {
    if (typeof questionId !== 'string' && typeof questionId !== 'number') return;
    const idStr = questionId.toString();
    setSavedQuestionIds((prevIds) => prevIds.filter((id) => id !== idStr));
  }, []);

  const isQuestionSaved = useCallback((questionId) => {
    if (typeof questionId !== 'string' && typeof questionId !== 'number') return false;
    const idStr = questionId.toString();
    return savedQuestionIds.includes(idStr);
  }, [savedQuestionIds]);

  const value = {
    savedQuestionIds,
    addSavedQuestion,
    removeSavedQuestion,
    isQuestionSaved,
  };

  return (
    <SavedQuestionsContext.Provider value={value}>
      {children}
    </SavedQuestionsContext.Provider>
  );
};