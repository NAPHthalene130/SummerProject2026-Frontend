import { useEffect, useMemo, useState } from "react";
import { convertMobileReport, deleteStaff, dispatchWorkOrder, fetchMobileReports, fetchStaff, fetchWorkOrders, updateWorkOrderStatus, type MobileReport } from "../api/client";
import { useDataMode } from "../context/DataModeContext";
import { mockStaff, type StaffMember } from "../data/mockStaff";
import { mockWorkOrders, type WorkOrderItem } from "../data/mockWorkOrders";
import { getLevelText } from "../utils/riskStyle";

type FilterKey = "unresolved" | "completed" | "ignored" | "all";
const WORK_ORDER_REFRESH_INTERVAL_MS = 5_000;
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

export function WorkOrderPage() {
  const { demoDataEnabled } = useDataMode();
  const [orders, setOrders] = useState<WorkOrderItem[]>(() => demoDataEnabled ? mockWorkOrders : []);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => demoDataEnabled ? mockStaff : []);
  const [filter, setFilter] = useState<FilterKey>("unresolved");
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "system", text: "AI 处置助手已接入。选择左侧工单后，我会结合事件等级、道路状态和处置记录给出建议。" },
  ]);

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
    if (filter === "unresolved") return orders.filter((order) => order.work_order_status === 0);
    if (filter === "completed") return orders.filter((order) => order.work_order_status === 1);
    if (filter === "ignored") return orders.filter((order) => order.work_order_status === 2);
    return orders;
  }, [filter, orders]);
  const selectedOrder = filteredOrders.find((order) => order.work_order_id === selectedId) ?? filteredOrders[0] ?? null;

  useEffect(() => {
    const nextSelectedId = selectedOrder?.work_order_id ?? "";
    if (nextSelectedId !== selectedId) {
      setSelectedId(nextSelectedId);
    }
  }, [selectedId, selectedOrder]);

  const statusCounts = {
    unresolved: orders.filter((order) => order.work_order_status === 0).length,
    completed: orders.filter((order) => order.work_order_status === 1).length,
    ignored: orders.filter((order) => order.work_order_status === 2).length,
    all: orders.length,
  };

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

  const handleDeleteStaff = (staff: StaffMember) => {
    if (!window.confirm(`确定删除“${staff.name}”吗？其未完成工单将恢复为待派发。`)) return;
    deleteStaff(staff.id)
      .then(() => {
        setStaffMembers((items) => items.filter((item) => item.id !== staff.id));
        setSelectedStaff(null);
        return fetchWorkOrders();
      })
      .then(setOrders)
      .catch((error) => setStaffLoadError(error instanceof Error ? error.message : "删除人员失败"));
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

  const askAgent = (question: string) => {
    const reply = getAgentReply(question, selectedOrder);
    setMessages((previous) => [
      ...previous,
      { role: "user", text: question },
      { role: "assistant", text: reply },
    ]);
    setChatInput("");
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
        <button className={filter === "unresolved" ? "active" : ""} onClick={() => setFilter("unresolved")}>
          未解决工单 <b>{statusCounts.unresolved}</b>
        </button>
        <button className={filter === "completed" ? "active" : ""} onClick={() => setFilter("completed")}>
          已解决工单 <b>{statusCounts.completed}</b>
        </button>
        <button className={filter === "ignored" ? "active" : ""} onClick={() => setFilter("ignored")}>
          已忽略工单 <b>{statusCounts.ignored}</b>
        </button>
        <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
          全部工单 <b>{statusCounts.all}</b>
        </button>
        <div className="staff-roster">
          <strong>可派发人员</strong>
          {staffMembers.map((staff) => (
            <button
              key={staff.id}
              className="staff-item"
              onClick={() => setSelectedStaff(staff)}
            >
              <div className={`staff-avatar ${staff.status}`}>
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
                <span className={`staff-status ${staff.status}`}>{staff.status === "idle" ? "空闲" : "忙碌"}</span>
                <span className="staff-distance">{staff.distance_km}km</span>
              </div>
            </button>
          ))}
          {!staffLoading && staffLoadError ? <small>人员加载失败：{staffLoadError}</small> : null}
          {!staffLoading && !staffLoadError && staffMembers.length === 0 ? <small>暂无可派发人员</small> : null}
        </div>
      </aside>

      <main className="dispatch-list">
        <section className="mobile-report-inbox">
          <div className="dispatch-list-head"><div><span>ANDROID REPORTS</span><h2>移动端待审核上报</h2></div><b>{mobileReports.length} 条</b></div>
          {mobileReports.map((report) => <article className="dispatch-row" key={report.report_id}>
            <div className="row-status-line"><span className={`level-dot ${report.severity}`} /><b>上报 #{report.report_id}</b><em className="status-chip pending">待审核</em></div>
            <h3>{report.title}</h3><p>{report.location} · {report.reporter_name}</p><p>{report.detail}</p>
            <div className="row-actions"><button onClick={() => { setConvertCategory("traffic_police"); setConvertReport(report); }}>审核并转为工单</button></div>
          </article>)}
          {mobileReports.length === 0 ? <small>暂无 Android 待审核上报</small> : null}
        </section>
        <div className="dispatch-list-head">
          <div>
            <span>WORK ORDERS</span>
            <h2>{filter === "unresolved" ? "未解决工单流" : filter === "completed" ? "已解决归档" : filter === "ignored" ? "已忽略工单" : "全部工单"}</h2>
          </div>
          <button
            disabled={!selectedOrder || selectedOrder.work_order_status !== 0}
            onClick={() => selectedOrder?.work_order_status === 0 && setAssignOrder(selectedOrder)}
          >
            派发当前工单
          </button>
        </div>
        <div className="dispatch-process-map">
          {[
            ["待派发", orders.filter((order) => order.status === "unassigned").length, "#7f8c8d"],
            ["待处理", orders.filter((order) => order.status === "pending").length, "#FBBC04"],
            ["处理中", orders.filter((order) => order.status === "processing").length, "#4285F4"],
            ["已解决", orders.filter((order) => order.work_order_status === 1).length, "#34A853"],
            ["已忽略", orders.filter((order) => order.work_order_status === 2).length, "#7f8c8d"],
          ].map(([label, count, color]) => (
            <div key={label} style={{ borderColor: String(color) }}>
              <i style={{ background: String(color) }} />
              <span>{label}</span>
              <b>{count}</b>
            </div>
          ))}
        </div>
        <div className="dispatch-stream">
          {!demoDataEnabled && loading ? (
            <div className="dispatch-empty-state">
              <b>正在读取后端工单</b>
              <span>正在加载数据库中的模拟工单、派发人员和处置记录。</span>
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
              <b>暂无匹配工单</b>
              <span>{demoDataEnabled ? "当前筛选条件下没有 mock 工单。" : "数据库中暂无当前筛选条件下的工单。"}</span>
              <small>可切换筛选条件查看全部工单。</small>
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
                <span className="category-badge">要求 {categoryName(order.required_category)}</span>
              </div>
              <div className="row-actions">
                {order.status === "unassigned" ? <button onClick={(event) => { event.stopPropagation(); setAssignOrder(order); }}>派发</button> : null}
                {order.status === "pending" ? <button onClick={(event) => { event.stopPropagation(); handleUpdateOrder(order.work_order_id, { status: "processing" }); }}>标记处理中</button> : null}
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
          {["如何处理该事故？", "建议派发给谁？", "为什么是高风险？", "是否需要升级处置？"].map((question) => (
            <button key={question} onClick={() => askAgent(question)}>{question}</button>
          ))}
        </div>
        <div className="agent-messages">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`agent-message ${message.role}`}>
              {message.text}
            </div>
          ))}
        </div>
        <form className="agent-input" onSubmit={(event) => { event.preventDefault(); if (chatInput.trim()) askAgent(chatInput.trim()); }}>
          <input value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="输入问题，例如：是否需要升级处置？" />
          <button type="submit">发送</button>
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
        />
      ) : null}

      {selectedStaff ? (
        <StaffDetailModal
          staff={selectedStaff}
          onClose={() => setSelectedStaff(null)}
          onDelete={() => handleDeleteStaff(selectedStaff)}
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
  const matchedStaff = staffMembers.filter((staff) => !order.required_category || staff.personnel_category === order.required_category);
  const defaultStaff = matchedStaff.find((staff) => staff.status === "idle") ?? matchedStaff[0] ?? null;
  const [staffId, setStaffId] = useState(defaultStaff?.id ?? "");
  const selectedStaff = matchedStaff.find((staff) => staff.id === staffId) ?? null;

  return (
    <div className="surveillance-modal-backdrop" onClick={onClose}>
      <div className="assign-dialog" onClick={(event) => event.stopPropagation()}>
        <h2>派发工单</h2>
        <p>{order.work_order_id} · {order.accident_info}</p>
        <p className="assignment-requirement">要求人员类别：<b>{categoryName(order.required_category)}</b></p>
        <label>
          选择处理人员
          <select value={staffId} onChange={(event) => setStaffId(event.target.value)}>
            {matchedStaff.map((staff) => <option key={staff.id} value={staff.id}>{staff.name} · {staff.role} · {staff.status === "idle" ? "空闲" : "忙碌"}</option>)}
          </select>
        </label>
        {matchedStaff.length === 0 ? <p className="assignment-warning">当前没有注册为“{categoryName(order.required_category)}”的人员，无法派发。</p> : null}
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
}: {
  order: WorkOrderItem;
  onClose: () => void;
  onAssign: () => void;
  onUpdate: (patch: Partial<WorkOrderItem>) => void;
}) {
  const terminal = order.work_order_status !== 0;
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
            <button onClick={() => onUpdate({ status: "processing" })}>标记处理中</button>
            <button onClick={() => onUpdate({ status: "completed", work_order_status: 1, completed_at: new Date().toLocaleString("zh-CN", { hour12: false }), process_message: "现场处置完成，道路恢复观察。", process_images: ["https://placehold.co/640x360/263d32/f4f8ff?text=Completed"] })}>标记已完成</button>
            <button className="ignore-order-button" onClick={() => onUpdate({ status: "ignored", work_order_status: 2, completed_at: new Date().toLocaleString("zh-CN", { hour12: false }), process_message: "该工单已忽略。" })}>忽略工单</button>
          </div>
        )}
      </div>
    </div>
  );
}

function getAgentReply(question: string, order: WorkOrderItem | null) {
  if (question.includes("派发")) {
    return "根据当前工单位置和事件等级，建议派发给距离最近且状态空闲的道路管理员。高风险事故优先派发应急处置员协同处理。";
  }
  if (question.includes("风险") || question.includes("高风险")) {
    return "风险等级由事件类型、车流密度、平均车速下降幅度、历史事故频次等因素综合判断。当前工单可重点关注车速骤降和排队长度。";
  }
  if (question.includes("升级")) {
    return order?.event_level === "high"
      ? "建议升级处置：该工单为高等级事件，应联动交警、清障车辆和现场巡检人员。"
      : "当前可先由道路管理员处置，若拥堵持续超过 10 分钟或风险分数上升，再升级联动。";
  }
  return "建议优先确认现场人员安全，随后进行临时交通疏导，并根据事故等级决定是否联动交警与清障车辆。";
}

function statusText(status: WorkOrderItem["status"]) {
  switch (status) {
    case "unassigned":
      return "待派发";
    case "pending":
      return "待处理";
    case "processing":
      return "处理中";
    case "completed":
      return "已完成";
    case "ignored":
      return "已忽略";
    default:
      return "未知";
  }
}

function StaffDetailModal({ staff, onClose, onDelete }: { staff: StaffMember; onClose: () => void; onDelete: () => void }) {
  return (
    <div className="surveillance-modal-backdrop" onClick={onClose}>
      <div className="staff-detail-modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-x" onClick={onClose}>X</button>
        <div className="staff-detail-header">
          <div className={`staff-detail-avatar ${staff.status}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="5"/>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            </svg>
          </div>
          <div className="staff-detail-info">
            <h2>{staff.name}</h2>
            <span className="staff-detail-role">{staff.role}</span>
            <span className={`staff-detail-status ${staff.status}`}>
              {staff.status === "idle" ? "空闲" : "忙碌"}
            </span>
          </div>
        </div>
        <div className="staff-detail-body">
          <div className="staff-detail-row">
            <span>人员编号</span>
            <b>{staff.id}</b>
          </div>
          <div className="staff-detail-row">
            <span>当前距离</span>
            <b>{staff.distance_km} km</b>
          </div>
          <div className="staff-detail-row">
            <span>状态说明</span>
            <b>{staff.status === "idle" ? "可立即派发工单" : "正在处理其他任务"}</b>
          </div>
        </div>
        <div className="staff-detail-actions">
          <button className="delete-staff-button" onClick={onDelete}>删除人员</button>
          <button onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}
