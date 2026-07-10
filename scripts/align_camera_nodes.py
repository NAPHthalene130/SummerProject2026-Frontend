import json
import re
import os

target = os.path.join(os.path.dirname(__file__), "src", "data", "haidianRoadNetwork.ts")
with open(target, "r", encoding="utf-8") as f:
    content = f.read()

# 提取节点坐标映射
node_pattern = re.compile(
    r'"node_id":\s*"(N\d+)"[^}]*?"lng":\s*([0-9.]+)[^}]*?"lat":\s*([0-9.]+)',
    re.DOTALL
)
node_map: dict[str, list[float]] = {}
for m in node_pattern.finditer(content):
    node_id = m.group(1)
    lng = float(m.group(2))
    lat = float(m.group(3))
    node_map[node_id] = [lng, lat]
print(f"Found {len(node_map)} nodes")

# 提取所有 segment 并修正端点
seg_pattern = re.compile(
    r'(\{\s*"segment_id":\s*"[^"]+".*?"camera_ids":\s*\[[^\]]*\][^}]*?"path":\s*)\[(.*?)\](.*?\})',
    re.DOTALL
)

def fix_segment(match):
    prefix = match.group(1)
    path_body = match.group(2)
    suffix = match.group(3)

    # 提取 from_node, to_node
    from_m = re.search(r'"from_node":\s*"(N\d+)"', prefix)
    to_m = re.search(r'"to_node":\s*"(N\d+)"', prefix)
    if not from_m or not to_m:
        return match.group(0)

    from_id = from_m.group(1)
    to_id = to_m.group(1)
    from_coord = node_map.get(from_id)
    to_coord = node_map.get(to_id)
    if not from_coord or not to_coord:
        return match.group(0)

    coords = re.findall(r'\[([0-9.]+),\s*([0-9.]+)\]', path_body)
    if len(coords) < 2:
        return match.group(0)

    # 替换首尾坐标
    coords[0] = (str(from_coord[0]), str(from_coord[1]))
    coords[-1] = (str(to_coord[0]), str(to_coord[1]))

    new_path_body = "[\n" + ",\n".join(
        f'        [{lng}, {lat}]' for lng, lat in coords
    ) + "\n      ]"

    return prefix + new_path_body + suffix

new_content = seg_pattern.sub(fix_segment, content)

with open(target, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Done. File updated.")
