import { beforeEach, describe, expect, it, vi } from "vitest";

const { getKnowledgeChunkCandidates, invokeLLM, listLLMModels } = vi.hoisted(() => ({
  getKnowledgeChunkCandidates: vi.fn(),
  invokeLLM: vi.fn(),
  listLLMModels: vi.fn(),
}));

vi.mock("./db", () => ({ getKnowledgeChunkCandidates }));
vi.mock("./_core/llm", () => ({ invokeLLM, listLLMModels }));

import { answerFromKnowledge } from "./knowledge";

describe("knowledge-grounded answering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getKnowledgeChunkCandidates.mockResolvedValue([
      {
        id: 11,
        documentId: 1,
        documentName: "收入認列政策.pdf",
        chunkIndex: 0,
        content: "本公司於履約義務滿足時認列收入，並以預期有權收取的對價衡量。",
      },
      {
        id: 12,
        documentId: 1,
        documentName: "收入認列政策.pdf",
        chunkIndex: 1,
        content: "應收帳款應依預期信用損失模型評估減損。",
      },
    ]);
    listLLMModels.mockResolvedValue({ data: [{ id: "gpt-5-mini" }] });
    invokeLLM.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ answer: "收入於履約義務滿足時認列。", usedChunkIds: [11] }) } }],
    });
  });

  it("returns only the document chunk cited by the answer", async () => {
    const result = await answerFromKnowledge("收入何時認列？");

    expect(result.answer).toBe("收入於履約義務滿足時認列。");
    expect(result.sources).toEqual([
      expect.objectContaining({ chunkId: 11, documentName: "收入認列政策.pdf", chunkIndex: 0 }),
    ]);
    expect(invokeLLM).toHaveBeenCalledTimes(1);
  });

  it("gives a transparent response when the knowledge base has no ready chunks", async () => {
    getKnowledgeChunkCandidates.mockResolvedValueOnce([]);

    const result = await answerFromKnowledge("收入何時認列？");

    expect(result.answer).toContain("尚未有可供查詢");
    expect(result.sources).toEqual([]);
    expect(invokeLLM).not.toHaveBeenCalled();
  });

  it("sends only the semantically selected chunk to the answer prompt and ignores an unselected citation", async () => {
    getKnowledgeChunkCandidates.mockResolvedValue([
      { id: 11, documentId: 1, documentName: "收入政策.pdf", chunkIndex: 0, content: "收入應於履約義務滿足時認列。" },
      { id: 12, documentId: 1, documentName: "收入政策.pdf", chunkIndex: 1, content: "收入相關的非選取補充段落一。" },
      { id: 13, documentId: 1, documentName: "收入政策.pdf", chunkIndex: 2, content: "收入相關的非選取補充段落二。" },
      { id: 14, documentId: 1, documentName: "收入政策.pdf", chunkIndex: 3, content: "收入相關的非選取補充段落三。" },
      { id: 15, documentId: 1, documentName: "收入政策.pdf", chunkIndex: 4, content: "收入相關的非選取補充段落四。" },
      { id: 16, documentId: 1, documentName: "收入政策.pdf", chunkIndex: 5, content: "收入相關的非選取補充段落五。" },
    ]);
    invokeLLM
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ chunkIds: [11] }) } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ answer: "收入於履約義務滿足時認列。", usedChunkIds: [999] }) } }] });

    const result = await answerFromKnowledge("收入何時認列？");
    const answerRequest = invokeLLM.mock.calls[1]?.[0];
    const answerContext = answerRequest?.messages[1]?.content;

    expect(invokeLLM).toHaveBeenCalledTimes(2);
    expect(answerContext).toContain("段落 ID: 11");
    expect(answerContext).not.toContain("段落 ID: 12");
    expect(result.sources).toEqual([expect.objectContaining({ chunkId: 11 })]);
  });
});
