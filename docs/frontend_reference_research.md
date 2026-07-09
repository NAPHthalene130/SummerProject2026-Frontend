# 前端参考项目调研：智慧路政巡检分析系统

本文档整理本项目在重构首页、监控页、工单页时参考的成熟开源项目设计思想。本文只借鉴信息架构、页面布局、交互逻辑和视觉组织方式，不复制任何开源项目代码。

参考项目：

- [traccar/traccar-web](https://github.com/traccar/traccar-web)
- [openremote/openremote](https://github.com/openremote/openremote)
- [thingsboard/thingsboard](https://github.com/thingsboard/thingsboard)
- [mysociety/fixmystreet](https://github.com/mysociety/fixmystreet)
- [keplergl/kepler.gl](https://github.com/keplergl/kepler.gl)
- [visgl/deck.gl](https://github.com/visgl/deck.gl)

## 1. Traccar Web

### 核心用途

Traccar Web 是 Traccar GPS tracking 平台的 Web 前端。官方仓库说明其用于 Traccar 平台的 Web interface，并使用 React、Material UI 和 MapLibre。

### 值得借鉴的页面结构

- 地图是主体，而不是被数据报表挤压。
- 设备、位置、轨迹等对象通过地图图层组织。
- 控件以悬浮方式覆盖在地图上。
- 点击地图对象后再显示详情。
- 通知、状态、事件信息可以浮在地图边缘。

### 适合本项目的交互方式

- 首页地图全屏铺满。
- 道路、摄像头、事件拆成 RoadLayer / CameraLayer / EventLayer 的逻辑图层。
- 仅在点击道路后显示 SelectedRoadPopup。
- 事件提示只作为地图角落的小浮层，不做大报表。

### 不能直接照搬

- Traccar 面向 GPS 设备和车辆，本项目面向道路资产、摄像头和路政事件。
- Traccar 的设备列表、行程回放、车辆管理结构不能直接变成本项目页面。
- 本项目暂不引入 Material UI，也不切换到 MapLibre 作为首页主实现。

### 本项目采用的模式

```text
HomePage
  RoadMapView
  RoadLayer
  CameraLayer
  EventLayer
  MapModeSwitcher
  MapLegend
  MapEventNotification
  SelectedRoadPopup
```

## 2. OpenRemote

### 核心用途

OpenRemote 是开源 IoT 平台，用于设备管理、资产类型定制、自动化规则、数据分析、协议接入和 Manager API。

### 值得借鉴的页面结构

- 以 asset / device 为核心组织信息。
- 设备状态、遥测数据和规则触发事件是系统主线。
- 管理界面不是单纯表格，而是资产、状态、控制、规则和数据的组合。

### 适合本项目的交互方式

- 道路视为 road asset。
- 摄像头视为 camera device。
- 车流量、平均车速、风险分数视为 telemetry。
- 事故、拥堵、施工视为 alarm。
- 工单视为 action / task。

### 不能直接照搬

- OpenRemote 的通用 IoT 资产建模过重，本项目无需完整设备管理平台。
- 自动化规则编辑器、协议代理配置、资产类型建模暂不需要。

### 本项目采用的模式

- 监控页围绕摄像头设备和道路遥测展示。
- 工单页围绕报警事件和处置动作组织。
- 状态颜色、实时 telemetry 和 alarm 以监控系统方式呈现。

## 3. ThingsBoard

### 核心用途

ThingsBoard 是开源 IoT 平台，强调设备数据采集、分析、实时 IoT dashboards 和可视化。

### 值得借鉴的页面结构

- 设备遥测数据与告警状态共同驱动界面。
- dashboard 强调实时监控而不是静态卡片堆砌。
- 状态、告警、指标和设备上下文共同出现。

### 适合本项目的交互方式

- 每个视频监控窗口下方显示小型 telemetry。
- 高风险状态直接通过颜色边框和警示条表达。
- 监控墙保持实时系统气质，而不是普通数据看板。

### 不能直接照搬

- ThingsBoard 的通用 dashboard 配置器、widget 编辑器、规则链编辑器过重。
- 本项目没有多租户、设备配置、仪表盘编辑需求。

### 本项目采用的模式

- 2x3 视频墙替代普通卡片网格。
- 每路监控显示 LIVE、状态边框、车流量、均速和风险等级。
- 放大窗口用于查看某一路监控和异常上下文。

## 4. FixMyStreet

### 核心用途

FixMyStreet 是 mySociety 的开源地图问题上报平台，用于报告坑洞、路灯损坏等街道问题。

### 值得借鉴的页面结构

- 问题地点。
- 问题描述。
- 现场图片。
- 处理状态。
- 处理留言。
- 已解决 / 未解决分类。

### 适合本项目的交互方式

- 工单围绕事故地点和监控地址展开。
- 每个工单必须包含现场图片、事件描述和处理状态。
- 已解决工单展示处理留言、处理图片和完成时间。
- 未解决工单体现派发和流转。

### 不能直接照搬

- FixMyStreet 面向公众上报，本项目面向路政内部处置。
- FixMyStreet 的市民表单、地址搜索、公开反馈流程不适合直接照搬。

### 本项目采用的模式

- 工单页定位为事件工单处置中心。
- 保留已解决 / 未解决 / 全部分类。
- 工单详情包含现场信息、图片、AI 建议和处理记录。

## 5. Kepler.gl

### 核心用途

Kepler.gl 是开源大规模地理空间数据分析工具。官方说明其可视化大规模地理数据，并基于 MapLibre GL 和 deck.gl 进行空间聚合和高性能渲染。

### 值得借鉴的页面结构

- 地图视觉作为核心工作区。
- 图层控制。
- 热力颜色。
- 时间线播放。
- 数据点 hover / click 高亮。
- 异常或热点用强视觉强调。

### 适合本项目的交互方式

- 首页提供事故风险模式 / 车流密度模式。
- 道路颜色根据状态或车流量实时变化。
- 事件点在地图上高亮。
- 播放控制作为地图悬浮工具，而不是独立报表区。

### 不能直接照搬

- 不完整接入 Kepler.gl。
- 不引入复杂数据导入、图层编辑、Redux 状态模型。
- 本项目数据规模很小，不需要大规模空间分析能力。

### 本项目采用的模式

- 专业 GIS 工具式的图层语言。
- 地图上悬浮模式切换、图例和事件提示。
- 道路高亮和异常点强调。

## 6. deck.gl

### 核心用途

deck.gl 是 GPU 驱动的大规模数据可视化框架，强调通过 layers 组合复杂可视化，并支持 picking、highlighting、filtering 和底图集成。

### 值得借鉴的页面结构

- 用 layer 抽象组织可视对象。
- 数据驱动图层属性，如颜色、大小、透明度。
- 交互拾取、hover 高亮和过滤。
- 地图与可视化图层分离。

### 适合本项目的交互方式

- 首页内部明确分为 RoadLayer、CameraLayer、EventLayer。
- 道路颜色由模式和数据驱动。
- 点击道路打开悬浮详情。
- 后续如果数据量变大，可升级为 deck.gl / MapLibre 组合。

### 不能直接照搬

- 不引入 deck.gl 依赖。
- 不做 GPU 图层和复杂 3D / aggregation layers。
- 当前 Leaflet 足够支撑小学期演示。

### 本项目采用的模式

- 借鉴 layer-first 思维，但继续使用现有 Leaflet 实现。
- 将道路、摄像头、事件拆成逻辑层，便于后续替换底层渲染技术。

## 7. 最终设计模式总结

### 首页

借鉴 Traccar、Kepler.gl、deck.gl：

- 地图全屏。
- 浮动控制层。
- 图层逻辑拆分。
- 点击道路后显示详情。
- 最近异常浮在地图边缘。
- 不使用固定右侧大报表。

### 监控页

借鉴 OpenRemote、ThingsBoard：

- 摄像头是设备。
- 道路状态是资产状态。
- 车流量、均速、风险分数是 telemetry。
- 异常事件是 alarm。
- 视频墙是核心，指标贴近每路视频。

### 工单页

借鉴 FixMyStreet、OpenRemote：

- 事件处置中心而不是普通表格。
- 工单包含地点、描述、现场图、状态和处理记录。
- 未解决工单支持派发与状态流转。
- 右侧 AI 处置助手用于辅助决策。

### 不采用的内容

- 不复制任何开源项目代码。
- 不引入大型 UI 框架。
- 不完整接入 Kepler.gl / deck.gl。
- 不实现通用 IoT 资产平台。
- 不实现公众上报流程。

## 8. 与当前代码的对应关系

```text
src/pages/HomePage.tsx
  RoadMapView
  RoadLayer
  CameraLayer
  EventLayer
  MapModeSwitcher
  MapLegend
  MapEventNotification
  SelectedRoadPopup

src/pages/MonitorPage.tsx
  2x3 视频墙
  每路 telemetry
  放大 Modal

src/pages/WorkOrderPage.tsx
  状态筛选栏
  工单流
  派发弹窗
  工单详情 Modal
  AI 处置助手
```
