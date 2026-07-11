import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 30个摄像头/路口点位
const points = [
  { id: '01', name: '苏州街-海淀南路', lng: 116.3070, lat: 39.9730 },
  { id: '25', name: '海淀南路中段', lng: 116.3120, lat: 39.9730 },
  { id: '02', name: '海淀黄庄路口', lng: 116.3175, lat: 39.9730 },
  { id: '26', name: '知春路中段', lng: 116.3240, lat: 39.9730 },
  { id: '03', name: '知春里路口', lng: 116.3310, lat: 39.9730 },
  { id: '04', name: '西土城路口', lng: 116.3480, lat: 39.9730 },
  { id: '05', name: '苏州街-丹棱街', lng: 116.3070, lat: 39.9790 },
  { id: '06', name: '中关村大街-丹棱街', lng: 116.3175, lat: 39.9790 },
  { id: '27', name: '中关村大街中段', lng: 116.3175, lat: 39.9815 },
  { id: '07', name: '科学院南路路口', lng: 116.3310, lat: 39.9790 },
  { id: '08', name: '蓟门桥北', lng: 116.3480, lat: 39.9790 },
  { id: '09', name: '海淀桥', lng: 116.3070, lat: 39.9840 },
  { id: '10', name: '中关村一桥', lng: 116.3175, lat: 39.9840 },
  { id: '11', name: '保福寺桥', lng: 116.3310, lat: 39.9840 },
  { id: '12', name: '学院桥', lng: 116.3480, lat: 39.9840 },
  { id: '13', name: '北大西门南', lng: 116.3070, lat: 39.9880 },
  { id: '14', name: '北大东门南', lng: 116.3175, lat: 39.9880 },
  { id: '28', name: '中关村东路中段', lng: 116.3310, lat: 39.9885 },
  { id: '15', name: '清华科技园', lng: 116.3310, lat: 39.9880 },
  { id: '16', name: '北语东门', lng: 116.3480, lat: 39.9880 },
  { id: '17', name: '圆明园南门西', lng: 116.3070, lat: 39.9930 },
  { id: '18', name: '北京大学东门', lng: 116.3175, lat: 39.9930 },
  { id: '29', name: '成府路中段', lng: 116.3240, lat: 39.9930 },
  { id: '19', name: '五道口路口', lng: 116.3310, lat: 39.9930 },
  { id: '30', name: '清华东路西口', lng: 116.3395, lat: 39.9930 },
  { id: '20', name: '六道口', lng: 116.3480, lat: 39.9930 },
  { id: '21', name: '清华西门西', lng: 116.3070, lat: 40.0010 },
  { id: '22', name: '清华大学西门', lng: 116.3175, lat: 40.0010 },
  { id: '23', name: '清华大学东门', lng: 116.3310, lat: 40.0010 },
  { id: '24', name: '矿大东门', lng: 116.3480, lat: 40.0010 }
];

const segmentConnections = [
  { start: '01', end: '25', name: '海淀南路' }, { start: '25', end: '02', name: '海淀南路' },
  { start: '02', end: '26', name: '知春路' }, { start: '26', end: '03', name: '知春路' },
  { start: '03', end: '04', name: '知春路' }, { start: '05', end: '06', name: '丹棱街' },
  { start: '06', end: '07', name: '科学院南路' }, { start: '07', end: '08', name: '知春路辅路' },
  { start: '09', end: '10', name: '北四环西路' }, { start: '10', end: '11', name: '北四环西路' },
  { start: '11', end: '12', name: '北四环西路' }, { start: '17', end: '18', name: '成府路' },
  { start: '18', end: '29', name: '成府路' }, { start: '29', end: '19', name: '成府路' },
  { start: '19', end: '30', name: '清华东路' }, { start: '30', end: '20', name: '清华东路' },
  { start: '21', end: '22', name: '清华西路' }, { start: '22', end: '23', name: '双清路' },
  { start: '23', end: '24', name: '清华东路' }, { start: '01', end: '05', name: '苏州街' },
  { start: '05', end: '09', name: '苏州街' }, { start: '09', end: '13', name: '万泉河路' },
  { start: '13', end: '17', name: '万泉河路' }, { start: '17', end: '21', name: '万泉河路' },
  { start: '02', end: '06', name: '中关村大街' }, { start: '06', end: '27', name: '中关村大街' },
  { start: '27', end: '10', name: '中关村大街' }, { start: '10', end: '14', name: '中关村北大街' },
  { start: '14', end: '18', name: '中关村北大街' }, { start: '18', end: '22', name: '中关村北大街' },
  { start: '03', end: '07', name: '中关村东路' }, { start: '07', end: '11', name: '中关村东路' },
  { start: '11', end: '28', name: '中关村东路' }, { start: '28', end: '15', name: '中关村东路' },
  { start: '15', end: '19', name: '中关村东路' }, { start: '19', end: '23', name: '中关村东路' },
  { start: '04', end: '08', name: '学院路' }, { start: '08', end: '12', name: '学院路' },
  { start: '12', end: '16', name: '学院路' }, { start: '16', end: '20', name: '学院路' },
  { start: '20', end: '24', name: '学院路' }
];

async function fetchRoutePath(startLng, startLat, endLng, endLat) {
  const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?geometries=geojson`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) return data.routes[0].geometry.coordinates;
  } catch (e) {}
  return [[startLng, startLat], [endLng, endLat]];
}

// 映射状态枚举
function getRiskStatus(score) {
  if (score < 30) return "normal";
  if (score < 60) return "busy";
  if (score < 80) return "risk";
  return "danger";
}

async function generateData() {
  console.log('🚀 开始生成完全兼容的前端路网数据...');
  const nodes = points.map(p => ({ node_id: `N${p.id}`, name: p.name, lng: p.lng, lat: p.lat }));
  const cameras = points.map(p => ({ camera_id: `C${p.id}`, name: `${p.name}监控`, lng: p.lng, lat: p.lat, status: 'online' }));
  const roadSegments = [];

  for (let i = 0; i < segmentConnections.length; i++) {
    const config = segmentConnections[i];
    const startP = points.find(c => c.id === config.start);
    const endP = points.find(c => c.id === config.end);
    if (!startP || !endP) continue;

    await new Promise(resolve => setTimeout(resolve, 800)); 
    const pathCoords = await fetchRoutePath(startP.lng, startP.lat, endP.lng, endP.lat);

    // 强制对齐路径首尾坐标到节点/监控点坐标
    if (pathCoords.length >= 2) {
      pathCoords[0] = [startP.lng, startP.lat];
      pathCoords[pathCoords.length - 1] = [endP.lng, endP.lat];
    }

    const riskScore = Math.floor(Math.random() * 100);

    // 严格对齐你代码中的 RoadSegment 接口字段
    roadSegments.push({
      segment_id: `S-${config.start}-${config.end}`,
      name: config.name,
      from_node: `N${config.start}`,
      to_node: `N${config.end}`,
      road_type: 'main',
      length_m: Math.floor(Math.random() * 800) + 200,
      lane_count: 4,
      speed_limit: 60,
      traffic_flow: Math.floor(Math.random() * 1200) + 10,
      avg_speed: Math.floor(Math.random() * 40) + 20,
      risk_score: riskScore,
      status: getRiskStatus(riskScore),
      camera_ids: [`C${config.start}`, `C${config.end}`],
      path: pathCoords 
    });
    console.log(`[${i + 1}/${segmentConnections.length}] 已生成: ${config.name}`);
  }

  // 生成到一个全新的独立文件，不破坏原有类型！
  const outputContent = `
import type { RoadNode, CameraPoint, RoadSegment } from './standardRoadNetwork';

export const haidianNodes: RoadNode[] = ${JSON.stringify(nodes, null, 2)};
export const haidianCameras: CameraPoint[] = ${JSON.stringify(cameras, null, 2)};
export const haidianSegments: RoadSegment[] = ${JSON.stringify(roadSegments, null, 2)};
`;

  const outputPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/data/haidianRoadNetwork.ts');
  fs.writeFileSync(outputPath, outputContent, 'utf-8');
  console.log(`✅ 数据已安全保存至: src/data/haidianRoadNetwork.ts`);
}

generateData();