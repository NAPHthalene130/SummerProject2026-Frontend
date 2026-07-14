export interface StaffMember {
  id: string;
  name: string;
  role: string;
  status: "idle" | "busy";
  distance_km: number;
  personnel_category?: string;
}

export const mockStaff: StaffMember[] = [
  { id: "staff_001", name: "人员A", role: "交警执法", personnel_category: "traffic_police", status: "idle", distance_km: 0.8 },
  { id: "staff_002", name: "人员B", role: "道路养护", personnel_category: "road_maintenance", status: "busy", distance_km: 1.3 },
  { id: "staff_003", name: "人员C", role: "交通疏导", personnel_category: "traffic_coordination", status: "idle", distance_km: 1.0 },
  { id: "staff_004", name: "人员D", role: "市政设施", personnel_category: "municipal_facilities", status: "idle", distance_km: 1.7 },
  { id: "staff_005", name: "人员E", role: "清障救援", personnel_category: "vehicle_rescue", status: "idle", distance_km: 2.1 },
  { id: "staff_006", name: "人员F", role: "应急消防", personnel_category: "emergency_fire", status: "idle", distance_km: 2.4 },
];
