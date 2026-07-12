import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ==========================================
// 1. 生成 5 x 6 完美大型矩阵网格点阵 (共30个监控摄像头)
// ==========================================
const lngs = [116.2970, 116.3070, 116.3175, 116.3310, 116.3480, 116.3580]; // 西到东的 6 条干道
const lats = [40.0010, 39.9930, 39.9840, 39.9730, 39.9660];                // 北到南的 5 条干道
const colNames = ['万泉河路', '苏州街', '中关村大街', '中关村东路', '学院路', '花园东路'];
const rowNames = ['清华路', '成府路', '北四环西路', '知春路', '北三环西路'];

const points = [];
for (let r = 0; r < 5; r++) {
  for (let c = 0; c < 6; c++) {
    points.push({
      id: `${r}${c}`, // 生成如 "00", "01", "45" 的ID
      name: `${colNames[c]}与${rowNames[r]}`,
      lng: lngs[c],
      lat: lats[r]
    });
  }
}

// ==========================================
// 2. 自动生成网格拓扑连线 (严格相邻，绝对不重合)
// ==========================================
const segmentConnections = [];

// 横向连接 (East-West)
for (let r = 0; r < 5; r++) {
  for (let c = 0; c < 5; c++) {
    segmentConnections.push({
      start: `${r}${c}`,
      end: `${r}${c + 1}`,
      name: rowNames[r]
    });
  }
}

// 纵向连接 (North-South)
for (let c = 0; c < 6; c++) {
  for (let r = 0; r < 4; r++) {
    segmentConnections.push({
      start: `${r}${c}`,
      end: `${r + 1}${c}`,
      name: colNames[c]
    });
  }
}

// ==========================================
// 3. 数据拉取与文件生成
// ==========================================
async function fetchRoutePath(startLng, startLat, endLng, endLat) {
  const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?geometries=geojson`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) return data.routes[0].geometry.coordinates;
  } catch (e) {}
  return [[startLng, startLat], [endLng, endLat]];
}

function getRiskStatus(score) {
  if (score < 30) return "normal";
  if (score < 60) return "busy";
  if (score < 80) return "risk";
  return "danger";
}

async function generateData() {
  console.log('🚀 开始生成海淀区大型矩阵路网数据...');
  
  const nodes = points.map(p => ({ node_id: `N${p.id}`, name: p.name, lng: p.lng, lat: p.lat }));
  const cameras = points.map(p => ({ camera_id: `C${p.id}`, name: p.name, lng: p.lng, lat: p.lat, status: 'online' }));
  const roadSegments = [];

  for (let i = 0; i < segmentConnections.length; i++) {
    const config = segmentConnections[i];
    const startP = points.find(c => c.id === config.start);
    const endP = points.find(c => c.id === config.end);
    if (!startP || !endP) continue;

    // 延迟 600ms 防止被 OSRM 限制
    await new Promise(resolve => setTimeout(resolve, 600)); 
    const pathCoords = await fetchRoutePath(startP.lng, startP.lat, endP.lng, endP.lat);

    // 强制对齐首尾，避免漂移
    if (pathCoords.length >= 2) {
      pathCoords[0] = [startP.lng, startP.lat];
      pathCoords[pathCoords.length - 1] = [endP.lng, endP.lat];
    }

    const riskScore = Math.floor(Math.random() * 100);

    roadSegments.push({
      segment_id: `S-${config.start}-${config.end}`,
      name: config.name,
      from_node: `N${config.start}`,
      to_node: `N${config.end}`,
      road_type: 'main',
      length_m: Math.floor(Math.random() * 1200) + 400,
      lane_count: 4,
      speed_limit: 60,
      traffic_flow: Math.floor(Math.random() * 1200) + 10,
      avg_speed: Math.floor(Math.random() * 40) + 20,
      risk_score: riskScore,
      status: getRiskStatus(riskScore),
      camera_ids: [`C${config.start}`, `C${config.end}`],
      path: pathCoords 
    });
    console.log(`[${i + 1}/${segmentConnections.length}] 已生成: ${config.name} (${startP.name} ➡️ ${endP.name})`);
  }

  const outputContent = `// 此文件由 scripts/generateRoadPaths.js 自动生成，请勿手动修改
import type { RoadNode, CameraPoint, RoadSegment } from './standardRoadNetwork';

export const haidianNodes: RoadNode[] = ${JSON.stringify(nodes, null, 2)};
export const haidianCameras: CameraPoint[] = ${JSON.stringify(cameras, null, 2)};
export const haidianSegments: RoadSegment[] = ${JSON.stringify(roadSegments, null, 2)};
`;

  const outputPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/data/haidianRoadNetwork.ts');
  fs.writeFileSync(outputPath, outputContent, 'utf-8');
  console.log(`\n✅ 数据已安全保存至: src/data/haidianRoadNetwork.ts`);
}

generateData();