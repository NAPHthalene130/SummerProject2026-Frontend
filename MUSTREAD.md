# MUSTREAD - 智慧路政巡检分析系统前端交接文档

本文档用于说明当前前端 Demo 已经完成了什么、现在能做什么、后续后端需要提供什么接口协议，以及哪些文件是联调时必须先看的。

当前项目是 **React + Vite + TypeScript** 前端原型。它不连接真实后端、不连接数据库、不接真实 WebRTC 视频流、不训练模型。所有数据目前均来自前端 mock，但代码结构已经按后续接入 FastAPI REST API、WebSocket 实时推送和 WebRTC 视频流预留。

## 1. 当前已完成内容

### 1.1 顶部导航

入口文件：

```text
src/App.tsx
```

当前顶部导航包含：

```text
首页
监控页
工单页
方案评测台
```

默认进入首页。当前没有引入 React Router，使用本地状态切换页面：

```ts
type ActivePage = "home" | "monitor" | "workOrder" | "evaluation";
```

后续如果接正式系统，可以改为 React Router 或后端路由。

### 1.2 首页 - 道路地图 / 热力图

页面文件：

```text
src/pages/HomePage.tsx
```

首页使用：

```text
Leaflet + OSM + GeoJSON
```

已实现能力：

- 展示科技园区标准路网
- 展示道路颜色
- 展示摄像头点位
- 展示异常事件点位
- 支持地图道路点击
- 右侧显示路段详情
- 支持场景播放控制
- 支持两种地图模式

地图模式：

```text
事故风险模式
车流密度模式
```

事故风险模式颜色：

```text
normal -> 绿色
busy   -> 黄色
risk   -> 橙色
danger -> 红色
```

车流密度模式颜色：

```text
0 - 30  -> 绿色
31 - 60 -> 黄色
61 - 90 -> 橙色
90+     -> 红色
```

右侧面板展示：

- 当前模式
- 路段总数
- 高风险路段数
- 平均车速
- 当前事件数
- 摄像头数
- 选中路段详情
- 路段列表

### 1.3 监控页 - 多路视频监控

页面文件：

```text
src/pages/MonitorPage.tsx
```

当前不接真实 WebRTC，使用视频占位卡片：

```text
WebRTC Video Placeholder
```

已实现能力：

- 展示多个摄像头视频卡片
- 每个卡片绑定标准路网中的摄像头和路段
- 卡片边框颜色根据摄像头/路段状态计算
- 显示摄像头名称、camera_id、所属道路
- 显示车流量、平均车速、风险等级
- 右侧展示监控统计报表
- 点击视频卡片弹出放大悬浮窗
- 高风险摄像头弹窗显示红色警示标签

边框颜色规则：

```text
摄像头 offline -> 灰色
路段 danger    -> 红色
路段 risk      -> 橙色
否则按 traffic_flow 映射颜色
```

右侧报表展示：

- 在线摄像头数
- 离线摄像头数
- 当前高风险监控数
- 平均车流量
- 平均车速
- 风险等级分布
- 最近异常事件

### 1.4 工单页 - 事件工单管理

页面文件：

```text
src/pages/WorkOrderPage.tsx
```

mock 数据文件：

```text
src/data/mockWorkOrders.ts
```

已实现能力：

- 未解决工单
- 已解决工单
- 全部工单
- 工单卡片列表
- 事件等级颜色标签
- 现场图片缩略图
- 点击工单弹出详情悬浮窗
- 未解决工单可模拟状态流转
- 已解决工单展示处理留言、处理照片、完成时间、处理人员

工单状态：

```text
pending    -> 待处理
processing -> 处理中
completed  -> 已完成
```

未解决工单包括：

```text
pending
processing
```

已解决工单包括：

```text
completed
```

### 1.5 方案评测台

页面文件：

```text
src/pages/EvaluationPage.tsx
```

这是之前完成的 GIS 可视化方案评测台，已经保留。

包含方案：

- Leaflet + OSM + GeoJSON
- MapLibre GL + GeoJSON
- SVG 自绘道路拓扑图
- Canvas 自绘道路拓扑图
- 纯前端模拟大屏道路热力图
- 接口驱动 GeoJSON 渲染 Demo

评测台能力：

- 使用同一套标准路网
- 使用同一套固定交通事件脚本
- 使用同一套颜色规则
- 展示量化评估指标
- 展示可编辑评分表
- 展示可视化质量检查

## 2. 当前核心数据来源

### 2.1 标准路网

文件：

```text
src/data/standardRoadNetwork.ts
```

包含三类数据：

```ts
RoadNode[]
RoadSegment[]
CameraPoint[]
```

#### RoadNode

```ts
export interface RoadNode {
  node_id: string;
  name: string;
  lng: number;
  lat: number;
  x: number;
  y: number;
  type: "intersection" | "entrance" | "camera_point" | "normal";
}
```

说明：

- `lng/lat` 用于 Leaflet / MapLibre 地图
- `x/y` 用于 SVG / Canvas / 大屏抽象拓扑
- 所有方案共用同一套节点

#### RoadSegment

```ts
export interface RoadSegment {
  segment_id: string;
  name: string;
  from_node: string;
  to_node: string;
  road_type: "main" | "secondary" | "branch";
  length_m: number;
  lane_count: number;
  speed_limit: number;
  camera_ids: string[];
  base_risk: number;
  status: "normal" | "busy" | "risk" | "danger";
  traffic_flow: number;
  avg_speed: number;
  risk_score: number;
}
```

#### CameraPoint

```ts
export interface CameraPoint {
  camera_id: string;
  name: string;
  segment_id: string;
  lng: number;
  lat: number;
  x: number;
  y: number;
  status: "online" | "offline";
}
```

### 2.2 固定交通事件脚本

文件：

```text
src/data/scenarioTimeline.ts
```

当前场景：

```text
T0  00s：所有道路正常，科技大道车流略高
T1  05s：学院路车流升高，状态变为 busy
T2  10s：科技大道核心路口平均车速下降，状态变为 risk
T3  15s：高新一路发生疑似追尾事故，状态变为 danger，生成异常事件和工单
T4  20s：事故持续，周边两条道路变为 busy
T5  25s：道路管理员接单，工单状态变为 processing
T6  30s：事故处理完成，高新一路状态从 danger 降为 risk
T7  35s：道路逐步恢复，工单状态变为 completed
```

播放控制 Hook：

```text
src/hooks/useScenarioPlayback.ts
```

该 Hook 当前用于首页和评测台，也可继续给监控页/工单页提供统一实时状态。

### 2.3 工单 mock 数据

文件：

```text
src/data/mockWorkOrders.ts
```

数据结构：

```ts
export interface FrontendWorkOrder {
  work_order_id: string;
  event_id: string;
  title: string;
  segment_id: string;
  segment_name: string;
  camera_id: string;
  event_type: "congestion" | "accident" | "violation" | "construction";
  event_level: "low" | "medium" | "high";
  status: "pending" | "processing" | "completed";
  priority: "low" | "medium" | "high";
  description: string;
  ai_suggestion: string;
  scene_images: string[];
  feedback_message?: string;
  feedback_images?: string[];
  assignee: string;
  created_at: string;
  completed_at?: string;
  completed_by?: string;
}
```

当前包含：

```text
3 条未解决工单
2 条已解决工单
```

## 3. 已有工具函数

### 3.1 路网转 GeoJSON

文件：

```text
src/utils/roadNetworkToGeoJSON.ts
```

函数：

```ts
roadNetworkToGeoJSON(nodes, segments)
```

用于将标准路网转换为 Leaflet / MapLibre 可渲染的 GeoJSON FeatureCollection。

Feature properties 包含：

```ts
{
  segment_id,
  name,
  road_type,
  length_m,
  lane_count,
  speed_limit,
  traffic_flow,
  avg_speed,
  risk_score,
  status,
  camera_ids
}
```

### 3.2 风险样式

文件：

```text
src/utils/riskStyle.ts
```

关键函数：

```ts
getRoadColor(status: string): string
getRiskColor(status: RoadStatus): string
getTrafficFlowColor(flow: number): string
getRiskText(status: string): string
getRoadWidth(roadType): number
getRoadOpacity(status): number
getRoadTypeText(roadType): string
```

## 4. 前端 mock API 层

文件：

```text
src/api/mockFrontendApi.ts
```

当前函数：

```ts
fetchHomeRoadData()
fetchCameraList()
fetchMonitorStats()
fetchWorkOrders()
updateWorkOrderStatus(work_order_id, status, workOrders)
```

这些函数目前返回 mock 数据。后续正式联调时，建议优先从这里替换为真实 API 调用，不要在页面组件中直接写 `fetch`。

## 5. 后端接口协议建议

以下接口是前端建议的后端协议。后端可以按 FastAPI 实现，也可以根据实际工程调整，但字段名建议尽量保持一致，减少前端改动。

### 5.1 获取路网路段

```http
GET /api/v1/segments
```

用途：

- 首页地图渲染道路
- 监控页关联摄像头和道路状态
- 方案评测台接口驱动方案

响应示例：

```json
{
  "nodes": [
    {
      "node_id": "n_c1",
      "name": "科技大道核心路口",
      "lng": 116.396,
      "lat": 39.912,
      "x": 380,
      "y": 120,
      "type": "intersection"
    }
  ],
  "segments": [
    {
      "segment_id": "seg_gaoxin_1",
      "name": "高新一路事故高发段",
      "from_node": "n_c2",
      "to_node": "n_e1",
      "road_type": "main",
      "length_m": 920,
      "lane_count": 4,
      "speed_limit": 50,
      "camera_ids": ["cam_006"],
      "base_risk": 0.52,
      "status": "danger",
      "traffic_flow": 112,
      "avg_speed": 7,
      "risk_score": 0.96
    }
  ]
}
```

### 5.2 获取摄像头列表

```http
GET /api/v1/cameras
```

用途：

- 首页显示摄像头点位
- 监控页生成视频卡片
- 根据 `segment_id` 关联道路状态

响应示例：

```json
{
  "cameras": [
    {
      "camera_id": "cam_006",
      "name": "高新一路事故高发点",
      "segment_id": "seg_gaoxin_1",
      "lng": 116.401,
      "lat": 39.909,
      "x": 530,
      "y": 180,
      "status": "online",
      "webrtc_url": "webrtc://example/cam_006"
    }
  ]
}
```

说明：

- 当前前端没有使用 `webrtc_url`，但后续真实 WebRTC 接入建议提供该字段。
- 摄像头离线时 `status` 为 `offline`。

### 5.3 获取实时交通状态快照

```http
GET /api/v1/traffic/live
```

用途：

- 首页道路颜色更新
- 监控页边框颜色和统计更新
- 右侧路段信息更新

响应示例：

```json
{
  "timestamp": "2026-07-08T09:30:00+08:00",
  "segments": [
    {
      "segment_id": "seg_gaoxin_1",
      "status": "danger",
      "traffic_flow": 112,
      "avg_speed": 7,
      "risk_score": 0.96
    }
  ]
}
```

### 5.4 WebSocket 实时交通推送

```text
WebSocket /ws/v1/traffic/live
```

用途：

- 替代轮询
- 实时推送道路状态、事件、工单变化

建议消息格式：

```json
{
  "type": "traffic_update",
  "timestamp": "2026-07-08T09:30:05+08:00",
  "segments": [
    {
      "segment_id": "seg_gaoxin_1",
      "status": "danger",
      "traffic_flow": 118,
      "avg_speed": 6,
      "risk_score": 0.98
    }
  ],
  "events": [
    {
      "event_id": "evt_001",
      "segment_id": "seg_gaoxin_1",
      "segment_name": "高新一路事故高发段",
      "event_type": "accident",
      "severity": "high",
      "description": "系统检测到疑似追尾事故。",
      "detected_by": "YOLO",
      "timestamp_sec": 15
    }
  ],
  "work_orders": [
    {
      "work_order_id": "wo_001",
      "event_id": "evt_001",
      "title": "高新一路事故高发段异常事件处置工单",
      "status": "pending",
      "priority": "high",
      "assignee": "待派发",
      "created_at": "2026-07-08 09:30:05"
    }
  ]
}
```

可选消息类型：

```text
traffic_update      道路状态更新
event_created       新异常事件
work_order_created  新工单
work_order_updated  工单状态更新
camera_status       摄像头在线状态更新
```

### 5.5 获取异常事件

```http
GET /api/v1/events
```

查询参数建议：

```text
segment_id 可选
camera_id  可选
severity   可选
status     可选
limit      可选
```

响应示例：

```json
{
  "events": [
    {
      "event_id": "evt_front_001",
      "segment_id": "seg_gaoxin_1",
      "segment_name": "高新一路事故高发段",
      "event_type": "accident",
      "severity": "high",
      "description": "高新一路检测到疑似追尾事故。",
      "detected_by": "YOLO",
      "timestamp_sec": 15,
      "created_at": "2026-07-08 09:15:00",
      "camera_id": "cam_006",
      "scene_images": [
        "https://example.com/images/scene_001.jpg"
      ]
    }
  ]
}
```

### 5.6 获取工单列表

```http
GET /api/v1/work-orders
```

查询参数建议：

```text
status=pending|processing|completed
event_level=low|medium|high
segment_id=xxx
page=1
page_size=20
```

响应示例：

```json
{
  "items": [
    {
      "work_order_id": "wo_front_001",
      "event_id": "evt_front_001",
      "title": "高新一路疑似追尾事故处置",
      "segment_id": "seg_gaoxin_1",
      "segment_name": "高新一路事故高发段",
      "camera_id": "cam_006",
      "event_type": "accident",
      "event_level": "high",
      "status": "pending",
      "priority": "high",
      "description": "AI 检测到车辆异常停滞，疑似追尾事故。",
      "ai_suggestion": "建议派发巡检人员到场核查，并同步交管处置。",
      "scene_images": [
        "https://example.com/images/scene_001.jpg"
      ],
      "feedback_message": null,
      "feedback_images": [],
      "assignee": "待派发",
      "created_at": "2026-07-08 09:15:00",
      "completed_at": null,
      "completed_by": null
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20
}
```

### 5.7 更新工单状态 / 提交反馈

```http
PUT /api/v1/work-orders/{order_id}/feedback
```

用途：

- 待处理 -> 处理中
- 处理中 -> 已完成
- 提交处理留言和处理照片

请求示例：

```json
{
  "status": "completed",
  "assignee": "路政巡检一组",
  "feedback_message": "已完成现场处置，交通状态恢复。",
  "feedback_images": [
    "https://example.com/images/feedback_001.jpg"
  ],
  "completed_by": "张巡检"
}
```

响应示例：

```json
{
  "work_order_id": "wo_front_001",
  "event_id": "evt_front_001",
  "status": "completed",
  "assignee": "路政巡检一组",
  "feedback_message": "已完成现场处置，交通状态恢复。",
  "feedback_images": [
    "https://example.com/images/feedback_001.jpg"
  ],
  "completed_at": "2026-07-08 09:45:00",
  "completed_by": "张巡检"
}
```

### 5.8 WebRTC 视频接入建议

当前监控页没有真实播放视频，只显示：

```text
WebRTC Video Placeholder
```

后端/媒体服务后续建议提供：

```http
GET /api/v1/cameras
```

并在摄像头对象里附带：

```json
{
  "camera_id": "cam_006",
  "webrtc_url": "webrtc://example/cam_006",
  "signaling_url": "wss://example.com/ws/v1/webrtc/cam_006",
  "status": "online"
}
```

如果采用 WebRTC 信令服务，建议新增：

```text
WebSocket /ws/v1/webrtc/{camera_id}
```

前端后续替换点：

```text
src/pages/MonitorPage.tsx
```

将 `.video-placeholder` 和 `.large-video-placeholder` 替换为真实 WebRTC Player 组件即可。

## 6. 前后端字段约定

### 6.1 道路状态枚举

```ts
type RoadStatus = "normal" | "busy" | "risk" | "danger";
```

含义：

```text
normal 通行正常
busy   车流较大
risk   高风险
danger 事故/严重异常
```

### 6.2 道路类型枚举

```ts
type RoadType = "main" | "secondary" | "branch";
```

含义：

```text
main      主干路
secondary 次干路
branch    支路
```

### 6.3 事件类型枚举

```ts
type EventType = "congestion" | "accident" | "violation" | "construction";
```

含义：

```text
congestion   拥堵
accident     事故
violation    违规/违停/异常行为
construction 施工
```

### 6.4 事件等级 / 优先级

```ts
type Level = "low" | "medium" | "high";
```

前端颜色：

```text
low    绿色
medium 黄色
high   红色
```

### 6.5 工单状态

```ts
type WorkOrderStatus = "pending" | "processing" | "completed";
```

状态流转：

```text
pending -> processing -> completed
```

## 7. 后端联调时优先替换哪些文件

第一优先级：

```text
src/api/mockFrontendApi.ts
```

把 mock 函数替换为真实 REST API / WebSocket 客户端。

第二优先级：

```text
src/pages/HomePage.tsx
src/pages/MonitorPage.tsx
src/pages/WorkOrderPage.tsx
```

如果接口字段有变化，主要改这三个页面的数据适配逻辑。

第三优先级：

```text
src/utils/roadNetworkToGeoJSON.ts
src/utils/riskStyle.ts
```

如果后端返回 GeoJSON，可减少或绕过 `roadNetworkToGeoJSON()`。

## 8. 当前仍是 mock 的内容

当前仍未实现真实能力：

- 真实后端 API
- 真实数据库
- 真实 WebSocket 推送
- 真实 WebRTC 视频流
- 登录/鉴权
- 文件上传
- 真实 YOLO / 多模态模型推理
- 真实图片存储

当前 mock 能力足够用于：

- 前端页面演示
- 课堂答辩
- 与后端讨论字段协议
- 评估地图/监控/工单三个核心业务页面是否完整
- 后续将 mock API 替换为真实 API

## 9. 启动和验证

安装依赖：

```bash
npm install
```

开发启动：

```bash
npm run dev
```

生产构建：

```bash
npm run build
```

默认页面：

```text
首页
```

顶部导航可进入：

```text
首页
监控页
工单页
方案评测台
```

## 10. 给后端同学的最短阅读路径

如果后端同学时间很紧，请按这个顺序看：

1. `src/data/standardRoadNetwork.ts` - 看清楚道路、节点、摄像头字段
2. `src/data/mockWorkOrders.ts` - 看清楚工单字段
3. `src/api/mockFrontendApi.ts` - 看清楚前端希望替换的 API 函数
4. 本文档第 5 节 - 看 REST / WebSocket / WebRTC 协议建议
5. `src/pages/HomePage.tsx`、`src/pages/MonitorPage.tsx`、`src/pages/WorkOrderPage.tsx` - 看实际页面如何消费数据

## 11. 当前推荐联调路线

建议按以下顺序和后端联调：

1. 先实现 `GET /api/v1/segments` 和 `GET /api/v1/cameras`
2. 再实现 `GET /api/v1/work-orders`
3. 再实现 `PUT /api/v1/work-orders/{order_id}/feedback`
4. 然后接 `GET /api/v1/traffic/live`
5. 最后升级为 `WebSocket /ws/v1/traffic/live`
6. WebRTC 视频流最后接入，先保持占位卡片不影响主流程演示

这样可以先打通首页地图和工单闭环，再逐步增强实时性和视频能力。
