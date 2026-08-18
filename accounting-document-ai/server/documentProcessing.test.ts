import { describe, expect, it } from "vitest";
import { getSupportedDocumentKind, splitTextIntoChunks } from "./documentProcessing";

describe("document processing", () => {
  it("recognizes the supported document extensions", () => {
    expect(getSupportedDocumentKind("annual-report.PDF")).toBe("pdf");
    expect(getSupportedDocumentKind("accounting-policy.docx")).toBe("docx");
    expect(getSupportedDocumentKind("notes.txt")).toBe("txt");
    expect(getSupportedDocumentKind("legacy-document.doc")).toBeNull();
  });

  it("preserves paragraph boundaries while producing retrieval-ready chunks", () => {
    const text = [
      "收入應於履約義務滿足時認列，並以預期有權收取的對價衡量。",
      "應收帳款於初始認列後，應依預期信用損失模型評估減損。",
      "存貨應按成本與淨變現價值孰低衡量，成本採加權平均法計算。",
    ].join("\n\n");

    const chunks = splitTextIntoChunks(text, 45);

    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toContain("履約義務");
    expect(chunks[1]).toContain("預期信用損失");
    expect(chunks[2]).toContain("淨變現價值");
  });

  it("rejects content that contains too little extractable text", () => {
    expect(() => splitTextIntoChunks("無文字")).toThrow("未能從檔案擷取足夠的文字");
  });
});
