import { Fragment, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Clock3,
  Copy,
  FileClock,
  Languages,
  LoaderCircle,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  clearTranslationHistory,
  deleteTranslationHistoryItem,
  loadTranslationHistory,
  type TranslationHistoryItem,
} from "../lib/history";

function localDateKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatDay(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (localDateKey(value) === localDateKey(today.toISOString())) return "今天";
  if (localDateKey(value) === localDateKey(yesterday.toISOString())) return "昨天";
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function previewText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function HistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<TranslationHistoryItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    void loadTranslationHistory()
      .then((items) => {
        setHistory(items);
        setSelectedId(items[0]?.id ?? "");
      })
      .catch((cause) => setLoadError(String(cause)))
      .finally(() => setLoading(false));
  }, []);

  const filteredHistory = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase();
    if (!keyword) return history;
    return history.filter((item) => [
      item.sourceText,
      item.translatedText,
      item.sourceLanguage,
      item.targetLanguage,
      item.profileName,
      item.model,
    ].some((value) => value.toLocaleLowerCase().includes(keyword)));
  }, [history, query]);

  const selected = filteredHistory.find((item) => item.id === selectedId) ?? filteredHistory[0] ?? null;

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("内容已复制");
    } catch (cause) {
      toast.error("复制失败", { description: String(cause) });
    }
  }

  async function removeSelected() {
    if (!selected) return;
    try {
      const items = await deleteTranslationHistoryItem(selected.id);
      setHistory(items);
      setSelectedId(items[0]?.id ?? "");
      toast.success("历史记录已删除");
    } catch (cause) {
      toast.error("删除失败", { description: String(cause) });
    }
  }

  async function clearAll() {
    try {
      await clearTranslationHistory();
      setHistory([]);
      setSelectedId("");
      setQuery("");
      toast.success("历史记录已清空");
    } catch (cause) {
      toast.error("清空失败", { description: String(cause) });
    }
  }

  if (loading) {
    return <div className="page-loading"><div className="loading-orbit"><LoaderCircle className="spin" /></div><strong>正在读取历史记录</strong><span>数据仅保存在本机</span></div>;
  }

  return (
    <section className="history-page">
      <header className="history-page-header">
        <h1>翻译历史</h1>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="secondary" disabled={history.length === 0}><Trash2 size={16} />清空记录</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <div className="dialog-danger-icon"><Trash2 size={20} /></div>
            <AlertDialogTitle>清空全部翻译历史？</AlertDialogTitle>
            <AlertDialogDescription>保存在本机的 {history.length} 条翻译记录将被永久删除，此操作无法撤销。</AlertDialogDescription>
            <div className="dialog-actions"><AlertDialogCancel asChild><Button type="button" variant="secondary">取消</Button></AlertDialogCancel><AlertDialogAction asChild><Button type="button" variant="destructive" onClick={() => void clearAll()}>确认清空</Button></AlertDialogAction></div>
          </AlertDialogContent>
        </AlertDialog>
      </header>

      <div className="history-surface">
        <aside className="history-sidebar">
          <div className="history-search">
            <Search size={16} />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索原文或译文…" aria-label="搜索历史记录" />
          </div>
          <div className="history-count"><span>{query ? `找到 ${filteredHistory.length} 条` : `${history.length} 条记录`}</span><small>最多保留 200 条</small></div>

          <div className="history-list">
            {filteredHistory.length > 0 ? filteredHistory.map((item, index) => {
              const showDay = index === 0 || localDateKey(item.createdAt) !== localDateKey(filteredHistory[index - 1].createdAt);
              return (
                <Fragment key={item.id}>
                  {showDay && <div className="history-day">{formatDay(item.createdAt)}</div>}
                  <button type="button" className={selected?.id === item.id ? "history-list-item active" : "history-list-item"} onClick={() => setSelectedId(item.id)} aria-pressed={selected?.id === item.id}>
                    <span className="history-item-top"><strong>{item.sourceLanguage} <ArrowRight size={11} /> {item.targetLanguage}</strong><small>{formatTime(item.createdAt)}</small></span>
                    <span className="history-item-source">{previewText(item.sourceText)}</span>
                    <span className="history-item-result">{previewText(item.translatedText)}</span>
                  </button>
                </Fragment>
              );
            }) : (
              <div className="history-list-empty">
                <Search size={20} />
                <strong>{history.length > 0 ? "没有匹配的记录" : "还没有翻译记录"}</strong>
                <span>{history.length > 0 ? "换个关键词试试" : "成功完成翻译后会自动保存在这里"}</span>
              </div>
            )}
          </div>
        </aside>

        <main className="history-detail">
          {loadError ? (
            <div className="history-detail-empty"><FileClock size={30} /><strong>历史记录读取失败</strong><span>{loadError}</span></div>
          ) : selected ? (
            <>
              <header className="history-detail-header">
                <div>
                  <div className="history-language-pair"><Languages size={16} /><strong>{selected.sourceLanguage}</strong><ArrowRight size={14} /><strong>{selected.targetLanguage}</strong></div>
                  <span className="history-metadata"><Clock3 size={13} />{formatDateTime(selected.createdAt)}<i />{selected.profileName} · {selected.model}</span>
                </div>
                <div className="history-detail-actions">
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button className="history-delete-action" variant="ghost"><Trash2 size={15} />删除记录</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <div className="dialog-danger-icon"><Trash2 size={20} /></div>
                      <AlertDialogTitle>删除这条翻译记录？</AlertDialogTitle>
                      <AlertDialogDescription>原文和译文将从本机永久删除，此操作无法撤销。</AlertDialogDescription>
                      <div className="dialog-actions"><AlertDialogCancel asChild><Button type="button" variant="secondary">取消</Button></AlertDialogCancel><AlertDialogAction asChild><Button type="button" variant="destructive" onClick={() => void removeSelected()}>确认删除</Button></AlertDialogAction></div>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button variant="secondary" onClick={() => void copyText(selected.translatedText)}><Copy size={15} />复制译文</Button>
                  <Button onClick={() => navigate(`/translate?history=${encodeURIComponent(selected.id)}`)}><RotateCcw size={15} />再次使用</Button>
                </div>
              </header>

              <div className="history-texts">
                <article className="history-text-block">
                  <div className="history-text-heading"><span>原文</span><Button variant="ghost" size="sm" onClick={() => void copyText(selected.sourceText)}><Copy size={13} />复制</Button></div>
                  <div className="history-source-text">{selected.sourceText}</div>
                </article>
                <article className="history-text-block translated">
                  <div className="history-text-heading"><span>译文</span></div>
                  <div className="history-translated-text markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{selected.translatedText}</ReactMarkdown></div>
                </article>
              </div>
            </>
          ) : (
            <div className="history-detail-empty"><FileClock size={30} /><strong>{history.length > 0 ? "选择一条翻译记录" : "历史记录会出现在这里"}</strong><span>{history.length > 0 ? "从左侧列表中选择要查看的内容" : "前往翻译页面完成第一次翻译"}</span>{history.length === 0 && <Button onClick={() => navigate("/translate")}><Languages size={16} />开始翻译</Button>}</div>
          )}
        </main>
      </div>
    </section>
  );
}
