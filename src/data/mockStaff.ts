export interface StaffMember {
  id: string;
  name: string;
  role: string;
  status: "idle" | "busy";
  distance_km: number;
}

export const mockStaff: StaffMember[] = [
  { id: "staff_001", name: "人员A", role: "道路管理员", status: "idle", distance_km: 0.8 },
  { id: "staff_002", name: "人员B", role: "巡检员", status: "busy", distance_km: 1.3 },
  { id: "staff_003", name: "人员C", role: "巡检员", status: "idle", distance_km: 1.0 },
  { id: "staff_004", name: "人员D", role: "应急处置员", status: "idle", distance_km: 1.7 },
];
