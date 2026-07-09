export interface MonitorVideoMeta {
  camera_id: string;
  channel_no: string;
  stream_label: string;
  last_update: string;
}

export const mockMonitorVideos: MonitorVideoMeta[] = [
  { camera_id: "cam_001", channel_no: "CH-01", stream_label: "科技大道西段卡口", last_update: "09:30:12" },
  { camera_id: "cam_002", channel_no: "CH-02", stream_label: "核心路口鹰眼", last_update: "09:30:13" },
  { camera_id: "cam_003", channel_no: "CH-03", stream_label: "创新路西段", last_update: "09:30:10" },
  { camera_id: "cam_004", channel_no: "CH-04", stream_label: "学校入口", last_update: "09:30:09" },
  { camera_id: "cam_005", channel_no: "CH-05", stream_label: "云计算路北段", last_update: "09:30:11" },
  { camera_id: "cam_006", channel_no: "CH-06", stream_label: "高新一路事故点", last_update: "09:30:14" },
];
