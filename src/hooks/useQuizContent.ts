import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  RESENHA_QUESTIONS,
  RESENHA_TOPICS,
  questionsLudopatia,
} from "@/data/resenhaQuestions";

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback: string;
}

export interface QuizCategory {
  id: string;
  key: string;
  label: string;
  description: string | null;
  image_url: string | null;
  has_topics: boolean;
  order_index: number;
  is_visible: boolean;
}

export interface QuizTopic {
  id: string;
  category_id: string;
  key: string;
  label: string;
  description: string | null;
  order_index: number;
  is_visible: boolean;
}

export interface QuizQuestion {
  id: string;
  category_id: string;
  topic_id: string | null;
  scenario: string;
  options: QuizOption[];
  order_index: number;
  is_visible: boolean;
}

export const useQuizCategories = () =>
  useQuery({
    queryKey: ["quiz-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_categories")
        .select("*")
        .order("order_index");
      if (error) throw error;
      return (data ?? []) as unknown as QuizCategory[];
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

export const useQuizTopics = () =>
  useQuery({
    queryKey: ["quiz-topics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_topics")
        .select("*")
        .order("order_index");
      if (error) throw error;
      return (data ?? []) as unknown as QuizTopic[];
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

export const useQuizQuestions = () =>
  useQuery({
    queryKey: ["quiz-questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .order("order_index");
      if (error) throw error;
      return (data ?? []).map((q) => ({
        ...q,
        options: (q.options ?? []) as unknown as QuizOption[],
      })) as unknown as QuizQuestion[];
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

export const useInvalidateQuizContent = () => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["quiz-categories"] });
    qc.invalidateQueries({ queryKey: ["quiz-topics"] });
    qc.invalidateQueries({ queryKey: ["quiz-questions"] });
  };
};

/**
 * Popula o banco com o conteúdo original da Resenha Fanática na primeira vez
 * que o gerenciador é aberto. A partir daí tudo é editável pelo dev.
 */
export const useSeedQuizContent = () => {
  const invalidate = useInvalidateQuizContent();

  return useMutation({
    mutationFn: async () => {
      const { data: existing } = await supabase
        .from("quiz_categories")
        .select("id")
        .limit(1);
      if (existing && existing.length > 0) return false;

      const categories = [
        { key: "homens", label: "Resenha Deles", description: "Cenários focados na comunicação masculina", has_topics: true, order_index: 0 },
        { key: "mulheres", label: "Resenha Delas", description: "Cenários focados na comunicação feminina", has_topics: true, order_index: 1 },
        { key: "ludopatia", label: "Bet vs Consequências", description: "Cenários focados no vício em apostas", has_topics: false, order_index: 2 },
      ];

      const { data: insertedCats, error: catError } = await supabase
        .from("quiz_categories")
        .insert(categories)
        .select();
      if (catError) throw catError;

      const catByKey = new Map((insertedCats ?? []).map((c) => [c.key, c.id]));

      const topicRows = ["homens", "mulheres"].flatMap((catKey) =>
        RESENHA_TOPICS.map((t, i) => ({
          category_id: catByKey.get(catKey)!,
          key: t.key,
          label: t.label,
          description: t.description,
          order_index: i,
        }))
      );

      const { data: insertedTopics, error: topicError } = await supabase
        .from("quiz_topics")
        .insert(topicRows)
        .select();
      if (topicError) throw topicError;

      const topicId = (catKey: string, key: string) =>
        (insertedTopics ?? []).find(
          (t) => t.category_id === catByKey.get(catKey) && t.key === key
        )!.id;

      const questionRows: Record<string, unknown>[] = [];
      ([["homens", "eles"], ["mulheres", "elas"]] as const).forEach(([catKey, gender]) => {
        RESENHA_TOPICS.forEach((t) => {
          RESENHA_QUESTIONS[gender][t.key].forEach((q, i) => {
            questionRows.push({
              category_id: catByKey.get(catKey)!,
              topic_id: topicId(catKey, t.key),
              scenario: q.scenario,
              options: q.options,
              order_index: i,
            });
          });
        });
      });
      questionsLudopatia.forEach((q, i) => {
        questionRows.push({
          category_id: catByKey.get("ludopatia")!,
          topic_id: null,
          scenario: q.scenario,
          options: q.options,
          order_index: i,
        });
      });

      const { error: qError } = await supabase.from("quiz_questions").insert(questionRows);
      if (qError) throw qError;
      return true;
    },
    onSuccess: () => invalidate(),
  });
};