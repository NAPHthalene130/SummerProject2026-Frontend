import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { chatWithAgent, convertMobileReport, dispatchWorkOrder, fetchMobileReports, fetchStaff, fetchWorkOrders, rejectMobileReport, reviewWorkOrderFeedback, updateWorkOrderStatus, type MobileReport } from "../api/client";
import { useDataMode } from "../context/DataModeContext";
import { mockStaff, type StaffMember } from "../data/mockStaff";
import { mockWorkOrders, type WorkOrderItem } from "../data/mockWorkOrders";
import { getLevelText } from "../utils/riskStyle";

type FilterKey = "unassigned" | "pending" | "completed" | "ignored";
type MiddleView = "orders" | "reports";
const WORK_ORDER_REFRESH_INTERVAL_MS = 5_000;
const WORK_ORDER_FILTERS = [
  { key: "unassigned", label: "待派发", color: "#7f8c8d" },
  { key: "pending", label: "待处理", color: "#FBBC04" },
  { key: "completed", label: "已解决", color: "#34A853" },
  { key: "ignored", label: "已忽略", color: "#7f8c8d" },
] as const;
const PERSONNEL_CATEGORIES = [
  ["traffic_police", "交警执法", "超速、违停、事故管制"],
  ["road_maintenance", "道路养护", "坑洼、护栏、标线、施工"],
  ["municipal_facilities", "市政设施", "井盖、路灯、信号设施"],
  ["vehicle_rescue", "清障救援", "故障车、事故车辆清障"],
  ["traffic_coordination", "交通疏导", "拥堵、大型活动疏导"],
  ["emergency_fire", "应急消防", "火灾、危化品、重大事故"],
] as const;

function categoryName(code?: string) {
  return PERSONNEL_CATEGORIES.find(([value]) => value === code)?.[1] ?? "未分类";
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  text: string;
}

function renderInlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  const tokenPattern = /(\*\*[^*\n]+\*\*|~~[^~\n]+~~|_[^_\n]+_|`[^`\n]+`|\[[^\]]+\]\((?:https?:\/\/|\/)[^\s)]+\))/g;
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(text)) !== null) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${match.index}`;
    if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("~~")) {
      nodes.push(<del key={key}>{token.slice(2, -2)}</del>);
    } else if (token.startsWith("_")) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("`")) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else {
      const linkMatch = /^\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)$/.exec(token);
      if (linkMatch) {
        nodes.push(<a key={key} href={linkMatch[2]} target="_blank" rel="noreferrer">{linkMatch[1]}</a>);
      }
    }
    cursor = match.index + token.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

function splitMarkdownTableRow(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let escaped = false;

  for (const character of line.trim()) {
    if (escaped) {
      cell += character;
      escaped = false;
    } else if (character === "\\") {
      escaped = true;
    } else if (character === "|") {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += character;
    }
  }
  cells.push(cell.trim());

  if (line.trim().startsWith("|")) cells.shift();
  if (line.trim().endsWith("|")) cells.pop();
  return cells;
}

function isMarkdownTableSeparator(line: string): boolean {
  const cells = splitMarkdownTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, "")));
}

function markdownTableAlignment(separator: string): "left" | "center" | "right" | undefined {
  const normalized = separator.replace(/\s/g, "");
  if (normalized.startsWith(":") && normalized.endsWith(":")) return "center";
  if (normalized.endsWith(":")) return "right";
  if (normalized.startsWith(":")) return "left";
  return undefined;
}

function isMarkdownHorizontalRule(line: string): boolean {
  return /^\s{0,3}((\*\s*){3,}|(-\s*){3,}|(_\s*){3,})\s*$/.test(line);
}

function MarkdownMessage({ content }: { content: string }) {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.trim().startsWith("```")) {
      const language = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(<pre key={`code-${index}`} data-language={language || undefined}><code>{codeLines.join("\n")}</code></pre>);
      continue;
    }

    if (isMarkdownHorizontalRule(line)) {
      blocks.push(<hr key={`rule-${index}`} />);
      index += 1;
      continue;
    }

    if (
      line.includes("|")
      && index + 1 < lines.length
      && isMarkdownTableSeparator(lines[index + 1])
    ) {
      const headers = splitMarkdownTableRow(line);
      const separators = splitMarkdownTableRow(lines[index + 1]);
      const alignments = separators.map(markdownTableAlignment);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].trim() && lines[index].includes("|")) {
        rows.push(splitMarkdownTableRow(lines[index]));
        index += 1;
      }
      blocks.push(
        <div className="agent-table-wrap" key={`table-${index}`}>
          <table>
            <thead>
              <tr>
                {headers.map((header, cellIndex) => (
                  <th key={`th-${cellIndex}`} style={{ textAlign: alignments[cellIndex] }}>
                    {renderInlineMarkdown(header, `th-${index}-${cellIndex}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`tr-${rowIndex}`}>
                  {headers.map((_, cellIndex) => (
                    <td key={`td-${rowIndex}-${cellIndex}`} style={{ textAlign: alignments[cellIndex] }}>
                      {renderInlineMarkdown(row[cellIndex] ?? "", `td-${index}-${rowIndex}-${cellIndex}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    const headingMatch = /^(#{1,4})\s+(.+)$/.exec(line);
    if (headingMatch) {
      const HeadingTag = `h${Math.min(headingMatch[1].length + 2, 6)}` as "h3" | "h4" | "h5" | "h6";
      blocks.push(<HeadingTag key={`heading-${index}`}>{renderInlineMarkdown(headingMatch[2], `heading-${index}`)}</HeadingTag>);
      index += 1;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: ReactNode[] = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        const item = lines[index].replace(/^\s*[-*]\s+/, "");
        items.push(<li key={`ul-${index}`}>{renderInlineMarkdown(item, `ul-${index}`)}</li>);
        index += 1;
      }
      blocks.push(<ul key={`ul-block-${index}`}>{items}</ul>);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: ReactNode[] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        const item = lines[index].replace(/^\s*\d+\.\s+/, "");
        items.push(<li key={`ol-${index}`}>{renderInlineMarkdown(item, `ol-${index}`)}</li>);
        index += 1;
      }
      blocks.push(<ol key={`ol-block-${index}`}>{items}</ol>);
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push(<blockquote key={`quote-${index}`}>{renderInlineMarkdown(quoteLines.join(" "), `quote-${index}`)}</blockquote>);
      continue;
    }

    const paragraphLines = [line.trim()];
    index += 1;
    while (
      index < lines.length
      && lines[index].trim()
      && !/^(#{1,4})\s+/.test(lines[index])
      && !/^\s*[-*]\s+/.test(lines[index])
      && !/^\s*\d+\.\s+/.test(lines[index])
      && !/^>\s?/.test(lines[index])
      && !lines[index].trim().startsWith("```")
      && !isMarkdownHorizontalRule(lines[index])
      && !(lines[index].includes("|") && index + 1 < lines.length && isMarkdownTableSeparator(lines[index + 1]))
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    blocks.push(<p key={`paragraph-${index}`}>{renderInlineMarkdown(paragraphLines.join(" "), `paragraph-${index}`)}</p>);
  }

  return <div className="agent-markdown">{blocks}</div>;
}

export function WorkOrderPage() {
  const { demoDataEnabled } = useDataMode();
  const [orders, setOrders] = useState<WorkOrderItem[]>(() => demoDataEnabled ? mockWorkOrders : []);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => demoDataEnabled ? mockStaff : []);
  const [filter, setFilter] = useState<FilterKey>("unassigned");
  const [middleView, setMiddleView] = useState<MiddleView>("orders");
  const [selectedId, setSelectedId] = useState<string>(() => demoDataEnabled ? mockWorkOrders[0]?.work_order_id ?? "" : "");
  const [detailOrder, setDetailOrder] = useState<WorkOrderItem | null>(null);
  const [assignOrder, setAssignOrder] = useState<WorkOrderItem | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(() => !demoDataEnabled);
  const [staffLoading, setStaffLoading] = useState(() => !demoDataEnabled);
  const [loadError, setLoadError] = useState("");
  const [staffLoadError, setStaffLoadError] = useState("");
  const [mobileReports, setMobileReports] = useState<MobileReport[]>([]);
  const [convertReport, setConvertReport] = useState<MobileReport | null>(null);
  const [convertCategory, setConvertCategory] = useState("traffic_police");
  const [chatInput, setChatInput] = useState("");
  const [agentThreadId, setAgentThreadId] = useState<string | null>(null);
  const [isAgentReplying, setIsAgentReplying] = useState(false);
  const agentMessagesRef = useRef<HTMLDivElement>(null);
  const chatComposerRef = useRef<HTMLTextAreaElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "system", text: "AI 处置助手已接入。选择左侧工单后，我会结合事件等级、道路状态和处置记录给出建议。" },
  ]);

  useEffect(() => {
    const messageList = agentMessagesRef.current;
    if (!messageList) return;
    messageList.scrollTo({ top: messageList.scrollHeight, behavior: "smooth" });
  }, [isAgentReplying, messages]);

  useEffect(() => {
    let active = true;
    const load = () => fetchMobileReports().then((reports) => active && setMobileReports(reports)).catch(() => active && setMobileReports([]));
    void load();
    const timer = window.setInterval(load, WORK_ORDER_REFRESH_INTERVAL_MS);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let workOrdersRequestInFlight = false;
    let staffRequestInFlight = false;

    if (demoDataEnabled) {
      setOrders(mockWorkOrders);
      setStaffMembers(mockStaff);
      setSelectedId(mockWorkOrders[0]?.work_order_id ?? "");
      setLoading(false);
      setStaffLoading(false);
      setLoadError("");
      setStaffLoadError("");
      setAgentThreadId(null);
      setIsAgentReplying(false);
      setMessages([
        { role: "system", text: "AI 处置助手已接入。选择工单后，我会结合事件等级、道路状态和处置记录给出建议。" },
      ]);
      return () => {
        cancelled = true;
      };
    }

    setOrders([]);
    setStaffMembers([]);
    setSelectedId("");
    setLoadError("");
    setStaffLoadError("");
    setDetailOrder(null);
    setAssignOrder(null);
    setAgentThreadId(null);
    setIsAgentReplying(false);
    setMessages([]);

    const loadWorkOrders = async (showLoading: boolean) => {
      if (workOrdersRequestInFlight) return;
      workOrdersRequestInFlight = true;
      if (showLoading) setLoading(true);

      try {
        const workOrders = await fetchWorkOrders();
        if (cancelled) return;
        setOrders(workOrders);
        setDetailOrder((current) => current ? workOrders.find((order) => order.work_order_id === current.work_order_id) ?? null : null);
        setAssignOrder((current) => current ? workOrders.find((order) => order.work_order_id === current.work_order_id) ?? null : null);
        setLoadError("");
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "后端工单数据加载失败");
        }
      } finally {
        workOrdersRequestInFlight = false;
        if (!cancelled && showLoading) setLoading(false);
      }
    };

    const loadStaff = async (showLoading: boolean) => {
      if (staffRequestInFlight) return;
      staffRequestInFlight = true;
      if (showLoading) setStaffLoading(true);

      try {
        const staff = await fetchStaff();
        if (cancelled) return;
        setStaffMembers(staff);
        setStaffLoadError("");
      } catch (error) {
        if (!cancelled) {
          setStaffLoadError(error instanceof Error ? error.message : "后端人员数据加载失败");
        }
      } finally {
        staffRequestInFlight = false;
        if (!cancelled && showLoading) setStaffLoading(false);
      }
    };

    void loadWorkOrders(true);
    void loadStaff(true);

    const refreshTimer = window.setInterval(() => {
      void loadWorkOrders(false);
      void loadStaff(false);
    }, WORK_ORDER_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, [demoDataEnabled]);

  const filteredOrders = useMemo(() => {
    if (filter === "unassigned") return orders.filter((order) => order.work_order_status === 0 && order.status === "unassigned");
    if (filter === "pending") return orders.filter((order) => order.work_order_status === 0 && (order.status === "pending" || order.status === "processing"));
    if (filter === "completed") return orders.filter((order) => order.work_order_status === 1);
    return orders.filter((order) => order.work_order_status === 2);
  }, [filter, orders]);
  const unresolvedOrdersByAssignee = useMemo(() => {
    const groupedOrders = new Map<string, WorkOrderItem[]>();
    orders.forEach((order) => {
      if (order.work_order_status !== 0 || !order.assignee) return;
      const assignedOrders = groupedOrders.get(order.assignee) ?? [];
      assignedOrders.push(order);
      groupedOrders.set(order.assignee, assignedOrders);
    });
    return groupedOrders;
  }, [orders]);
  const selectedOrder = filteredOrders.find((order) => order.work_order_id === selectedId) ?? filteredOrders[0] ?? null;

  const quickPrompts = useMemo(() => {
    if (!selectedOrder) {
      return [
        { label: "查看统计", text: "查看当前工单统计概况" },
        { label: "查询人员", text: "查询当前可派发人员" },
        { label: "法规检索", text: "交通事故现场处置有哪些规定？" },
      ];
    }
    const prompts: Array<{ label: string; text: string }> = [];
    const info = selectedOrder.accident_info;
    const st = selectedOrder.status;
    const level = selectedOrder.event_level;

    if (st === "unassigned") {
      prompts.push({ label: "派发给谁", text: `工单${selectedOrder.work_order_id}应该派发给谁？请先查询可派发人员再推荐` });
      prompts.push({ label: "如何处置", text: `分析工单${selectedOrder.work_order_id}的${info}事故，给出处置建议` });
      if (level === "high") {
        prompts.push({ label: "风险分析", text: `为什么工单${selectedOrder.work_order_id}被判定为高风险？分析事故类型和现场情况` });
      } else {
        prompts.push({ label: "批量预演", text: `预演批量分配结果，不要修改数据库` });
      }
    } else if (st === "pending") {
      prompts.push({ label: "处置建议", text: `工单${selectedOrder.work_order_id}当前待处理，分析${info}并给出处置步骤` });
      prompts.push({ label: "法规依据", text: `检索${info}事故相关的交通法规和处理标准` });
      prompts.push({ label: "升级条件", text: `工单${selectedOrder.work_order_id}什么情况下需要升级处理？` });
    } else if (st === "processing") {
      prompts.push({ label: "进展评估", text: `评估工单${selectedOrder.work_order_id}的处置进展，是否需要协调资源？` });
      prompts.push({ label: "结案标准", text: `工单${selectedOrder.work_order_id}达到什么条件可以结案？` });
      if (level === "high") {
        prompts.push({ label: "风险追踪", text: `工单${selectedOrder.work_order_id}高风险${info}事故，当前处置措施是否充分？` });
      } else {
        prompts.push({ label: "案例参考", text: `是否有与工单${selectedOrder.work_order_id}类似的${info}处置案例？` });
      }
    } else {
      prompts.push({ label: "工单复盘", text: `复盘工单${selectedOrder.work_order_id}的${info}处置过程，总结经验` });
      prompts.push({ label: "统计概况", text: "查看当前工单整体统计概况" });
      prompts.push({ label: "法规检索", text: `检索${info}相关交通法规` });
    }

    return prompts;
  }, [selectedOrder]);

  useEffect(() => {
    const nextSelectedId = selectedOrder?.work_order_id ?? "";
    if (nextSelectedId !== selectedId) {
      setSelectedId(nextSelectedId);
    }
  }, [selectedId, selectedOrder]);

  const statusCounts = {
    unassigned: orders.filter((order) => order.work_order_status === 0 && order.status === "unassigned").length,
    pending: orders.filter((order) => order.work_order_status === 0 && (order.status === "pending" || order.status === "processing")).length,
    completed: orders.filter((order) => order.work_order_status === 1).length,
    ignored: orders.filter((order) => order.work_order_status === 2).length,
  };
  const activeFilterLabel = WORK_ORDER_FILTERS.find((option) => option.key === filter)?.label ?? "待派发";

  const updateOrder = (id: string, patch: Partial<WorkOrderItem>) => {
    setOrders((previous) => previous.map((order) => order.work_order_id === id ? { ...order, ...patch } : order));
    setDetailOrder((current) => current?.work_order_id === id ? { ...current, ...patch } : current);
    setAssignOrder((current) => current?.work_order_id === id ? { ...current, ...patch } : current);
  };

  const replaceOrder = (order: WorkOrderItem) => {
    setOrders((previous) => previous.map((item) => item.work_order_id === order.work_order_id ? order : item));
    setDetailOrder((current) => current?.work_order_id === order.work_order_id ? order : current);
    setAssignOrder((current) => current?.work_order_id === order.work_order_id ? order : current);
  };

  const refreshStaff = () => {
    if (demoDataEnabled) return;
    fetchStaff()
      .then((staff) => {
        setStaffMembers(staff);
        setStaffLoadError("");
      })
      .catch((error) => {
        setStaffLoadError(error instanceof Error ? error.message : "后端人员数据加载失败");
      });
  };

  const handleAssignOrder = (order: WorkOrderItem, staff: StaffMember) => {
    if (demoDataEnabled) {
      updateOrder(order.work_order_id, { assignee: staff.name, status: "pending" });
      setSelectedId(order.work_order_id);
      setAssignOrder(null);
      return;
    }

    dispatchWorkOrder(order.work_order_id, staff.id)
      .then((updatedOrder) => {
        setLoadError("");
        replaceOrder(updatedOrder);
        setSelectedId(updatedOrder.work_order_id);
        setAssignOrder(null);
        refreshStaff();
      })
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : "派发工单失败");
      });
  };

  const handleConvertReport = (report: MobileReport) => {
    convertMobileReport(report.report_id, convertCategory)
      .then(() => fetchWorkOrders())
      .then((items) => { setOrders(items); setMobileReports((reports) => reports.filter((item) => item.report_id !== report.report_id)); setConvertReport(null); })
      .catch((error) => setLoadError(error instanceof Error ? error.message : "上报转工单失败"));
  };

  const handleRejectReport = (report: MobileReport) => {
    const reason = window.prompt("请输入不通过原因", "现场信息不足，请补充后重新上报。");
    if (!reason?.trim()) return;
    rejectMobileReport(report.report_id, reason.trim())
      .then(() => setMobileReports((items) => items.filter((item) => item.report_id !== report.report_id)))
      .catch((error) => setLoadError(error instanceof Error ? error.message : "上报审核失败"));
  };

  const handleReviewFeedback = (order: WorkOrderItem, decision: "approve" | "reject", message: string) => {
    if (!message.trim()) return;
    reviewWorkOrderFeedback(order.work_order_id, decision, message)
      .then(replaceOrder)
      .catch((error) => setLoadError(error instanceof Error ? error.message : "处置结果审核失败"));
  };

  const handleUpdateOrder = (id: string, patch: Partial<WorkOrderItem>) => {
    if (demoDataEnabled || !patch.status) {
      updateOrder(id, patch);
      return;
    }

    updateWorkOrderStatus(id, {
      status: patch.status,
      process_message: patch.process_message,
      process_image_url: patch.process_images?.[0],
    })
      .then((updatedOrder) => {
        setLoadError("");
        replaceOrder(updatedOrder);
        refreshStaff();
      })
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : "更新工单状态失败");
      });
  };

  const askAgent = async (question: string) => {
    const normalizedQuestion = question.trim();
    if (!normalizedQuestion || isAgentReplying) return;

    const contextMessage = selectedOrder
      ? [
          `当前选中工单：${selectedOrder.work_order_id}`,
          `事故信息：${selectedOrder.accident_info}`,
          `监控地址：${selectedOrder.monitor_address}`,
          `事件等级：${getLevelText(selectedOrder.event_level)}`,
          `工单状态：${statusText(selectedOrder.status)}`,
          `现场描述：${selectedOrder.description}`,
          "",
          `用户问题：${normalizedQuestion}`,
          "以上界面字段仅用于定位当前工单，不视为已核验依据。请先调用对应工单工具核验事实；处理结果、图片和文件信息必须以工具返回的 evidence / file_evidence 字段为依据。",
          "请使用清晰的 Markdown 格式组织最终回复；涉及事实时应包含“结论”“依据”表格、分割线和“未核验项”。",
        ].join("\n")
      : `${normalizedQuestion}\n\n请先通过工具核验事实，并使用清晰的 Markdown 格式组织最终回复；不得编造文件、图片或法规依据。`;

    setMessages((previous) => [...previous, { role: "user", text: normalizedQuestion }]);
    setChatInput("");
    if (chatComposerRef.current) chatComposerRef.current.style.height = "auto";
    setIsAgentReplying(true);

    try {
      const response = await chatWithAgent(contextMessage, agentThreadId ?? undefined);
      setAgentThreadId(response.thread_id);
      setMessages((previous) => [
        ...previous,
        { role: "assistant", text: response.reply.trim() || "Agent 未返回有效内容，请稍后重试。" },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Agent 服务暂时不可用";
      setMessages((previous) => [
        ...previous,
        { role: "assistant", text: `**Agent 请求失败**\n\n${message}\n\n请确认后端 Agent 与大模型配置可用后重试。` },
      ]);
    } finally {
      setIsAgentReplying(false);
    }
  };

  return (
    <section className="dispatch-page">
      <aside className="dispatch-filter-rail">
        <div className="rail-title">
          <span>DISPATCH</span>
          <h1>工单处置中心</h1>
          <div className="bjtu-icons">
            <div className="bjtu-letter bjtu-b">B</div>
            <div className="bjtu-letter bjtu-j">J</div>
            <div className="bjtu-letter bjtu-t">T</div>
            <div className="bjtu-letter bjtu-u">U</div>
          </div>
        </div>
        {WORK_ORDER_FILTERS.map((option) => (
          <button
            key={option.key}
            className={filter === option.key ? "active" : ""}
            onClick={() => { setFilter(option.key); setMiddleView("orders"); }}
          >
            {option.label}工单 <b>{statusCounts[option.key]}</b>
          </button>
        ))}
        <div className="staff-roster">
          <strong>可派发人员</strong>
          {staffMembers.map((staff) => {
            const pendingOrderCount = unresolvedOrdersByAssignee.get(staff.name)?.length ?? 0;
            return (
              <button
                key={staff.id}
                className="staff-item"
                onClick={() => setSelectedStaff(staff)}
              >
                <div className={`staff-avatar ${pendingOrderCount === 0 ? "idle" : "busy"}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="5"/>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  </svg>
                </div>
                <div className="staff-info">
                  <span className="staff-name">{staff.name}</span>
                  <span className="staff-role">{staff.role}</span>
                </div>
                <div className="staff-meta">
                  <span className={`staff-status ${pendingOrderCount === 0 ? "idle" : "busy"}`}>
                    待处理{pendingOrderCount}工单
                  </span>
                </div>
              </button>
            );
          })}
          {!staffLoading && staffLoadError ? <small>人员加载失败：{staffLoadError}</small> : null}
          {!staffLoading && !staffLoadError && staffMembers.length === 0 ? <small>暂无可派发人员</small> : null}
        </div>
      </aside>

      <main className="dispatch-list">
        <div className="dispatch-view-switch" role="group" aria-label="中间展示内容切换">
          <button className={middleView === "orders" ? "active" : ""} aria-pressed={middleView === "orders"} onClick={() => setMiddleView("orders")}>
            未解决工单流
          </button>
          <button className={middleView === "reports" ? "active" : ""} aria-pressed={middleView === "reports"} onClick={() => setMiddleView("reports")}>
            移动端待审核上报 <b>{mobileReports.length}</b>
          </button>
        </div>

        {middleView === "orders" ? (
          <section className="dispatch-work-orders-view">
            <div className="dispatch-list-head">
              <div>
                <span>WORK ORDERS</span>
                <h2>{activeFilterLabel}工单</h2>
              </div>
              <button
                disabled={!selectedOrder || selectedOrder.work_order_status !== 0}
                onClick={() => selectedOrder?.work_order_status === 0 && setAssignOrder(selectedOrder)}
              >
                派发当前工单
              </button>
            </div>
            <div className="dispatch-process-map" aria-label="工单状态筛选">
              {WORK_ORDER_FILTERS.map((option) => (
                <button
                  type="button"
                  key={option.key}
                  className={filter === option.key ? "active" : ""}
                  aria-pressed={filter === option.key}
                  onClick={() => setFilter(option.key)}
                  style={{ borderColor: option.color }}
                >
                  <i style={{ background: option.color }} />
                  <span>{option.label}</span>
                  <b>{statusCounts[option.key]}</b>
                </button>
              ))}
            </div>
            <div className="dispatch-stream">
              {!demoDataEnabled && loading ? (
                <div className="dispatch-empty-state">
                  <b>正在读取后端工单</b>
                  <span>正在加载数据库中的工单、派发人员和处置记录。</span>
                  <small>GET /api/v1/work-orders · GET /api/v1/staff</small>
                </div>
              ) : null}
              {!demoDataEnabled && loadError ? (
                <div className="dispatch-empty-state">
                  <b>{orders.length > 0 ? "工单自动刷新失败" : "后端工单加载失败"}</b>
                  <span>{loadError}</span>
                  <small>{orders.length > 0 ? "已保留最近一次成功加载的工单。" : "请确认 Backend 已启动并且 MySQL 可连接。"}</small>
                </div>
              ) : null}
              {!loading && !loadError && filteredOrders.length === 0 ? (
                <div className="dispatch-empty-state">
                  <b>暂无{activeFilterLabel}工单</b>
                  <span>{demoDataEnabled ? "当前筛选条件下没有 mock 工单。" : "数据库中暂无当前筛选条件下的工单。"}</span>
                  <small>可点击上方状态筛选查看其他工单。</small>
                </div>
              ) : null}
              {filteredOrders.map((order) => (
                <article
                  key={order.work_order_id}
                  className={`dispatch-row ${selectedOrder?.work_order_id === order.work_order_id ? "active" : ""}`}
                  onClick={() => setSelectedId(order.work_order_id)}
                >
                  <div className="row-status-line">
                    <span className={`level-dot ${order.event_level}`} />
                    <b>{order.work_order_id}</b>
                    <em className={`status-chip ${order.status}`}>{statusText(order.status)}</em>
                  </div>
                  <h3>{order.accident_info}</h3>
                  <p>{order.monitor_address}</p>
                  <div className="row-meta">
                    <span>时间 {order.event_time}</span>
                    <span>等级 {getLevelText(order.event_level)}</span>
                    <span>摄像头 {order.camera_name}</span>
                    <span>派发 {order.assignee ?? "未派发"}</span>
                    <span className="category-badge">建议 {categoryName(order.required_category)}</span>
                  </div>
                  <div className="row-actions">
                    {order.status === "unassigned" ? <button onClick={(event) => { event.stopPropagation(); setAssignOrder(order); }}>派发</button> : null}
                    {order.status === "pending" ? <button onClick={(event) => { event.stopPropagation(); handleUpdateOrder(order.work_order_id, { status: "processing" }); }}>开始处置</button> : null}
                    {order.work_order_status === 0 ? <button onClick={(event) => { event.stopPropagation(); setDetailOrder(order); }}>处置详情</button> : null}
                    <button onClick={(event) => { event.stopPropagation(); setDetailOrder(order); }}>查看</button>
                    {order.work_order_status === 0 ? (
                      <button
                        className="ignore-order-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleUpdateOrder(order.work_order_id, {
                            status: "ignored",
                            work_order_status: 2,
                            process_message: "该工单已忽略。",
                          });
                        }}
                      >
                        忽略
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section className="dispatch-report-view">
            <div className="dispatch-list-head"><div><span>ANDROID REPORTS</span><h2>移动端待审核上报</h2></div><b>{mobileReports.length} 条</b></div>
            <div className="dispatch-stream mobile-report-stream">
            {mobileReports.map((report) => <article className="dispatch-row" key={report.report_id}>
              <div className="row-status-line"><span className={`level-dot ${report.severity}`} /><b>上报 #{report.report_id}</b><em className="status-chip pending">待审核</em></div>
              <h3>{report.title}</h3><p>{report.location} · {report.reporter_name}</p><p>{report.detail}</p>
              <div className="row-actions"><button onClick={() => { setConvertCategory("traffic_police"); setConvertReport(report); }}>转为工单</button><button className="ignore-order-button" onClick={() => handleRejectReport(report)}>不通过</button></div>
            </article>)}
              {mobileReports.length === 0 ? (
                <div className="dispatch-empty-state">
                  <b>暂无待审核上报</b>
                  <span>当前没有来自移动端的待审核事件。</span>
                </div>
              ) : null}
            </div>
          </section>
        )}
      </main>

      <aside className="agent-panel">
        <div className="agent-head">
          <span>AI AGENT</span>
          <h2>AI 处置助手</h2>
        </div>
        {selectedOrder ? (
          <div className="agent-context">
            <b>当前工单：{selectedOrder.work_order_id}</b>
            <p>{selectedOrder.accident_info}</p>
            <p>{selectedOrder.ai_suggestion}</p>
          </div>
        ) : null}
        <div className="quick-prompts">
          {quickPrompts.map((item) => (
            <button key={item.label} disabled={isAgentReplying} onClick={() => void askAgent(item.text)}>{item.label}</button>
          ))}
        </div>
        <div ref={agentMessagesRef} className="agent-messages" aria-live="polite">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`agent-message ${message.role}`}>
              <MarkdownMessage content={message.text} />
            </div>
          ))}
          {isAgentReplying ? (
            <div className="agent-message assistant agent-loading" aria-label="Agent 正在生成回复">
              <span /><span /><span />
            </div>
          ) : null}
        </div>
        <form className="agent-input" onSubmit={(event) => { event.preventDefault(); if (chatInput.trim()) void askAgent(chatInput); }}>
          <div className="agent-composer-main">
            <textarea
              ref={chatComposerRef}
              rows={1}
              disabled={isAgentReplying}
              value={chatInput}
              onChange={(event) => {
                setChatInput(event.target.value);
                event.target.style.height = "auto";
                event.target.style.height = `${Math.min(event.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  if (chatInput.trim()) void askAgent(chatInput);
                }
              }}
              placeholder="询问当前工单的处置、派发或风险依据"
              aria-label="向 AI 处置助手提问"
            />
            <button className="agent-send-button" type="submit" aria-label="发送消息" title="发送消息" disabled={isAgentReplying || !chatInput.trim()}>
              {isAgentReplying ? (
                <span className="agent-send-spinner" />
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 19V5M6.5 10.5 12 5l5.5 5.5" />
                </svg>
              )}
            </button>
          </div>
          <div className="agent-composer-hint">
            <span>Agent 已连接当前工单</span>
            <span><kbd>Enter</kbd> 发送 · <kbd>Shift</kbd> + <kbd>Enter</kbd> 换行</span>
          </div>
        </form>
      </aside>

      {assignOrder ? (
        <AssignDialog
          order={assignOrder}
          staffMembers={staffMembers}
          onClose={() => setAssignOrder(null)}
          onConfirm={(staff) => handleAssignOrder(assignOrder, staff)}
        />
      ) : null}

      {detailOrder ? (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onAssign={() => setAssignOrder(detailOrder)}
          onUpdate={(patch) => handleUpdateOrder(detailOrder.work_order_id, patch)}
          onReview={(decision, message) => handleReviewFeedback(detailOrder, decision, message)}
        />
      ) : null}

      {selectedStaff ? (
        <StaffDetailModal
          staff={selectedStaff}
          pendingOrders={unresolvedOrdersByAssignee.get(selectedStaff.name) ?? []}
          onClose={() => setSelectedStaff(null)}
          onSelectOrder={(order) => {
            setSelectedId(order.work_order_id);
            setSelectedStaff(null);
            setDetailOrder(order);
          }}
        />
      ) : null}

      {convertReport ? (
        <div className="surveillance-modal-backdrop" onClick={() => setConvertReport(null)}>
          <div className="assign-dialog category-convert-dialog" onClick={(event) => event.stopPropagation()}>
            <span className="dialog-kicker">ANDROID REPORT #{convertReport.report_id}</span>
            <h2>审核上报并生成工单</h2>
            <p><b>{convertReport.title}</b></p><p>{convertReport.location}</p><p>{convertReport.detail}</p>
            <div className="personnel-category-grid">
              {PERSONNEL_CATEGORIES.map(([code, name, scope]) => <button key={code} className={convertCategory === code ? "active" : ""} onClick={() => setConvertCategory(code)}>
                <b>{name}</b><span>{scope}</span>
              </button>)}
            </div>
            <div className="dialog-actions"><button onClick={() => handleConvertReport(convertReport)}>生成 {categoryName(convertCategory)} 工单</button><button onClick={() => setConvertReport(null)}>取消</button></div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function AssignDialog({
  order,
  staffMembers,
  onClose,
  onConfirm,
}: {
  order: WorkOrderItem;
  staffMembers: StaffMember[];
  onClose: () => void;
  onConfirm: (staff: StaffMember) => void;
}) {
  const matchedStaff = staffMembers;
  const defaultStaff = matchedStaff.find((staff) => staff.status === "idle") ?? matchedStaff[0] ?? null;
  const [staffId, setStaffId] = useState(defaultStaff?.id ?? "");
  const selectedStaff = matchedStaff.find((staff) => staff.id === staffId) ?? null;

  return (
    <div className="surveillance-modal-backdrop" onClick={onClose}>
      <div className="assign-dialog" onClick={(event) => event.stopPropagation()}>
        <h2>派发工单</h2>
        <p>{order.work_order_id} · {order.accident_info}</p>
        <p className="assignment-requirement">建议人员类别：<b>{categoryName(order.required_category)}</b></p>
        <label>
          选择处理人员
          <select value={staffId} onChange={(event) => setStaffId(event.target.value)}>
            {matchedStaff.map((staff) => <option key={staff.id} value={staff.id}>{staff.name} · {staff.role} · {staff.status === "idle" ? "空闲" : "忙碌"}</option>)}
          </select>
        </label>
        {matchedStaff.length === 0 ? <p className="assignment-warning">暂无可用人员</p> : null}
        <div className="dialog-actions">
          <button disabled={!selectedStaff} onClick={() => selectedStaff && onConfirm(selectedStaff)}>确认派发</button>
          <button onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  );
}

function OrderDetailModal({
  order,
  onClose,
  onAssign,
  onUpdate,
  onReview,
}: {
  order: WorkOrderItem;
  onClose: () => void;
  onAssign: () => void;
  onUpdate: (patch: Partial<WorkOrderItem>) => void;
  onReview: (decision: "approve" | "reject", message: string) => void;
}) {
  const terminal = order.work_order_status !== 0;
  const [reviewDecision, setReviewDecision] = useState<"approve" | "reject" | null>(null);
  const [reviewMessage, setReviewMessage] = useState("");

  const openReviewComposer = (decision: "approve" | "reject") => {
    setReviewDecision(decision);
    setReviewMessage("");
  };

  const submitReview = () => {
    if (!reviewDecision || !reviewMessage.trim()) return;
    onReview(reviewDecision, reviewMessage.trim());
    setReviewDecision(null);
    setReviewMessage("");
  };
  return (
    <div className="surveillance-modal-backdrop" onClick={onClose}>
      <div className="order-detail-modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-x" onClick={onClose}>X</button>
        <div className="order-detail-title">
          <div>
            <span>{order.work_order_id}</span>
            <h2>{order.accident_info}</h2>
          </div>
          <em className={`status-chip ${order.status}`}>{statusText(order.status)}</em>
        </div>
        <div className="order-detail-layout">
          <div>
            <img src={order.scene_images[0]} alt="现场图片" />
            <h3>事件描述</h3>
            <p>{order.description}</p>
            <h3>AI 处置建议</h3>
            <p>{order.ai_suggestion}</p>
            <h3>现场信息</h3>
            <p>{order.scene_info}</p>
          </div>
          <div className="detail-kv">
            <span>事件编号</span><b>{order.event_id}</b>
            <span>道路 / 监控地址</span><b>{order.monitor_address}</b>
            <span>事件时间</span><b>{order.event_time}</b>
            <span>事件等级</span><b>{getLevelText(order.event_level)}</b>
            <span>关联摄像头</span><b>{order.camera_name}</b>
            <span>派发人员</span><b>{order.assignee ?? "未派发"}</b>
            <span>当前状态</span><b>{statusText(order.status)}</b>
          </div>
        </div>
        {order.feedback_review_status === "pending" ? (
          <div className={`feedback-review-layout ${reviewDecision ? "has-composer" : ""}`}>
            <div className="process-record feedback-review-panel">
              <h3>手机端处置结果待审核</h3>
              <p>{order.process_message || "手机端未填写处置说明。"}</p>
              <div>{order.process_images?.map((image) => <img key={image} src={image} alt="手机端处置照片" />)}</div>
              <div className="detail-actions">
                <button onClick={() => openReviewComposer("approve")}>审核通过</button>
                <button className="ignore-order-button" onClick={() => openReviewComposer("reject")}>退回处理</button>
              </div>
            </div>
            {reviewDecision ? (
              <div className={`review-reason-card ${reviewDecision}`}>
                <div className="review-reason-head">
                  <div>
                    <span>REVIEW MESSAGE</span>
                    <h3>{reviewDecision === "approve" ? "填写通过理由" : "填写退回理由"}</h3>
                  </div>
                  <button className="review-card-close" onClick={() => setReviewDecision(null)} aria-label="关闭">X</button>
                </div>
                <label htmlFor="feedback-review-message">审核回复</label>
                <textarea
                  id="feedback-review-message"
                  autoFocus
                  value={reviewMessage}
                  onChange={(event) => setReviewMessage(event.target.value)}
                  placeholder={reviewDecision === "approve" ? "请输入审核通过理由，例如：现场处置完整，图片与报告一致。" : "请输入退回原因及需要补充的内容。"}
                />
                <div className="review-reason-actions">
                  <button onClick={() => setReviewDecision(null)}>取消</button>
                  <button disabled={!reviewMessage.trim()} onClick={submitReview}>
                    {reviewDecision === "approve" ? "确认通过" : "确认退回"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        {order.feedback_review_status === "rejected" ? <div className="process-record"><h3>最近一次处置结果已退回</h3><p>{order.feedback_review_message}</p></div> : null}
        {terminal ? (
          <div className="process-record">
            <h3>{order.work_order_status === 2 ? "忽略记录" : "处理记录"}</h3>
            <p>{order.process_message ?? (order.work_order_status === 2 ? "该工单已忽略。" : "暂无处理说明。")}</p>
            <div>{order.process_images?.map((image) => <img key={image} src={image} alt="处理照片" />)}</div>
            <p>归档时间：{order.completed_at} · 处理人员：{order.assignee ?? "未派发"}</p>
          </div>
        ) : (
          <div className="detail-actions">
            <button onClick={onAssign}>派发</button>
            <button onClick={() => onUpdate({ status: "completed", work_order_status: 1, completed_at: new Date().toLocaleString("zh-CN", { hour12: false }), process_message: "现场处置完成，道路恢复观察。", process_images: ["https://placehold.co/640x360/263d32/f4f8ff?text=Completed"] })}>标记已完成</button>
            <button className="ignore-order-button" onClick={() => onUpdate({ status: "ignored", work_order_status: 2, completed_at: new Date().toLocaleString("zh-CN", { hour12: false }), process_message: "该工单已忽略。" })}>忽略工单</button>
          </div>
        )}
      </div>
    </div>
  );
}

function statusText(status: WorkOrderItem["status"]) {
  switch (status) {
    case "unassigned":
      return "待派发";
    case "pending":
      return "待处理";
    case "processing":
      return "待处理";
    case "completed":
      return "已完成";
    case "ignored":
      return "已忽略";
    default:
      return "未知";
  }
}

function StaffDetailModal({
  staff,
  pendingOrders,
  onClose,
  onSelectOrder,
}: {
  staff: StaffMember;
  pendingOrders: WorkOrderItem[];
  onClose: () => void;
  onSelectOrder: (order: WorkOrderItem) => void;
}) {
  return (
    <div className="surveillance-modal-backdrop" onClick={onClose}>
      <div className="staff-detail-modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-x" aria-label="关闭" onClick={onClose}>X</button>
        <div className="staff-workload-header">
          <div>
            <span>{staff.role}</span>
            <h2>{staff.name}的待处理工单</h2>
          </div>
          <strong>{pendingOrders.length}</strong>
        </div>
        <div className="staff-order-list">
          {pendingOrders.map((order) => (
            <button key={order.work_order_id} onClick={() => onSelectOrder(order)}>
              <div className="staff-order-heading">
                <span>{order.work_order_id}</span>
                <em className={`status-chip ${order.status}`}>{statusText(order.status)}</em>
              </div>
              <strong>{order.accident_info}</strong>
              <p>{order.monitor_address}</p>
              <small>{order.event_time}</small>
            </button>
          ))}
          {pendingOrders.length === 0 ? (
            <div className="staff-order-empty">
              <strong>暂无待处理工单</strong>
              <span>当前没有已派发但尚未完成的工单。</span>
            </div>
          ) : null}
        </div>
        <div className="staff-detail-actions">
          <button onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}
