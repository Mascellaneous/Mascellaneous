import { invokeLLM, listLLMModels } from "./_core/llm";
import { getKnowledgeChunkCandidates } from "./db";

export type SourceCitation = {
  chunkId: number;
  documentId: number;
  documentName: string;
  chunkIndex: number;
  excerpt: string;
};

type CandidateChunk = Omit<SourceCitation, "excerpt"> & { content: string };

function compact(value: string) {
  return value.toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

function queryTerms(question: string) {
  const normalized = compact(question);
  const words = normalized.match(/[a-z0-9][a-z0-9_-]{1,}/g) ?? [];
  const chinese = (normalized.match(/[\u4e00-\u9fff]/g) ?? []);
  const bigrams = chinese.slice(0, -1).map((character, index) => `${character}${chinese[index + 1]}`);
  return Array.from(new Set([...words, ...bigrams, ...chinese])).filter((term) => term.length > 0);
}

function initialRank(question: string, chunks: CandidateChunk[]) {
  const terms = queryTerms(question);
  const phrase = compact(question).replace(/[？?。,.，、]/g, "");
  return chunks
    .map((chunk) => {
      const content = compact(chunk.content);
      const score = terms.reduce((sum, term) => sum + (content.split(term).length - 1) * (term.length > 1 ? 2 : 0.35), 0);
      return { chunk, score: score + (phrase.length > 4 && content.includes(phrase) ? 8 : 0) };
    })
    .sort((a, b) => b.score - a.score || b.chunk.content.length - a.chunk.content.length)
    .slice(0, 14)
    .map((item) => item.chunk);
}

async function selectModel() {
  const { data } = await listLLMModels();
  const preferred = ["gpt-5-mini", "gpt-5-nano", "claude-haiku-4-5"];
  return preferred.find((model) => data.some((item) => item.id === model)) ?? data[0]?.id;
}

function readContent(response: Awaited<ReturnType<typeof invokeLLM>>) {
  const content = response.choices[0]?.message.content;
  return typeof content === "string" ? content : "";
}

async function semanticRerank(question: string, candidates: CandidateChunk[], model?: string) {
  if (candidates.length <= 5 || !model) return candidates.slice(0, 5);
  const candidateText = candidates
    .map((chunk) => `段落 ID ${chunk.chunkId}\n文件：${chunk.documentName}\n內容：${chunk.content}`)
    .join("\n\n---\n\n");

  try {
    const response = await invokeLLM({
      model,
      messages: [
        {
          role: "system",
          content: "你是文件檢索排序器。只根據段落與問題的語意相關程度選出最多五個段落。不要回答問題，也不要選取沒有關聯的段落。",
        },
        { role: "user", content: `問題：${question}\n\n候選段落：\n${candidateText}` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "relevant_chunks",
          strict: true,
          schema: {
            type: "object",
            properties: { chunkIds: { type: "array", items: { type: "integer" } } },
            required: ["chunkIds"],
            additionalProperties: false,
          },
        },
      },
    });
    const parsed = JSON.parse(readContent(response)) as { chunkIds?: number[] };
    const selected = (parsed.chunkIds ?? []).slice(0, 5);
    const selectedChunks = selected.map((id) => candidates.find((chunk) => chunk.chunkId === id)).filter(Boolean) as CandidateChunk[];
    return selectedChunks.length > 0 ? selectedChunks : candidates.slice(0, 5);
  } catch (error) {
    console.warn("[Knowledge] Semantic reranking failed; using initial ranking.", error);
    return candidates.slice(0, 5);
  }
}

function toCitation(chunk: CandidateChunk): SourceCitation {
  return {
    chunkId: chunk.chunkId,
    documentId: chunk.documentId,
    documentName: chunk.documentName,
    chunkIndex: chunk.chunkIndex,
    excerpt: chunk.content.length > 260 ? `${chunk.content.slice(0, 260).trim()}…` : chunk.content,
  };
}

export async function answerFromKnowledge(question: string) {
  const allChunks = await getKnowledgeChunkCandidates();
  const candidates = initialRank(
    question,
    allChunks.map((chunk) => ({ ...chunk, chunkId: chunk.id })),
  );
  if (candidates.length === 0) {
    return {
      answer: "文件庫目前尚未有可供查詢的已解析內容。請管理員先上傳並完成解析文件。",
      sources: [] as SourceCitation[],
    };
  }

  const model = await selectModel();
  const selected = await semanticRerank(question, candidates, model);
  const context = selected
    .map((chunk) => `[段落 ID: ${chunk.chunkId}]\n文件：${chunk.documentName}\n段落：${chunk.content}`)
    .join("\n\n=====\n\n");

  if (!model) {
    return {
      answer: "目前無法連接 AI 回答服務，請稍後再試。",
      sources: selected.map(toCitation),
    };
  }

  const response = await invokeLLM({
    model,
    messages: [
      {
        role: "system",
        content: "你是嚴謹的文件知識庫助理。只可根據提供的參考段落回答；不可使用外部知識、推測或補充文件未載明的事實。若參考段落不足以回答，請明確說「文件庫未包含足夠資訊以回答此問題。」回答請精煉清楚，預設使用繁體中文。",
      },
      { role: "user", content: `使用者問題：${question}\n\n參考段落：\n${context}` },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "knowledge_answer",
        strict: true,
        schema: {
          type: "object",
          properties: {
            answer: { type: "string" },
            usedChunkIds: { type: "array", items: { type: "integer" } },
          },
          required: ["answer", "usedChunkIds"],
          additionalProperties: false,
        },
      },
    },
  });
  const parsed = JSON.parse(readContent(response)) as { answer?: string; usedChunkIds?: number[] };
  const sourceIds = (parsed.usedChunkIds ?? []).filter((id) => selected.some((chunk) => chunk.chunkId === id));
  const citedChunks = (sourceIds.length > 0 ? sourceIds : selected.map((chunk) => chunk.chunkId))
    .map((id) => selected.find((chunk) => chunk.chunkId === id))
    .filter(Boolean) as CandidateChunk[];

  return {
    answer: parsed.answer?.trim() || "文件庫未包含足夠資訊以回答此問題。",
    sources: citedChunks.map(toCitation),
  };
}
