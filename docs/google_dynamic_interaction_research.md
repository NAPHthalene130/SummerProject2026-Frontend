# Google 动态交互设计调研与落地记录

本次重构重点参考 Google Earth Web 与 Google Material Design 的交互组织方式，不复制代码，只借鉴信息架构、动效逻辑与控件显隐策略。

## 参考来源

- Google Earth Web：地图作为绝对主体，工具栏悬浮，信息面板默认不打断地图浏览。
- Material Design 3 Motion：强调物理感、自然减速、进入/退出动效与容器变形。
- Material Design Motion transition patterns：使用 container transform、fade、shared axis 等方式表达界面关系。
- Google Design motion articles：动效应服务于引导注意力，而不是纯装饰。

## 可借鉴模式

1. 地图优先
   - 首页默认只显示地图和少量悬浮工具。
   - 图层、图例、事件、资产列表不常驻，占用空间时通过按钮展开。

2. 工具收纳
   - 参考 Google Earth 顶部/侧边工具栏，使用一个轻量入口承载高级功能。
   - 本项目落地为左上角 `...` 工具按钮，点击后展开地图工具抽屉。

3. 容器变形
   - 面板不是突然出现，而是从按钮附近展开。
   - 本项目使用 `googleContainerOpen` 动画模拟 Material container transform。

4. 错峰进入
   - 多个面板依次进入，减少“卡片堆出来”的模板感。
   - 本项目对工具抽屉中的标题、模式、资产、图例、事件使用 staggered animation。

5. 数据动态反馈
   - Google 产品常用微动效表达状态变化，例如进度、加载、聚焦、hover。
   - 本项目在监控统计翼中加入 shimmer、柱状条增长、环形统计旋转。

## 本项目落地

- 首页删除“播放 / 上一步 / 下一步 / 重置”，避免出现不真实的演示控制。
- 首页默认隐藏所有信息卡片，仅保留地图和 `...` 浮动工具按钮。
- 点击 `...` 后展开地图工具抽屉，显示模式切换、路网资产、图例和事件摘要。
- 道路点击详情仍作为地图对象交互保留，不属于默认常驻卡片。
- 监控页保留原 2x3 视频墙，在左右两侧附加统计数据翼，参考智慧交通大屏的数据分布。

## 不直接照搬内容

- 不接入 Google Earth / Cesium / deck.gl 真实 3D 地球引擎。
- 不复制 Google 官网代码或组件实现。
- 不引入大型 UI 框架，只用现有 React + CSS 完成动效。
