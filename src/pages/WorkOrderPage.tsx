import { useEffect, useMemo, useState } from "react";
import { useDataMode } from "../context/DataModeContext";
import { mockStaff, type StaffMember } from "../data/mockStaff";
import { mockWorkOrders, type WorkOrderItem } from "../data/mockWorkOrders";
import { getLevelText } from "../utils/riskStyle";

type FilterKey = "unresolved" | "completed" | "all";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  text: string;
}

export function WorkOrderPage() {
  const { demoDataEnabled } = useDataMode();
  const [orders, setOrders] = useState<WorkOrderItem[]>(mockWorkOrders);
  const [filter, setFilter] = useState<FilterKey>("unresolved");
  const [selectedId, setSelectedId] = useState<string>(mockWorkOrders[0]?.work_order_id ?? "");
  const [detailOrder, setDetailOrder] = useState<WorkOrderItem | null>(null);
  const [assignOrder, setAssignOrder] = useState<WorkOrderItem | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "system", text: "AI 处置助手已接入。选择左侧工单后，我会结合事件等级、道路状态和处置记录给出建议。" },
  ]);

  useEffect(() => {
    if (demoDataEnabled) {
      setOrders(mockWorkOrders);
      setSelectedId(mockWorkOrders[0]?.work_order_id ?? "");
      setMessages([
        { role: "system", text: "AI 处置助手已接入。选择工单后，我会结合事件等级、道路状态和处置记录给出建议。" },
      ]);
      return;
    }
    setOrders([]);
    setSelectedId("");
    setDetailOrder(null);
    setAssignOrder(null);
    setMessages([
      { role: "system", text: "生产数据源模式：前端 mock 工单与派发人员已清空，等待后端工单接口和智能体服务接入。" },
    ]);
  }, [demoDataEnabled]);

  const selectedOrder = orders.find((order) => order.work_order_id === selectedId) ?? orders[0] ?? null;
  const filteredOrders = useMemo(() => {
    if (filter === "unresolved") return orders.filter((order) => ["unassigned", "pending", "processing"].includes(order.status));
    if (filter === "completed") return orders.filter((order) => ["completed", "false_alarm"].includes(order.status));
    return orders;
  }, [filter, orders]);

  const statusCounts = {
    unresolved: orders.filter((order) => ["unassigned", "pending", "processing"].includes(order.status)).length,
    completed: orders.filter((order) => ["completed", "false_alarm"].includes(order.status)).length,
    all: orders.length,
  };

  const updateOrder = (id: string, patch: Partial<WorkOrderItem>) => {
    setOrders((previous) => previous.map((order) => order.work_order_id === id ? { ...order, ...patch } : order));
    setDetailOrder((current) => current?.work_order_id === id ? { ...current, ...patch } : current);
    setAssignOrder((current) => current?.work_order_id === id ? { ...current, ...patch } : current);
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
        <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
          全部工单 <b>{statusCounts.all}</b>
        </button>
        <div className="staff-roster">
          <strong>可派发人员</strong>
          {(demoDataEnabled ? mockStaff : []).map((staff) => (
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
          {!demoDataEnabled ? <small>等待后端 GET /api/v1/staff 返回人员列表</small> : null}
        </div>
      </aside>

      <main className="dispatch-list">
        <div className="dispatch-list-head">
          <div>
            <span>WORK ORDERS</span>
            <h2>{filter === "unresolved" ? "未解决工单流" : filter === "completed" ? "已解决归档" : "全部工单"}</h2>
          </div>
          <button onClick={() => selectedOrder && setAssignOrder(selectedOrder)}>派发当前工单</button>
        </div>
        <div className="dispatch-process-map">
          {[
            ["待派发", orders.filter((order) => order.status === "unassigned").length, "#7f8c8d"],
            ["待处理", orders.filter((order) => order.status === "pending").length, "#FBBC04"],
            ["处理中", orders.filter((order) => order.status === "processing").length, "#4285F4"],
            ["已归档", orders.filter((order) => order.status === "completed" || order.status === "false_alarm").length, "#34A853"],
          ].map(([label, count, color]) => (
            <div key={label} style={{ borderColor: String(color) }}>
              <i style={{ background: String(color) }} />
              <span>{label}</span>
              <b>{count}</b>
            </div>
          ))}
        </div>
        <div className="dispatch-stream">
          {!demoDataEnabled ? (
            <div className="dispatch-empty-state">
              <b>工单中心已切换为生产数据源</b>
              <span>前端 mock 工单、事件和派发人员已清空，等待后端 REST API 返回真实数据。</span>
              <small>预留接口：GET /api/v1/work-orders、GET /api/v1/staff、PUT /api/v1/work-orders/{'{order_id}'}/dispatch</small>
            </div>
          ) : null}
          {filteredOrders.map((order) => (
            <article
              key={order.work_order_id}
              className={`dispatch-row ${selectedId === order.work_order_id ? "active" : ""}`}
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
              </div>
              <div className="row-actions">
                {order.status === "unassigned" ? <button onClick={(event) => { event.stopPropagation(); setAssignOrder(order); }}>派发</button> : null}
                {order.status === "pending" ? <button onClick={(event) => { event.stopPropagation(); updateOrder(order.work_order_id, { status: "processing" }); }}>标记处理中</button> : null}
                {order.status !== "completed" && order.status !== "false_alarm" ? <button onClick={(event) => { event.stopPropagation(); setDetailOrder(order); }}>处置详情</button> : null}
                <button onClick={(event) => { event.stopPropagation(); setDetailOrder(order); }}>查看</button>
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
          onClose={() => setAssignOrder(null)}
          onConfirm={(name) => {
            updateOrder(assignOrder.work_order_id, { assignee: name, status: "pending" });
            setSelectedId(assignOrder.work_order_id);
            setAssignOrder(null);
          }}
        />
      ) : null}

      {detailOrder ? (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onAssign={() => setAssignOrder(detailOrder)}
          onUpdate={(patch) => updateOrder(detailOrder.work_order_id, patch)}
        />
      ) : null}

      {selectedStaff ? (
        <StaffDetailModal
          staff={selectedStaff}
          onClose={() => setSelectedStaff(null)}
        />
      ) : null}
    </section>
  );
}

function AssignDialog({ order, onClose, onConfirm }: { order: WorkOrderItem; onClose: () => void; onConfirm: (name: string) => void }) {
  const [staffName, setStaffName] = useState(mockStaff.find((staff) => staff.status === "idle")?.name ?? mockStaff[0].name);
  return (
    <div className="surveillance-modal-backdrop" onClick={onClose}>
      <div className="assign-dialog" onClick={(event) => event.stopPropagation()}>
        <h2>派发工单</h2>
        <p>{order.work_order_id} · {order.accident_info}</p>
        <label>
          选择处理人员
          <select value={staffName} onChange={(event) => setStaffName(event.target.value)}>
            {mockStaff.map((staff) => <option key={staff.id} value={staff.name}>{staff.name} · {staff.role} · {staff.status === "idle" ? "空闲" : "忙碌"}</option>)}
          </select>
        </label>
        <div className="dialog-actions">
          <button onClick={() => onConfirm(staffName)}>确认派发</button>
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
  const solved = order.status === "completed" || order.status === "false_alarm";
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
        {solved ? (
          <div className="process-record">
            <h3>处理记录</h3>
            <p>{order.process_message}</p>
            <div>{order.process_images?.map((image) => <img key={image} src={image} alt="处理照片" />)}</div>
            <p>完成时间：{order.completed_at} · 处理人员：{order.assignee}</p>
          </div>
        ) : (
          <div className="detail-actions">
            <button onClick={onAssign}>派发</button>
            <button onClick={() => onUpdate({ status: "processing" })}>标记处理中</button>
            <button onClick={() => onUpdate({ status: "completed", completed_at: new Date().toLocaleString("zh-CN", { hour12: false }), process_message: "现场处置完成，道路恢复观察。", process_images: ["https://placehold.co/640x360/263d32/f4f8ff?text=Completed"] })}>标记已完成</button>
            <button onClick={() => onUpdate({ status: "false_alarm", completed_at: new Date().toLocaleString("zh-CN", { hour12: false }), process_message: "人工复核为误报，已关闭。", process_images: ["https://placehold.co/640x360/343434/f4f8ff?text=False+Alarm"] })}>标记误报</button>
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
    case "false_alarm":
      return "误报关闭";
    default:
      return "未知";
  }
}

function StaffDetailModal({ staff, onClose }: { staff: StaffMember; onClose: () => void }) {
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
          <button onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}
