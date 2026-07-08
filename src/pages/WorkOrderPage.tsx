import { useEffect, useMemo, useState } from "react";
import { fetchWorkOrders, updateWorkOrderStatus } from "../api/mockFrontendApi";
import type { FrontendWorkOrder } from "../data/mockWorkOrders";

type WorkOrderTab = "unresolved" | "completed" | "all";

export function WorkOrderPage() {
  const [orders, setOrders] = useState<FrontendWorkOrder[]>([]);
  const [activeTab, setActiveTab] = useState<WorkOrderTab>("unresolved");
  const [selectedOrder, setSelectedOrder] = useState<FrontendWorkOrder | null>(null);

  useEffect(() => {
    fetchWorkOrders().then(setOrders);
  }, []);

  const filteredOrders = useMemo(() => {
    if (activeTab === "unresolved") return orders.filter((order) => order.status === "pending" || order.status === "processing");
    if (activeTab === "completed") return orders.filter((order) => order.status === "completed");
    return orders;
  }, [activeTab, orders]);

  const handleAdvance = async (order: FrontendWorkOrder) => {
    const nextStatus = order.status === "pending" ? "processing" : order.status === "processing" ? "completed" : "completed";
    const nextOrders = await updateWorkOrderStatus(order.work_order_id, nextStatus, orders);
    setOrders(nextOrders);
    setSelectedOrder(nextOrders.find((item) => item.work_order_id === order.work_order_id) ?? null);
  };

  return (
    <section className="business-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Work Order Management</p>
          <h1>事件工单管理页面</h1>
          <p>展示未解决、已解决和全部工单；当前数据来自 mockWorkOrders.ts，后续可替换为后端工单 API。</p>
        </div>
      </div>

      <div className="work-tabs">
        <button className={activeTab === "unresolved" ? "active" : ""} onClick={() => setActiveTab("unresolved")}>未解决工单</button>
        <button className={activeTab === "completed" ? "active" : ""} onClick={() => setActiveTab("completed")}>已解决工单</button>
        <button className={activeTab === "all" ? "active" : ""} onClick={() => setActiveTab("all")}>全部工单</button>
      </div>

      <div className="work-order-grid">
        {filteredOrders.map((order) => (
          <button className="work-order-card" key={order.work_order_id} onClick={() => setSelectedOrder(order)}>
            <img src={order.scene_images[0]} alt={`${order.title} 现场图`} />
            <div className="work-order-body">
              <div className="work-order-title">
                <strong>{order.title}</strong>
                <span className={`level-tag ${order.event_level}`}>{order.event_level}</span>
              </div>
              <p>{order.description}</p>
              <dl>
                <div><dt>工单编号</dt><dd>{order.work_order_id}</dd></div>
                <div><dt>监控地址</dt><dd>{order.segment_name}</dd></div>
                <div><dt>事件类型</dt><dd>{order.event_type}</dd></div>
                <div><dt>状态</dt><dd>{statusText(order.status)}</dd></div>
                <div><dt>负责人</dt><dd>{order.assignee}</dd></div>
                <div><dt>创建时间</dt><dd>{order.created_at}</dd></div>
              </dl>
            </div>
          </button>
        ))}
      </div>

      {selectedOrder ? (
        <WorkOrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onAdvance={() => handleAdvance(selectedOrder)}
        />
      ) : null}
    </section>
  );
}

function WorkOrderModal({
  order,
  onClose,
  onAdvance,
}: {
  order: FrontendWorkOrder;
  onClose: () => void;
  onAdvance: () => void;
}) {
  const completed = order.status === "completed";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="work-modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>关闭</button>
        <div className="work-modal-header">
          <h2>{order.title}</h2>
          <span className={`level-tag ${order.event_level}`}>{order.event_level}</span>
        </div>
        <div className="work-modal-grid">
          <div>
            <img className="modal-image" src={order.scene_images[0]} alt="现场图片" />
            <h3>事故描述</h3>
            <p>{order.description}</p>
            <h3>AI 处置建议</h3>
            <p>{order.ai_suggestion}</p>
          </div>
          <div className="modal-detail-list">
            <div><span>工单编号</span><strong>{order.work_order_id}</strong></div>
            <div><span>事件编号</span><strong>{order.event_id}</strong></div>
            <div><span>道路名称</span><strong>{order.segment_name}</strong></div>
            <div><span>事件类型</span><strong>{order.event_type}</strong></div>
            <div><span>事件等级</span><strong>{order.event_level}</strong></div>
            <div><span>当前状态</span><strong>{statusText(order.status)}</strong></div>
            <div><span>负责人</span><strong>{order.assignee}</strong></div>
            <div><span>创建时间</span><strong>{order.created_at}</strong></div>
          </div>
        </div>

        {completed ? (
          <div className="feedback-block">
            <h3>处理结果</h3>
            <p>{order.feedback_message}</p>
            <div className="feedback-grid">
              {order.feedback_images?.map((image) => <img key={image} src={image} alt="处理照片" />)}
            </div>
            <div className="modal-detail-list compact">
              <div><span>完成时间</span><strong>{order.completed_at}</strong></div>
              <div><span>处理人员</span><strong>{order.completed_by ?? order.assignee}</strong></div>
            </div>
          </div>
        ) : (
          <div className="modal-actions">
            <button onClick={onAdvance}>{order.status === "pending" ? "流转为处理中" : "流转为已完成"}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function statusText(status: FrontendWorkOrder["status"]) {
  if (status === "pending") return "待处理";
  if (status === "processing") return "处理中";
  return "已完成";
}
