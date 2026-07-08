# 智慧路政巡检分析系统 - 前端原型 Demo

当前版本是小学期项目“智慧路政巡检分析系统”的前端原型 Demo，不连接真实后端、不连接真实数据库、不接真实 WebRTC 视频流、不训练模型。道路、摄像头、视频、异常事件、工单和统计数据均由前端 mock 数据模拟。

项目保留了之前完成的 **GIS 可视化方案评测台**，并新增正式业务页面：

- 首页：道路地图 / 热力图页面
- 监控页：多路视频监控页面
- 工单页：事件工单管理页面
- 方案评测台：Leaflet / MapLibre / SVG / Canvas / 大屏 / 接口驱动方案对比

## 如何启动

```bash
npm install
npm run dev
```

打包验证：

```bash
npm run build
```

默认进入首页。顶部导航栏可切换：

```text
首页
监控页
工单页
方案评测台
```

## 首页功能说明

首页文件：

```text
src/pages/HomePage.tsx
```

首页采用 Leaflet + OSM + GeoJSON，复用标准路网：

```text
src/data/standardRoadNetwork.ts
src/data/scenarioTimeline.ts
src/utils/roadNetworkToGeoJSON.ts
src/utils/riskStyle.ts
```

首页包括：

- 左侧地图，展示道路、道路颜色、摄像头点位、异常事件点位
- 右侧路段信息数据面板
- 事故风险模式 / 车流密度模式切换
- 图例
- 场景播放控制器：播放、暂停、重置、上一步、下一步、跳转
- 点击道路后显示道路详情

事故风险模式按 `status` / `risk_score` 表达：

- normal：绿色
- busy：黄色
- risk：橙色
- danger：红色

车流密度模式按 `traffic_flow` 表达：

- 0-30：绿色
- 31-60：黄色
- 61-90：橙色
- 90+：红色

## 监控页功能说明

监控页文件：

```text
src/pages/MonitorPage.tsx
```

当前版本不接真实 WebRTC，使用 `WebRTC Video Placeholder` 模拟视频流。每个视频卡片关联标准路网中的摄像头和道路 segment。

监控页包括：

- 左侧视频监控网格，展示至少 5 个摄像头
- 摄像头名称、camera_id、所属道路、车流量、平均车速、风险等级
- 视频卡片颜色边框表示监控状态
- 右侧数据报表预留区
- 在线摄像头数、离线摄像头数、高风险监控数、平均车流量、平均车速、风险等级分布、最近异常事件
- 点击视频卡片后弹出放大悬浮窗
- 高风险摄像头在弹窗中显示红色警示标签

后续可以将占位区域替换为真实 WebRTC 播放组件。

## 工单页功能说明

工单页文件：

```text
src/pages/WorkOrderPage.tsx
```

工单 mock 数据文件：

```text
src/data/mockWorkOrders.ts
```

工单页包括：

- 未解决工单
- 已解决工单
- 全部工单
- 工单卡片
- 事件等级颜色标签
- 现场图片缩略图
- 点击工单弹出详情悬浮窗
- 未解决工单支持状态流转：待处理 -> 处理中 -> 已完成
- 已解决工单详情额外展示处理留言、处理照片、完成时间、处理人员

当前 mock 数据包含 3 条未解决工单和 2 条已解决工单，均关联标准路网中的道路 segment 和事件。

## 方案评测台说明

方案评测台文件：

```text
src/pages/EvaluationPage.tsx
```

评测台继续保留：

- 标准科技园区路网
- 固定交通事件脚本
- Leaflet / MapLibre / SVG / Canvas / 大屏热力图 / 接口驱动方案对比
- 量化评估面板
- 可编辑评分表
- 可视化质量检查

## Mock API 预留

前端 mock API 文件：

```text
src/api/mockFrontendApi.ts
```

当前封装函数：

```text
fetchHomeRoadData()
fetchCameraList()
fetchMonitorStats()
fetchWorkOrders()
updateWorkOrderStatus(work_order_id, status)
```

后续可替换为真实接口：

- `GET /api/v1/segments`
- `GET /api/v1/cameras`
- `GET /api/v1/traffic/live`
- `GET /api/v1/work-orders`
- `PUT /api/v1/work-orders/{order_id}/feedback`
- `WebSocket /ws/v1/traffic/live`

## 后续接入后端建议

首页道路数据可从 FastAPI REST 接口加载，实时状态通过 WebSocket 推送更新 GeoJSON properties。

监控页可将 WebRTC Placeholder 替换为真实 WebRTC 播放组件，摄像头状态和风险等级仍由交通状态接口驱动。

工单页可将 `mockWorkOrders.ts` 替换为后端工单 API，状态流转通过 `PUT /api/v1/work-orders/{order_id}/feedback` 提交。

YOLO、多模态模型或规则引擎输出建议先由后端统一归一化为事件、风险等级和工单建议，再推送给前端。

## 初步推荐

正式小学期版本建议：

- 首页地图优先使用 Leaflet + GeoJSON，保证开发速度和稳定展示
- 若后续更重视真实 GIS 效果和扩展能力，可升级为 MapLibre GL
- 监控页先用 WebRTC 占位卡片完成交互闭环，再接真实视频
- 工单页先打通状态流转和详情展示，再对接真实工单后端
