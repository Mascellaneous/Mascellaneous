import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  BookOpenCheck,
  ChevronRight,
  Clock3,
  FileText,
  Loader2,
  MessageSquarePlus,
  SendHorizontal,
  Sparkles,
} from "lucide-react";
import { FormEvent, KeyboardEvent, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

function messageTime(value: Date | string) {
  return new Date(value).toLocaleDateString("zh-Hant", { month: "short", day: "numeric" });
}

export default function Chat() {
  return (
    <DashboardLayout>
      <ChatWorkspace />
    </DashboardLayout>
  );
}

function ChatWorkspace() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [activeSessionId, setActiveSessionId] = useState<number | undefined>();
  const [question, setQuestion] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState("");
  const statsQuery = trpc.knowledge.stats.useQuery(undefined, { enabled: Boolean(user) });
  const sessionsQuery = trpc.knowledge.sessions.useQuery(undefined, { enabled: Boolean(user) });
  const historyQuery = trpc.knowledge.history.useQuery(
    { sessionId: activeSessionId },
    { enabled: Boolean(user) },
  );
  const askMutation = trpc.knowledge.ask.useMutation({
    onSuccess: async (result) => {
      setActiveSessionId(result.sessionId);
      setPendingQuestion("");
      await Promise.all([utils.knowledge.sessions.invalidate(), utils.knowledge.history.invalidate()]);
    },
    onError: (error) => {
      setPendingQuestion("");
      toast.error(error.message || "暫時無法取得回答，請稍後再試。");
    },
  });

  const submitQuestion = () => {
    const value = question.trim();
    if (!value || askMutation.isPending) return;
    setPendingQuestion(value);
    setQuestion("");
    askMutation.mutate({ question: value, sessionId: activeSessionId });
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitQuestion();
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitQuestion();
    }
  };

  const messages = historyQuery.data ?? [];
  const hasKnowledge = (statsQuery.data?.documentCount ?? 0) > 0;

  return (
    <div className="min-h-[calc(100vh-2rem)] overflow-hidden rounded-[1.5rem] border border-[#d9ded8] bg-[#fafaf6] shadow-[0_16px_60px_rgba(39,58,45,0.08)]">
      <header className="flex flex-col gap-5 border-b border-[#e1e5df] bg-[linear-gradient(115deg,#f9faf5_0%,#edf2e9_100%)] px-6 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-[#4d7364] uppercase"><Sparkles className="size-3.5" />Document-grounded intelligence</div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#183b31]">知識問答</h1>
          <p className="mt-1 text-sm text-[#627068]">每個回答均以已解析的文件段落為依據，並保留引用來源。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="border border-[#cbdacd] bg-white/80 px-3 py-1.5 font-medium text-[#285747] hover:bg-white"><FileText className="mr-1.5 size-3.5" />{statsQuery.data?.documentCount ?? "—"} 份文件</Badge>
          <Badge className="border border-[#cbdacd] bg-white/80 px-3 py-1.5 font-medium text-[#285747] hover:bg-white"><BookOpenCheck className="mr-1.5 size-3.5" />{statsQuery.data?.chunkCount ?? "—"} 個段落</Badge>
        </div>
      </header>

      <div className="grid min-h-[690px] lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#e1e5df] bg-[#f5f7f2] p-4 lg:block">
          <Button
            variant="outline"
            onClick={() => setActiveSessionId(undefined)}
            className="mb-5 w-full justify-start border-[#cbd8ce] bg-white text-[#234f40] shadow-sm hover:bg-[#ebf2ea]"
          >
            <MessageSquarePlus className="mr-2 size-4" />新的提問
          </Button>
          <div className="mb-3 flex items-center gap-2 px-1 text-[11px] font-semibold tracking-[0.14em] text-[#748078] uppercase"><Clock3 className="size-3.5" />歷史紀錄</div>
          <div className="space-y-1">
            {sessionsQuery.isLoading ? <div className="px-3 py-4 text-sm text-muted-foreground">讀取紀錄中…</div> : null}
            {!sessionsQuery.isLoading && (sessionsQuery.data?.length ?? 0) === 0 ? <p className="px-3 py-4 text-sm leading-6 text-[#748078]">你的提問紀錄會顯示於此。</p> : null}
            {sessionsQuery.data?.map((session) => (
              <button
                key={session.id}
                onClick={() => setActiveSessionId(session.id)}
                className={`group flex w-full items-start gap-2 rounded-xl px-3 py-3 text-left transition-colors ${activeSessionId === session.id ? "bg-[#dcebdd] text-[#163c30]" : "text-[#56655c] hover:bg-[#e8eee6]"}`}
              >
                <span className="line-clamp-2 flex-1 text-sm leading-5">{session.title}</span>
                <ChevronRight className="mt-0.5 size-3.5 shrink-0 opacity-45" />
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-w-0 flex-col bg-[#fffefb]">
          {!hasKnowledge && !statsQuery.isLoading ? (
            <div className="m-6 rounded-2xl border border-[#eadcb8] bg-[#fffae9] p-5 text-[#705d2a]">
              <div className="flex items-start gap-3"><BookOpenCheck className="mt-0.5 size-5 shrink-0" /><div><p className="font-semibold">知識庫尚未準備好</p><p className="mt-1 text-sm leading-6">目前還沒有可供檢索的文件內容。{user?.role === "admin" ? "請先上傳文件，系統完成解析後即可開始問答。" : "請聯絡管理員上傳相關文件。"}</p>{user?.role === "admin" ? <Button size="sm" onClick={() => setLocation("/documents")} className="mt-3 bg-[#285747] hover:bg-[#1f493b]">前往文件管理</Button> : null}</div></div>
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto px-5 py-8 sm:px-8">
            {!activeSessionId && messages.length === 0 && !pendingQuestion ? (
              <div className="mx-auto flex min-h-[380px] max-w-2xl flex-col justify-center">
                <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#dceadd] text-[#28604d]"><Sparkles className="size-5" /></div>
                <h2 className="font-serif text-3xl font-semibold tracking-tight text-[#183b31]">今天想從文件中釐清甚麼？</h2>
                <p className="mt-3 max-w-xl leading-7 text-[#66736b]">以自然語言提出問題。系統會先找出最相關的文件段落，再產生可追溯的回答。</p>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {["本期應收帳款的認列原則是甚麼？", "請整理文件中提到的存貨評價方法。", "有沒有關於折舊年限的說明？", "文件是否提到收入認列的特殊情況？"].map((prompt) => (
                    <button key={prompt} disabled={!hasKnowledge} onClick={() => setQuestion(prompt)} className="rounded-xl border border-[#dfe6df] bg-[#fbfcf9] p-4 text-left text-sm leading-6 text-[#3a5145] transition hover:border-[#aac5b3] hover:bg-[#f3f8f1] disabled:cursor-not-allowed disabled:opacity-50">{prompt}</button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-7">
                {historyQuery.isLoading ? <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />載入對話內容中…</div> : null}
                {messages.map((message) => (
                  <article key={message.id} className={message.role === "user" ? "ml-auto max-w-[85%]" : "max-w-[94%]"}>
                    {message.role === "user" ? <div className="rounded-2xl rounded-tr-sm bg-[#225c4a] px-5 py-3.5 text-sm leading-6 text-white shadow-sm">{message.content}</div> : <div className="rounded-2xl rounded-tl-sm border border-[#e2e6df] bg-[#fbfcf8] p-5 shadow-[0_6px_22px_rgba(37,64,49,0.04)]"><div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[#4f7b69] uppercase"><Sparkles className="size-3.5" />文件回答</div><p className="whitespace-pre-wrap text-sm leading-7 text-[#2e3d35]">{message.content}</p>{message.sources.length > 0 ? <SourceList sources={message.sources} /> : null}</div>}
                  </article>
                ))}
                {pendingQuestion ? <><article className="ml-auto max-w-[85%]"><div className="rounded-2xl rounded-tr-sm bg-[#225c4a] px-5 py-3.5 text-sm leading-6 text-white shadow-sm">{pendingQuestion}</div></article><div className="flex items-center gap-2 text-sm text-[#708078]"><Loader2 className="size-4 animate-spin" />正在檢索相關段落並撰寫回答…</div></> : null}
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="border-t border-[#e1e5df] bg-[#fbfcf8] p-4 sm:p-5">
            <div className="mx-auto flex max-w-3xl items-end gap-3 rounded-2xl border border-[#d7dfd7] bg-white p-2 shadow-[0_7px_22px_rgba(37,64,49,0.05)] focus-within:border-[#8aae99] focus-within:ring-4 focus-within:ring-[#dbeadc]/55">
              <Textarea value={question} disabled={!hasKnowledge || askMutation.isPending} onChange={(event) => setQuestion(event.target.value)} onKeyDown={onInputKeyDown} placeholder={hasKnowledge ? "輸入你的問題…（Enter 傳送，Shift + Enter 換行）" : "請等待管理員建立文件知識庫"} className="min-h-12 max-h-32 resize-none border-0 bg-transparent px-3 py-3 text-sm shadow-none focus-visible:ring-0" />
              <Button type="submit" disabled={!hasKnowledge || !question.trim() || askMutation.isPending} className="mb-0.5 size-10 shrink-0 rounded-xl bg-[#225c4a] p-0 hover:bg-[#184738]" aria-label="傳送問題">{askMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <SendHorizontal className="size-4" />}</Button>
            </div>
            <p className="mx-auto mt-2 max-w-3xl px-2 text-xs text-[#849088]">回答僅會以本知識庫中的相關段落為依據。</p>
          </form>
        </section>
      </div>
    </div>
  );
}

function SourceList({ sources }: { sources: Array<{ chunkId: number; documentName: string; chunkIndex: number; excerpt: string }> }) {
  return <div className="mt-5 border-t border-[#e3e8e1] pt-4"><p className="mb-3 text-[11px] font-semibold tracking-[0.13em] text-[#708177] uppercase">引用來源</p><div className="space-y-2">{sources.map((source) => <details key={source.chunkId} className="group rounded-xl border border-[#dde6de] bg-white px-3 py-2.5"><summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-[#315b49]"><FileText className="size-3.5 shrink-0" /><span className="min-w-0 flex-1 truncate">{source.documentName}</span><span className="shrink-0 text-xs text-[#829087]">段落 {source.chunkIndex + 1}</span></summary><p className="mt-2 border-t border-[#edf0eb] pt-2 text-sm leading-6 text-[#66746b]">{source.excerpt}</p></details>)}</div></div>;
}
