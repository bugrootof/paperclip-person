import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { boardT, i18n, t } from ".";
import messages from "./board-zh-CN.json";
import { timeAgo } from "../lib/timeAgo";
import { formatDate, relativeTime, formatProjectBudget } from "../lib/utils";
import { InteractionGovernancePanel, applyGovernanceChange } from "../components/InteractionGovernancePanel";
import { Field } from "../components/agent-config-primitives";
import { TooltipProvider } from "../components/ui/tooltip";
import { StatusBadge, IssueStatusBadge } from "../components/StatusBadge";
import { PriorityIcon } from "../components/PriorityIcon";
import { validateLocaleMessages } from "./locale-validation";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(tsx?|jsx?)$/.test(entry.name) && !/\.(?:d\.)?(?:test|spec)\.[jt]sx?$/.test(entry.name) ? [path] : [];
  });
}

function boardTranslationKeys(source: string): string[] {
  const imports = source.match(/import\s*\{([^}]+)\}\s*from\s*["'][^"']*\/i18n["']/)?.[1];
  const boardTImport = imports?.match(/\bboardT(?:\s+as\s+(\w+))?\b/);
  const localName = boardTImport?.[1] ?? (boardTImport ? "boardT" : undefined);
  if (!localName) return [];
  const pattern = new RegExp(`\\b${localName}\\(\\s*("(?:\\\\.|[^"\\\\])*")`, "g");
  return Array.from(source.matchAll(pattern), ([, quotedKey]) => JSON.parse(quotedKey) as string);
}

beforeEach(async () => { await i18n.changeLanguage("zh-CN"); });

afterEach(async () => { vi.useRealTimers(); await i18n.changeLanguage("zh-CN"); });

describe("Simplified Chinese board", () => {
  it("renders navigation and onboarding copy in Chinese", () => {
    expect(i18n.language).toBe("zh-CN");
    expect(boardT("Dashboard")).toBe("仪表盘");
    expect(boardT("Create task")).toBe("创建任务");
    expect(boardT("Sort:")).toBe("排序：");
    expect(boardT("No goals yet.")).toBe("暂无目标。");
    expect(t("app.noCompanies.title")).toBe("创建您的第一家公司");
  });

  it("validates copy and interpolation against English source keys", () => {
    const english = Object.fromEntries(Object.keys(messages).map(key => [key, key]));
    expect(validateLocaleMessages(messages, english)).toEqual([]);
    expect(boardT("Change status (current: {{status}})", { status: "待办" })).toBe("更改状态（当前：待办）");
  });

  it("has a Chinese catalog entry for every static board translation call", () => {
    const files = sourceFiles(fileURLToPath(new URL("..", import.meta.url)));
    const missing = files.flatMap((file) =>
      boardTranslationKeys(readFileSync(file, "utf8"))
        .filter((key) => !Object.hasOwn(messages, key))
        .map((key) => `${file}: ${key}`),
    );

    expect(missing).toEqual([]);
  });

  it("renders translated status and priority without changing machine values or custom labels", () => {
    expect(renderToStaticMarkup(<StatusBadge status="planned" />)).toContain("已规划");
    expect(renderToStaticMarkup(<IssueStatusBadge status="in_progress" />)).toContain("进行中");
    expect(renderToStaticMarkup(<PriorityIcon priority="high" showLabel />)).toContain("高");
    expect(renderToStaticMarkup(<StatusBadge status="planned" label="My custom label" />)).toContain("My custom label");
    expect(renderToStaticMarkup(<StatusBadge status="plugin_status" />)).toContain("plugin status");
  });

  it("localizes relative time, dates and budget suffix without changing amounts", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-31T12:00:00Z"));
    expect(timeAgo("2026-10-31T11:55:00Z")).toBe("5 分钟前");
    expect(relativeTime("2026-10-31T10:00:00Z")).toBe("2 小时前");
    expect(formatDate("2026-10-20T12:00:00Z")).toContain("2026");
    expect(formatProjectBudget({ amountCents: 150, windowKind: "calendar_month_utc" })).toContain("1.50/月");
    await i18n.changeLanguage("en");
    expect(timeAgo("2026-10-31T11:55:00Z")).toBe("5m ago");
    expect(formatProjectBudget({ amountCents: 150, windowKind: "calendar_month_utc" })).toBe("$1.50/mo");
  });

  it("renders configured labels and governance in Chinese while preserving policy values", () => {
    const markup = renderToStaticMarkup(<TooltipProvider><InteractionGovernancePanel governance={{ request_confirmation: { cap: "human_only" } }} onChange={() => {}} /><Field label="Model"><input /></Field></TooltipProvider>);
    expect(markup).toContain("任何人（默认）");
    expect(markup).toContain(boardT("Human only"));
    expect(markup).toContain("模型");
    expect(applyGovernanceChange({}, "request_confirmation", "cap", "human_only")).toEqual({ request_confirmation: { cap: "human_only" } });
  });

  it("preserves unknown copy and supports English fallback", async () => {
    expect(boardT("Untranslated copy")).toBe("Untranslated copy");
    await i18n.changeLanguage("en");
    expect(boardT("Dashboard")).toBe("Dashboard");
    expect(boardT("Change status (current: {{status}})", { status: "Todo" })).toBe("Change status (current: Todo)");
    expect(t("app.noCompanies.title")).toBe("Create your first organization");
  });
});
