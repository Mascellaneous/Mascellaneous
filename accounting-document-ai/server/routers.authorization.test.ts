import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const {
  createDocument,
  createDocumentChunks,
  extractDocumentText,
  getChatSessionForUser,
  getSupportedDocumentKind,
  splitTextIntoChunks,
  storagePut,
  updateDocumentProcessingState,
} = vi.hoisted(() => ({
  createDocument: vi.fn(),
  createDocumentChunks: vi.fn(),
  extractDocumentText: vi.fn(),
  getChatSessionForUser: vi.fn(),
  getSupportedDocumentKind: vi.fn(),
  splitTextIntoChunks: vi.fn(),
  storagePut: vi.fn(),
  updateDocumentProcessingState: vi.fn(),
}));

vi.mock("./db", () => ({
  createDocument,
  createDocumentChunks,
  getChatSessionForUser,
  updateDocumentProcessingState,
}));
vi.mock("./documentProcessing", () => ({
  extractDocumentText,
  getSupportedDocumentKind,
  MAX_DOCUMENT_SIZE_BYTES: 12 * 1024 * 1024,
  splitTextIntoChunks,
}));
vi.mock("./storage", () => ({ storagePut }));

import { appRouter } from "./routers";

function createContext(role: "admin" | "user" | null): TrpcContext {
  return {
    user: role
      ? {
          id: 9,
          openId: "test-user",
          name: "Test User",
          email: "test@example.com",
          loginMethod: "manus",
          role,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        }
      : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("router authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSupportedDocumentKind.mockReturnValue("txt");
    storagePut.mockResolvedValue({ key: "knowledge-base/test.txt", url: "/manus-storage/knowledge-base/test.txt" });
    extractDocumentText.mockResolvedValue("這是一份具有足夠內容可供解析的文字文件。");
    splitTextIntoChunks.mockReturnValue(["這是一份具有足夠內容可供解析的文字文件。"]);
    createDocument.mockResolvedValue(66);
    createDocumentChunks.mockResolvedValue(undefined);
    updateDocumentProcessingState.mockResolvedValue(undefined);
  });

  it("does not allow a regular user to retrieve the admin document list", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.documents.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows only an admin to begin document upload", async () => {
    const regularUser = appRouter.createCaller(createContext("user"));
    const anonymousUser = appRouter.createCaller(createContext(null));
    const file = { fileName: "policy.txt", mimeType: "text/plain", contentBase64: "c2FtcGxlIGRvY3VtZW50" };

    await expect(regularUser.documents.upload(file)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(anonymousUser.documents.upload(file)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows an admin to upload, parse, and mark a document as ready", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    const result = await caller.documents.upload({
      fileName: "policy.txt",
      mimeType: "text/plain",
      contentBase64: "5pyN5YuZ5paH5a2X5YaF5a65",
    });

    expect(result).toEqual({ id: 66, fileName: "policy.txt", chunkCount: 1, status: "ready" });
    expect(createDocument).toHaveBeenCalledWith(expect.objectContaining({ status: "processing", chunkCount: 0 }));
    expect(createDocumentChunks).toHaveBeenCalledWith(66, ["這是一份具有足夠內容可供解析的文字文件。"]);
    expect(updateDocumentProcessingState).toHaveBeenCalledWith({ documentId: 66, status: "ready", chunkCount: 1 });
  });

  it("does not allow an anonymous visitor to access knowledge history", async () => {
    const caller = appRouter.createCaller(createContext(null));
    await expect(caller.knowledge.history({ sessionId: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("does not reveal a session that is not owned by the signed-in user", async () => {
    getChatSessionForUser.mockResolvedValueOnce(null);
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.knowledge.history({ sessionId: 88 })).rejects.toThrow("找不到此問答紀錄");
  });
});
