# 智慧路政巡检分析系统 - 前端原型

当前版本是小学期项目“智慧路政巡检分析系统”的前端 Demo。项目仍然不接真实后端、不接数据库、不接真实 WebRTC 视频流、不训练模型；道路、摄像头、事件、工单和监控画面均由前端 mock 数据模拟。

本次重构重点是去除“模板卡片堆砌感”，把正式业务页面改成更接近真实智慧交通 / 路政监控平台的产品形态。

## 参考的开源项目

调研文档：

```text
docs/frontend_reference_research.md
```

设计思想参考：

- `traccar/traccar-web`：地图为主体，控件悬浮，点击对象后显示详情。
- `openremote/openremote`：道路作为 asset，摄像头作为 device，车流和车速作为 telemetry，异常作为 alarm。
- `thingsboard/thingsboard`：监控系统气质、设备状态、遥测数据和告警联动。
- `mysociety/fixmystreet`：问题地点、现场图片、处理状态、处理留言、已解决/未解决。
- `keplergl/kepler.gl`：图层控制、热力颜色、时间线播放、事件点强调。
- `visgl/deck.gl`：layer-first 思维、数据驱动样式、交互拾取和高亮。

当前项目没有复制这些开源项目代码，只借鉴信息架构、交互组织和视觉语言。

## 页面入口

顶部细导航目前只开放正式业务页面：

```text
首页
监控页
工单页
```

默认进入正式首页。方案评测台源码仍保留在项目中，但已从导航和页面渲染入口移除，当前不可从界面访问。

## 首页设计

文件：

```text
src/pages/HomePage.tsx
```

首页定位为：

```text
全屏道路风险地图 / 道路热力图 / 路政态势图
```

实现方式：

- Leaflet + OSM + GeoJSON
- 复用标准路网数据
- 地图铺满页面核心区域
- 浮动系统标题
- 隐藏式“模式”菜单
- 浮动图例
- 左下角最近异常提示
- 点击道路后显示地图内悬浮详情窗

地图模式：

- 事故风险模式：按 `normal / busy / risk / danger` 显示道路颜色
- 车流密度模式：按 `traffic_flow` 分段显示道路颜色

首页不再使用固定右侧 30% 大报表区域，避免变成普通数据看板。

## 监控页设计

文件：

```text
src/pages/MonitorPage.tsx
```

监控页定位为：

```text
2x3 道路监控视频墙
```

实现内容：

- 每页展示 2 行 x 3 列，共 6 个监控视频
- 提供“上一组监控 / 下一组监控”
- 视频区域使用深色监控画面占位
- 带 LIVE 标识、通道编号、扫描线、模拟车流轨迹
- 视频边框颜色表示状态
- 每个视频下方直接显示小型数据：车流、均速、风险
- 点击“详情”可展开更多数据
- 点击视频画面可进入放大 Modal
- 放大窗口提供退出放大、关闭和 X 按钮
- 高风险或事故状态显示红色警示条

当前视频仍为 WebRTC Placeholder，后续可替换为真实 WebRTC 播放组件。

## 工单页设计

文件：

```text
src/pages/WorkOrderPage.tsx
```

工单页定位为：

```text
事件工单处置中心
```

页面结构：

- 左侧：工单状态筛选栏 + 可派发人员
- 中间：工单流
- 右侧：AI 处置助手

支持能力：

- 未解决工单
- 已解决工单
- 全部工单
- 待派发 / 待处理 / 处理中 / 已完成 / 误报关闭
- 事件等级颜色标识
- 工单派发
- 选择处理人员
- 工单详情 Modal
- 标记处理中
- 标记已完成
- 标记误报
- 查看现场图片、现场信息、AI 建议和处理记录

AI 处置助手：

- 展示当前选中工单上下文
- 提供快捷问题
- 支持输入问题
- 根据问题生成 mock 回复

快捷问题包括：

```text
如何处理该事故？
建议派发给谁？
为什么是高风险？
是否需要升级处置？
```

## Mock 数据

标准路网：

```text
src/data/standardRoadNetwork.ts
```

场景时间线：

```text
src/data/scenarioTimeline.ts
```

工单数据：

```text
src/data/mockWorkOrders.ts
```

人员数据：

```text
src/data/mockStaff.ts
```

监控视频元数据：

```text
src/data/mockMonitorVideos.ts
```

## 后续可接入能力

后续可将 mock 替换为：

- FastAPI RESTful API
- WebSocket 实时交通状态推送
- WebRTC 视频流
- YOLO 视觉检测结果
- 多模态模型事件研判
- 真实工单派发与反馈接口

建议接口方向：

```text
GET /api/v1/segments
GET /api/v1/cameras
GET /api/v1/traffic/live
GET /api/v1/events
GET /api/v1/work-orders
PUT /api/v1/work-orders/{order_id}/feedback
WebSocket /ws/v1/traffic/live
WebSocket /ws/v1/webrtc/{camera_id}
```

## 启动方式

```bash
npm install
npm run dev
```

构建验证：

```bash
npm run build
```

## 当前限制

- 视频流仍是模拟监控画面
- 事件、工单和人员均为 mock 数据
- 首页 OSM 底图依赖网络瓦片
- 方案评测台源码保留，但当前产品入口不可访问
- 还未接登录、权限、真实文件上传和后端状态持久化
