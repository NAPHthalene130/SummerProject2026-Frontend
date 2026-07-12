import type { RoadNode, CameraPoint, RoadSegment } from './standardRoadNetwork';

export const haidianNodes: RoadNode[] = [
  {
    "node_id": "N01",
    "name": "苏州街-海淀南路",
    "lng": 116.2816894094048,
    "lat": 40.0325907764657
  },
  {
    "node_id": "N25",
    "name": "海淀南路中段",
    "lng": 116.27115637138297,
    "lat": 40.031917137692496
  },
  {
    "node_id": "N02",
    "name": "海淀黄庄路口",
    "lng": 116.29224121917395,
    "lat": 40.03267702468648
  },
  {
    "node_id": "N26",
    "name": "知春路中段",
    "lng": 116.27257526168587,
    "lat": 40.02480059152231
  },
  {
    "node_id": "N03",
    "name": "知春里路口",
    "lng": 116.2799298733549,
    "lat": 40.021245141626935
  },
  {
    "node_id": "N04",
    "name": "西土城路口",
    "lng": 116.27979576736311,
    "lat": 40.0231450910163
  },
  {
    "node_id": "N05",
    "name": "苏州街-丹棱街",
    "lng": 116.27583682685713,
    "lat": 40.032547630693614
  },
  {
    "node_id": "N06",
    "name": "中关村大街-丹棱街",
    "lng": 116.28388344102044,
    "lat": 40.02231930998957
  },
  {
    "node_id": "N27",
    "name": "中关村大街中段",
    "lng": 116.27148091941694,
    "lat": 40.0275220135085
  },
  {
    "node_id": "N07",
    "name": "科学院南路路口",
    "lng": 116.28257989883424,
    "lat": 40.027039361243915
  },
  {
    "node_id": "N08",
    "name": "蓟门桥北",
    "lng": 116.2669801707082,
    "lat": 40.03111001565931
  },
  {
    "node_id": "N09",
    "name": "海淀桥",
    "lng": 116.2910342206583,
    "lat": 40.02328065035058
  },
  {
    "node_id": "N10",
    "name": "中关村一桥",
    "lng": 116.28462374309449,
    "lat": 40.02871529847029
  },
  {
    "node_id": "N11",
    "name": "保福寺桥",
    "lng": 116.2888830922487,
    "lat": 40.03265033151911
  },
  {
    "node_id": "N12",
    "name": "学院桥",
    "lng": 116.27882481017691,
    "lat": 40.02563859324007
  },
  {
    "node_id": "N13",
    "name": "北大西门南",
    "lng": 116.29388541107062,
    "lat": 40.027528176986294
  },
  {
    "node_id": "N14",
    "name": "北大东门南",
    "lng": 116.28450078953759,
    "lat": 40.02996375942268
  },
  {
    "node_id": "N28",
    "name": "中关村东路中段",
    "lng": 116.27607822120952,
    "lat": 40.02981614252754
  },
  {
    "node_id": "N15",
    "name": "清华科技园",
    "lng": 116.28623306800797,
    "lat": 40.026850398081216
  },
  {
    "node_id": "N16",
    "name": "北语东门",
    "lng": 116.27659857396964,
    "lat": 40.020053759207066
  },
  {
    "node_id": "N17",
    "name": "圆明园南门西",
    "lng": 116.29305929465751,
    "lat": 40.03015912082718
  },
  {
    "node_id": "N18",
    "name": "北京大学东门",
    "lng": 116.29008473402558,
    "lat": 40.02701059531901
  },
  {
    "node_id": "N29",
    "name": "成府路中段",
    "lng": 116.28720134026027,
    "lat": 40.02276920708305
  },
  {
    "node_id": "N19",
    "name": "五道口路口",
    "lng": 116.2950307150631,
    "lat": 40.0238393368659
  },
  {
    "node_id": "N30",
    "name": "清华东路西口",
    "lng": 116.28211857969204,
    "lat": 40.02999277738514
  },
  {
    "node_id": "N20",
    "name": "六道口",
    "lng": 116.27556323806954,
    "lat": 40.026353357906224
  },
  {
    "node_id": "N21",
    "name": "清华西门西",
    "lng": 116.289381988823,
    "lat": 40.03009545013604
  },
  {
    "node_id": "N22",
    "name": "清华大学西门",
    "lng": 116.28608822921662,
    "lat": 40.02999687194709
  },
  {
    "node_id": "N23",
    "name": "清华大学东门",
    "lng": 116.28658173585787,
    "lat": 40.02656285635633
  },
  {
    "node_id": "N24",
    "name": "矿大东门",
    "lng": 116.28152858189662,
    "lat": 40.0276639704169
  }
];
export const haidianCameras: CameraPoint[] = [
  {
    "camera_id": "C01",
    "name": "苏州街-海淀南路监控",
    "lng": 116.2816894094048,
    "lat": 40.0325907764657,
    "status": "online"
  },
  {
    "camera_id": "C25",
    "name": "海淀南路中段监控",
    "lng": 116.27115637138297,
    "lat": 40.031917137692496,
    "status": "online"
  },
  {
    "camera_id": "C02",
    "name": "海淀黄庄路口监控",
    "lng": 116.29224121917395,
    "lat": 40.03267702468648,
    "status": "online"
  },
  {
    "camera_id": "C26",
    "name": "知春路中段监控",
    "lng": 116.27257526168587,
    "lat": 40.02480059152231,
    "status": "online"
  },
  {
    "camera_id": "C03",
    "name": "知春里路口监控",
    "lng": 116.2799298733549,
    "lat": 40.021245141626935,
    "status": "online"
  },
  {
    "camera_id": "C04",
    "name": "西土城路口监控",
    "lng": 116.27979576736311,
    "lat": 40.0231450910163,
    "status": "online"
  },
  {
    "camera_id": "C05",
    "name": "苏州街-丹棱街监控",
    "lng": 116.27583682685713,
    "lat": 40.032547630693614,
    "status": "online"
  },
  {
    "camera_id": "C06",
    "name": "中关村大街-丹棱街监控",
    "lng": 116.28388344102044,
    "lat": 40.02231930998957,
    "status": "online"
  },
  {
    "camera_id": "C27",
    "name": "中关村大街中段监控",
    "lng": 116.27148091941694,
    "lat": 40.0275220135085,
    "status": "online"
  },
  {
    "camera_id": "C07",
    "name": "科学院南路路口监控",
    "lng": 116.28257989883424,
    "lat": 40.027039361243915,
    "status": "online"
  },
  {
    "camera_id": "C08",
    "name": "蓟门桥北监控",
    "lng": 116.2669801707082,
    "lat": 40.03111001565931,
    "status": "online"
  },
  {
    "camera_id": "C09",
    "name": "海淀桥监控",
    "lng": 116.2910342206583,
    "lat": 40.02328065035058,
    "status": "online"
  },
  {
    "camera_id": "C10",
    "name": "中关村一桥监控",
    "lng": 116.28462374309449,
    "lat": 40.02871529847029,
    "status": "online"
  },
  {
    "camera_id": "C11",
    "name": "保福寺桥监控",
    "lng": 116.2888830922487,
    "lat": 40.03265033151911,
    "status": "online"
  },
  {
    "camera_id": "C12",
    "name": "学院桥监控",
    "lng": 116.27882481017691,
    "lat": 40.02563859324007,
    "status": "online"
  },
  {
    "camera_id": "C13",
    "name": "北大西门南监控",
    "lng": 116.29388541107062,
    "lat": 40.027528176986294,
    "status": "online"
  },
  {
    "camera_id": "C14",
    "name": "北大东门南监控",
    "lng": 116.28450078953759,
    "lat": 40.02996375942268,
    "status": "online"
  },
  {
    "camera_id": "C28",
    "name": "中关村东路中段监控",
    "lng": 116.27607822120952,
    "lat": 40.02981614252754,
    "status": "online"
  },
  {
    "camera_id": "C15",
    "name": "清华科技园监控",
    "lng": 116.28623306800797,
    "lat": 40.026850398081216,
    "status": "online"
  },
  {
    "camera_id": "C16",
    "name": "北语东门监控",
    "lng": 116.27659857396964,
    "lat": 40.020053759207066,
    "status": "online"
  },
  {
    "camera_id": "C17",
    "name": "圆明园南门西监控",
    "lng": 116.29305929465751,
    "lat": 40.03015912082718,
    "status": "online"
  },
  {
    "camera_id": "C18",
    "name": "北京大学东门监控",
    "lng": 116.29008473402558,
    "lat": 40.02701059531901,
    "status": "online"
  },
  {
    "camera_id": "C29",
    "name": "成府路中段监控",
    "lng": 116.28720134026027,
    "lat": 40.02276920708305,
    "status": "online"
  },
  {
    "camera_id": "C19",
    "name": "五道口路口监控",
    "lng": 116.2950307150631,
    "lat": 40.0238393368659,
    "status": "online"
  },
  {
    "camera_id": "C30",
    "name": "清华东路西口监控",
    "lng": 116.28211857969204,
    "lat": 40.02999277738514,
    "status": "online"
  },
  {
    "camera_id": "C20",
    "name": "六道口监控",
    "lng": 116.27556323806954,
    "lat": 40.026353357906224,
    "status": "online"
  },
  {
    "camera_id": "C21",
    "name": "清华西门西监控",
    "lng": 116.289381988823,
    "lat": 40.03009545013604,
    "status": "online"
  },
  {
    "camera_id": "C22",
    "name": "清华大学西门监控",
    "lng": 116.28608822921662,
    "lat": 40.02999687194709,
    "status": "online"
  },
  {
    "camera_id": "C23",
    "name": "清华大学东门监控",
    "lng": 116.28658173585787,
    "lat": 40.02656285635633,
    "status": "online"
  },
  {
    "camera_id": "C24",
    "name": "矿大东门监控",
    "lng": 116.28152858189662,
    "lat": 40.0276639704169,
    "status": "online"
  }
];
export const haidianSegments: RoadSegment[] = [
  {
    "segment_id": "S-25-05",
    "name": "海淀南路中段-苏州街-丹棱街",
    "from_node": "N25",
    "to_node": "N05",
    "road_type": "main",
    "length_m": 246,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C25",
      "C05"
    ],
    "traffic_flow": 832,
    "avg_speed": 40,
    "risk_score": 25,
    "status": "normal",
    "path": [
      [
        116.271156,
        40.031917
      ],
      [
        116.271156,
        40.031918
      ],
      [
        116.271878,
        40.032061
      ],
      [
        116.272538,
        40.032191
      ],
      [
        116.2738,
        40.032373
      ],
      [
        116.274817,
        40.032465
      ],
      [
        116.275826,
        40.032544
      ],
      [
        116.275837,
        40.032544
      ]
    ]
  },
  {
    "segment_id": "S-05-01",
    "name": "苏州街-丹棱街-苏州街-海淀南路",
    "from_node": "N05",
    "to_node": "N01",
    "road_type": "main",
    "length_m": 671,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C05",
      "C01"
    ],
    "traffic_flow": 562,
    "avg_speed": 42,
    "risk_score": 20,
    "status": "normal",
    "path": [
      [
        116.275837,
        40.032544
      ],
      [
        116.276246,
        40.032557
      ],
      [
        116.277087,
        40.032563
      ],
      [
        116.278194,
        40.03257
      ],
      [
        116.281689,
        40.032592
      ],
      [
        116.281689,
        40.032591
      ]
    ]
  },
  {
    "segment_id": "S-01-11",
    "name": "苏州街-海淀南路-保福寺桥",
    "from_node": "N01",
    "to_node": "N11",
    "road_type": "main",
    "length_m": 338,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C01",
      "C11"
    ],
    "traffic_flow": 894,
    "avg_speed": 29,
    "risk_score": 94,
    "status": "danger",
    "path": [
      [
        116.281689,
        40.032591
      ],
      [
        116.281689,
        40.032592
      ],
      [
        116.283178,
        40.032605
      ],
      [
        116.286504,
        40.032635
      ],
      [
        116.287047,
        40.032638
      ],
      [
        116.288881,
        40.032652
      ],
      [
        116.288881,
        40.03265
      ]
    ]
  },
  {
    "segment_id": "S-11-02",
    "name": "保福寺桥-海淀黄庄路口",
    "from_node": "N11",
    "to_node": "N02",
    "road_type": "main",
    "length_m": 911,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C11",
      "C02"
    ],
    "traffic_flow": 715,
    "avg_speed": 23,
    "risk_score": 91,
    "status": "danger",
    "path": [
      [
        116.288881,
        40.03265
      ],
      [
        116.288881,
        40.032652
      ],
      [
        116.292243,
        40.032675
      ],
      [
        116.292242,
        40.032677
      ]
    ]
  },
  {
    "segment_id": "S-02-17",
    "name": "海淀黄庄路口-圆明园南门西",
    "from_node": "N02",
    "to_node": "N17",
    "road_type": "main",
    "length_m": 456,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C02",
      "C17"
    ],
    "traffic_flow": 693,
    "avg_speed": 45,
    "risk_score": 9,
    "status": "normal",
    "path": [
      [
        116.292242,
        40.032677
      ],
      [
        116.292243,
        40.032675
      ],
      [
        116.292272,
        40.032576
      ],
      [
        116.293061,
        40.030166
      ],
      [
        116.293063,
        40.03016
      ]
    ]
  },
  {
    "segment_id": "S-17-13",
    "name": "圆明园南门西-北大西门南",
    "from_node": "N17",
    "to_node": "N13",
    "road_type": "main",
    "length_m": 750,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C17",
      "C13"
    ],
    "traffic_flow": 116,
    "avg_speed": 52,
    "risk_score": 66,
    "status": "risk",
    "path": [
      [
        116.293063,
        40.03016
      ],
      [
        116.293855,
        40.027646
      ],
      [
        116.293884,
        40.027535
      ],
      [
        116.293886,
        40.027528
      ]
    ]
  },
  {
    "segment_id": "S-13-19",
    "name": "北大西门南-五道口路口",
    "from_node": "N13",
    "to_node": "N19",
    "road_type": "main",
    "length_m": 444,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C13",
      "C19"
    ],
    "traffic_flow": 1156,
    "avg_speed": 23,
    "risk_score": 27,
    "status": "normal",
    "path": [
      [
        116.293886,
        40.027528
      ],
      [
        116.293913,
        40.027426
      ],
      [
        116.294535,
        40.025452
      ],
      [
        116.294767,
        40.024744
      ],
      [
        116.295009,
        40.024003
      ],
      [
        116.295026,
        40.023843
      ],
      [
        116.294967,
        40.023741
      ],
      [
        116.295079,
        40.023758
      ],
      [
        116.295029,
        40.023838
      ]
    ]
  },
  {
    "segment_id": "S-19-09",
    "name": "五道口路口-海淀桥",
    "from_node": "N19",
    "to_node": "N09",
    "road_type": "main",
    "length_m": 850,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C19",
      "C09"
    ],
    "traffic_flow": 492,
    "avg_speed": 52,
    "risk_score": 85,
    "status": "danger",
    "path": [
      [
        116.295029,
        40.023838
      ],
      [
        116.295026,
        40.023843
      ],
      [
        116.29284,
        40.023535
      ],
      [
        116.292455,
        40.023482
      ],
      [
        116.291034,
        40.02328
      ]
    ]
  },
  {
    "segment_id": "S-09-29",
    "name": "海淀桥-成府路中段",
    "from_node": "N09",
    "to_node": "N29",
    "road_type": "main",
    "length_m": 884,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C09",
      "C29"
    ],
    "traffic_flow": 327,
    "avg_speed": 50,
    "risk_score": 83,
    "status": "danger",
    "path": [
      [
        116.291034,
        40.02328
      ],
      [
        116.291031,
        40.02328
      ],
      [
        116.287205,
        40.022765
      ],
      [
        116.287204,
        40.022769
      ]
    ]
  },
  {
    "segment_id": "S-05-28",
    "name": "苏州街-丹棱街-中关村东路中段",
    "from_node": "N05",
    "to_node": "N28",
    "road_type": "main",
    "length_m": 304,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C05",
      "C28"
    ],
    "traffic_flow": 757,
    "avg_speed": 46,
    "risk_score": 84,
    "status": "danger",
    "path": [
      [
        116.275826,
        40.032544
      ],
      [
        116.275839,
        40.032408
      ],
      [
        116.276076,
        40.029816
      ]
    ]
  },
  {
    "segment_id": "S-25-27",
    "name": "海淀南路中段-中关村大街中段",
    "from_node": "N25",
    "to_node": "N27",
    "road_type": "main",
    "length_m": 427,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C25",
      "C27"
    ],
    "traffic_flow": 395,
    "avg_speed": 37,
    "risk_score": 32,
    "status": "busy",
    "path": [
      [
        116.271156,
        40.031917
      ],
      [
        116.271469,
        40.027699
      ],
      [
        116.271478,
        40.027522
      ]
    ]
  },
  {
    "segment_id": "S-27-28",
    "name": "中关村大街中段-中关村东路中段",
    "from_node": "N27",
    "to_node": "N28",
    "road_type": "main",
    "length_m": 468,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C27",
      "C28"
    ],
    "traffic_flow": 660,
    "avg_speed": 47,
    "risk_score": 53,
    "status": "busy",
    "path": [
      [
        116.271478,
        40.027522
      ],
      [
        116.271478,
        40.027518
      ],
      [
        116.273802,
        40.028569
      ],
      [
        116.276077,
        40.029802
      ],
      [
        116.276076,
        40.029816
      ]
    ]
  },
  {
    "segment_id": "S-28-30",
    "name": "中关村东路中段-清华东路西口",
    "from_node": "N28",
    "to_node": "N30",
    "road_type": "main",
    "length_m": 453,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C28",
      "C30"
    ],
    "traffic_flow": 176,
    "avg_speed": 38,
    "risk_score": 69,
    "status": "risk",
    "path": [
      [
        116.276076,
        40.029816
      ],
      [
        116.276077,
        40.029802
      ],
      [
        116.279302,
        40.029911
      ],
      [
        116.282011,
        40.029985
      ],
      [
        116.282119,
        40.029986
      ],
      [
        116.282118,
        40.029993
      ]
    ]
  },
  {
    "segment_id": "S-30-14",
    "name": "清华东路西口-北大东门南",
    "from_node": "N30",
    "to_node": "N14",
    "road_type": "main",
    "length_m": 980,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C30",
      "C14"
    ],
    "traffic_flow": 78,
    "avg_speed": 20,
    "risk_score": 0,
    "status": "normal",
    "path": [
      [
        116.282118,
        40.029993
      ],
      [
        116.282119,
        40.029986
      ],
      [
        116.282199,
        40.029924
      ],
      [
        116.284503,
        40.029989
      ],
      [
        116.284507,
        40.029965
      ]
    ]
  },
  {
    "segment_id": "S-14-10",
    "name": "北大东门南-中关村一桥",
    "from_node": "N14",
    "to_node": "N10",
    "road_type": "main",
    "length_m": 879,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C14",
      "C10"
    ],
    "traffic_flow": 137,
    "avg_speed": 41,
    "risk_score": 38,
    "status": "busy",
    "path": [
      [
        116.284507,
        40.029965
      ],
      [
        116.284645,
        40.029084
      ],
      [
        116.284629,
        40.028713
      ],
      [
        116.284624,
        40.028713
      ]
    ]
  },
  {
    "segment_id": "S-10-15",
    "name": "中关村一桥-清华科技园",
    "from_node": "N10",
    "to_node": "N15",
    "road_type": "main",
    "length_m": 271,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C10",
      "C15"
    ],
    "traffic_flow": 17,
    "avg_speed": 52,
    "risk_score": 96,
    "status": "danger",
    "path": [
      [
        116.284624,
        40.028713
      ],
      [
        116.284629,
        40.028713
      ],
      [
        116.284726,
        40.028325
      ],
      [
        116.28601,
        40.028405
      ],
      [
        116.286236,
        40.02685
      ]
    ]
  },
  {
    "segment_id": "S-14-22",
    "name": "北大东门南-清华大学西门",
    "from_node": "N14",
    "to_node": "N22",
    "road_type": "main",
    "length_m": 486,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C14",
      "C22"
    ],
    "traffic_flow": 230,
    "avg_speed": 58,
    "risk_score": 87,
    "status": "danger",
    "path": [
      [
        116.284507,
        40.029965
      ],
      [
        116.284503,
        40.029989
      ],
      [
        116.285408,
        40.030018
      ],
      [
        116.28608,
        40.03002
      ],
      [
        116.286083,
        40.029997
      ]
    ]
  },
  {
    "segment_id": "S-22-23",
    "name": "清华大学西门-清华大学东门",
    "from_node": "N22",
    "to_node": "N23",
    "road_type": "main",
    "length_m": 249,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C22",
      "C23"
    ],
    "traffic_flow": 149,
    "avg_speed": 55,
    "risk_score": 5,
    "status": "normal",
    "path": [
      [
        116.286083,
        40.029997
      ],
      [
        116.286576,
        40.02658
      ],
      [
        116.286579,
        40.026563
      ]
    ]
  },
  {
    "segment_id": "S-23-29",
    "name": "清华大学东门-成府路中段",
    "from_node": "N23",
    "to_node": "N29",
    "road_type": "main",
    "length_m": 510,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C23",
      "C29"
    ],
    "traffic_flow": 1144,
    "avg_speed": 42,
    "risk_score": 69,
    "status": "risk",
    "path": [
      [
        116.286579,
        40.026563
      ],
      [
        116.287204,
        40.022769
      ]
    ]
  },
  {
    "segment_id": "S-09-18",
    "name": "海淀桥-北京大学东门",
    "from_node": "N09",
    "to_node": "N18",
    "road_type": "main",
    "length_m": 661,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C09",
      "C18"
    ],
    "traffic_flow": 1141,
    "avg_speed": 49,
    "risk_score": 81,
    "status": "danger",
    "path": [
      [
        116.291034,
        40.02328
      ],
      [
        116.291031,
        40.02328
      ],
      [
        116.290137,
        40.026885
      ],
      [
        116.290091,
        40.027012
      ]
    ]
  },
  {
    "segment_id": "S-18-21",
    "name": "北京大学东门-清华西门西",
    "from_node": "N18",
    "to_node": "N21",
    "road_type": "main",
    "length_m": 556,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C18",
      "C21"
    ],
    "traffic_flow": 556,
    "avg_speed": 32,
    "risk_score": 41,
    "status": "busy",
    "path": [
      [
        116.290091,
        40.027012
      ],
      [
        116.290087,
        40.027022
      ],
      [
        116.290068,
        40.027112
      ],
      [
        116.289623,
        40.029174
      ],
      [
        116.289412,
        40.029972
      ],
      [
        116.289382,
        40.030084
      ],
      [
        116.28938,
        40.030095
      ]
    ]
  },
  {
    "segment_id": "S-23-18",
    "name": "清华大学东门-北京大学东门",
    "from_node": "N23",
    "to_node": "N18",
    "road_type": "main",
    "length_m": 888,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C23",
      "C18"
    ],
    "traffic_flow": 160,
    "avg_speed": 35,
    "risk_score": 94,
    "status": "danger",
    "path": [
      [
        116.286579,
        40.026563
      ],
      [
        116.286576,
        40.02658
      ],
      [
        116.28993,
        40.026997
      ],
      [
        116.290087,
        40.027022
      ],
      [
        116.290091,
        40.027012
      ]
    ]
  },
  {
    "segment_id": "S-18-13",
    "name": "北京大学东门-北大西门南",
    "from_node": "N18",
    "to_node": "N13",
    "road_type": "main",
    "length_m": 770,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C18",
      "C13"
    ],
    "traffic_flow": 929,
    "avg_speed": 37,
    "risk_score": 62,
    "status": "risk",
    "path": [
      [
        116.290091,
        40.027012
      ],
      [
        116.290087,
        40.027022
      ],
      [
        116.290249,
        40.027035
      ],
      [
        116.293691,
        40.027516
      ],
      [
        116.293884,
        40.027535
      ],
      [
        116.293886,
        40.027528
      ]
    ]
  },
  {
    "segment_id": "S-22-21",
    "name": "清华大学西门-清华西门西",
    "from_node": "N22",
    "to_node": "N21",
    "road_type": "main",
    "length_m": 285,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C22",
      "C21"
    ],
    "traffic_flow": 153,
    "avg_speed": 57,
    "risk_score": 21,
    "status": "normal",
    "path": [
      [
        116.286083,
        40.029997
      ],
      [
        116.28608,
        40.03002
      ],
      [
        116.289227,
        40.030081
      ],
      [
        116.289382,
        40.030084
      ],
      [
        116.28938,
        40.030095
      ]
    ]
  },
  {
    "segment_id": "S-17-21",
    "name": "圆明园南门西-清华西门西",
    "from_node": "N17",
    "to_node": "N21",
    "road_type": "main",
    "length_m": 512,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C17",
      "C21"
    ],
    "traffic_flow": 577,
    "avg_speed": 33,
    "risk_score": 35,
    "status": "busy",
    "path": [
      [
        116.293063,
        40.03016
      ],
      [
        116.293061,
        40.030166
      ],
      [
        116.289549,
        40.030088
      ],
      [
        116.289382,
        40.030084
      ],
      [
        116.28938,
        40.030095
      ]
    ]
  },
  {
    "segment_id": "S-11-21",
    "name": "保福寺桥-清华西门西",
    "from_node": "N11",
    "to_node": "N21",
    "road_type": "main",
    "length_m": 660,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C11",
      "C21"
    ],
    "traffic_flow": 304,
    "avg_speed": 42,
    "risk_score": 8,
    "status": "normal",
    "path": [
      [
        116.288881,
        40.03265
      ],
      [
        116.288898,
        40.032554
      ],
      [
        116.28936,
        40.030195
      ],
      [
        116.28938,
        40.030095
      ]
    ]
  },
  {
    "segment_id": "S-01-30",
    "name": "苏州街-海淀南路-清华东路西口",
    "from_node": "N01",
    "to_node": "N30",
    "road_type": "main",
    "length_m": 874,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C01",
      "C30"
    ],
    "traffic_flow": 641,
    "avg_speed": 54,
    "risk_score": 0,
    "status": "normal",
    "path": [
      [
        116.281689,
        40.032591
      ],
      [
        116.281729,
        40.032472
      ],
      [
        116.282118,
        40.029993
      ]
    ]
  },
  {
    "segment_id": "S-29-06",
    "name": "成府路中段-中关村大街-丹棱街",
    "from_node": "N29",
    "to_node": "N06",
    "road_type": "main",
    "length_m": 390,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C29",
      "C06"
    ],
    "traffic_flow": 158,
    "avg_speed": 32,
    "risk_score": 16,
    "status": "normal",
    "path": [
      [
        116.287204,
        40.022769
      ],
      [
        116.287205,
        40.022765
      ],
      [
        116.285527,
        40.022539
      ],
      [
        116.283883,
        40.022318
      ]
    ]
  },
  {
    "segment_id": "S-06-03",
    "name": "中关村大街-丹棱街-知春里路口",
    "from_node": "N06",
    "to_node": "N03",
    "road_type": "main",
    "length_m": 232,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C06",
      "C03"
    ],
    "traffic_flow": 820,
    "avg_speed": 52,
    "risk_score": 99,
    "status": "danger",
    "path": [
      [
        116.283883,
        40.022318
      ],
      [
        116.283878,
        40.022317
      ],
      [
        116.282684,
        40.022158
      ],
      [
        116.2823,
        40.022097
      ],
      [
        116.282097,
        40.022065
      ],
      [
        116.281625,
        40.021959
      ],
      [
        116.281316,
        40.021871
      ],
      [
        116.281045,
        40.021775
      ],
      [
        116.280749,
        40.021653
      ],
      [
        116.280119,
        40.021335
      ],
      [
        116.27993,
        40.021239
      ],
      [
        116.279926,
        40.021243
      ]
    ]
  },
  {
    "segment_id": "S-03-16",
    "name": "知春里路口-北语东门",
    "from_node": "N03",
    "to_node": "N16",
    "road_type": "main",
    "length_m": 495,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C03",
      "C16"
    ],
    "traffic_flow": 719,
    "avg_speed": 30,
    "risk_score": 41,
    "status": "busy",
    "path": [
      [
        116.279926,
        40.021243
      ],
      [
        116.27993,
        40.021239
      ],
      [
        116.278662,
        40.020597
      ],
      [
        116.278211,
        40.020382
      ],
      [
        116.277779,
        40.020248
      ],
      [
        116.277377,
        40.020164
      ],
      [
        116.276599,
        40.020055
      ]
    ]
  },
  {
    "segment_id": "S-06-07",
    "name": "中关村大街-丹棱街-科学院南路路口",
    "from_node": "N06",
    "to_node": "N07",
    "road_type": "main",
    "length_m": 287,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C06",
      "C07"
    ],
    "traffic_flow": 1194,
    "avg_speed": 25,
    "risk_score": 60,
    "status": "risk",
    "path": [
      [
        116.283883,
        40.022318
      ],
      [
        116.283878,
        40.022317
      ],
      [
        116.283822,
        40.022549
      ],
      [
        116.282989,
        40.02597
      ],
      [
        116.282578,
        40.027039
      ]
    ]
  },
  {
    "segment_id": "S-10-24",
    "name": "中关村一桥-矿大东门",
    "from_node": "N10",
    "to_node": "N24",
    "road_type": "main",
    "length_m": 250,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C10",
      "C24"
    ],
    "traffic_flow": 450,
    "avg_speed": 31,
    "risk_score": 75,
    "status": "risk",
    "path": [
      [
        116.284624,
        40.028713
      ],
      [
        116.283519,
        40.028635
      ],
      [
        116.283379,
        40.0286
      ],
      [
        116.28245,
        40.028601
      ],
      [
        116.281435,
        40.028545
      ],
      [
        116.281542,
        40.027662
      ],
      [
        116.281529,
        40.027661
      ]
    ]
  },
  {
    "segment_id": "S-24-20",
    "name": "矿大东门-六道口",
    "from_node": "N24",
    "to_node": "N20",
    "road_type": "main",
    "length_m": 645,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C24",
      "C20"
    ],
    "traffic_flow": 668,
    "avg_speed": 54,
    "risk_score": 74,
    "status": "risk",
    "path": [
      [
        116.281529,
        40.027661
      ],
      [
        116.280709,
        40.0276
      ],
      [
        116.280659,
        40.027621
      ],
      [
        116.280629,
        40.027698
      ],
      [
        116.280525,
        40.028474
      ],
      [
        116.279624,
        40.028403
      ],
      [
        116.27941,
        40.02835
      ],
      [
        116.278329,
        40.027796
      ],
      [
        116.2783,
        40.027781
      ],
      [
        116.276947,
        40.027086
      ],
      [
        116.275607,
        40.026389
      ],
      [
        116.275552,
        40.026361
      ],
      [
        116.27556,
        40.026352
      ]
    ]
  },
  {
    "segment_id": "S-20-26",
    "name": "六道口-知春路中段",
    "from_node": "N20",
    "to_node": "N26",
    "road_type": "main",
    "length_m": 407,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C20",
      "C26"
    ],
    "traffic_flow": 849,
    "avg_speed": 45,
    "risk_score": 25,
    "status": "normal",
    "path": [
      [
        116.27556,
        40.026352
      ],
      [
        116.275552,
        40.026361
      ],
      [
        116.274997,
        40.026089
      ],
      [
        116.274853,
        40.026009
      ],
      [
        116.274479,
        40.025813
      ],
      [
        116.274123,
        40.025629
      ],
      [
        116.273973,
        40.025554
      ],
      [
        116.273673,
        40.025389
      ],
      [
        116.273531,
        40.025311
      ],
      [
        116.273329,
        40.025202
      ],
      [
        116.272571,
        40.024805
      ]
    ]
  },
  {
    "segment_id": "S-08-25",
    "name": "蓟门桥北-海淀南路中段",
    "from_node": "N08",
    "to_node": "N25",
    "road_type": "main",
    "length_m": 358,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C08",
      "C25"
    ],
    "traffic_flow": 120,
    "avg_speed": 47,
    "risk_score": 1,
    "status": "normal",
    "path": [
      [
        116.266973,
        40.031106
      ],
      [
        116.266955,
        40.031127
      ],
      [
        116.268203,
        40.031361
      ],
      [
        116.270644,
        40.031818
      ],
      [
        116.271156,
        40.031918
      ],
      [
        116.271156,
        40.031917
      ]
    ]
  },
  {
    "segment_id": "S-16-26",
    "name": "北语东门-知春路中段",
    "from_node": "N16",
    "to_node": "N26",
    "road_type": "main",
    "length_m": 308,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C16",
      "C26"
    ],
    "traffic_flow": 543,
    "avg_speed": 29,
    "risk_score": 55,
    "status": "busy",
    "path": [
      [
        116.276599,
        40.020055
      ],
      [
        116.276595,
        40.020054
      ],
      [
        116.27644,
        40.020041
      ],
      [
        116.274961,
        40.021689
      ],
      [
        116.274782,
        40.021896
      ],
      [
        116.274717,
        40.021971
      ],
      [
        116.274638,
        40.022062
      ],
      [
        116.27296,
        40.023995
      ],
      [
        116.272743,
        40.024454
      ],
      [
        116.272481,
        40.024759
      ],
      [
        116.272563,
        40.024801
      ],
      [
        116.272571,
        40.024805
      ]
    ]
  },
  {
    "segment_id": "S-04-03",
    "name": "西土城路口-知春里路口",
    "from_node": "N04",
    "to_node": "N03",
    "road_type": "main",
    "length_m": 711,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C04",
      "C03"
    ],
    "traffic_flow": 667,
    "avg_speed": 37,
    "risk_score": 36,
    "status": "busy",
    "path": [
      [
        116.279798,
        40.023145
      ],
      [
        116.279979,
        40.02246
      ],
      [
        116.279238,
        40.022084
      ],
      [
        116.279926,
        40.021243
      ]
    ]
  },
  {
    "segment_id": "S-12-04",
    "name": "学院桥-西土城路口",
    "from_node": "N12",
    "to_node": "N04",
    "road_type": "main",
    "length_m": 255,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C12",
      "C04"
    ],
    "traffic_flow": 116,
    "avg_speed": 56,
    "risk_score": 85,
    "status": "danger",
    "path": [
      [
        116.278821,
        40.025643
      ],
      [
        116.278828,
        40.025647
      ],
      [
        116.27939,
        40.025007
      ],
      [
        116.279003,
        40.02481
      ],
      [
        116.278593,
        40.024595
      ],
      [
        116.278998,
        40.024108
      ],
      [
        116.279797,
        40.02315
      ],
      [
        116.279798,
        40.023145
      ]
    ]
  },
  {
    "segment_id": "S-03-20",
    "name": "知春里路口-六道口",
    "from_node": "N03",
    "to_node": "N20",
    "road_type": "main",
    "length_m": 566,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C03",
      "C20"
    ],
    "traffic_flow": 170,
    "avg_speed": 42,
    "risk_score": 53,
    "status": "busy",
    "path": [
      [
        116.279926,
        40.021243
      ],
      [
        116.279238,
        40.022084
      ],
      [
        116.278762,
        40.022666
      ],
      [
        116.27811,
        40.023461
      ],
      [
        116.277952,
        40.023637
      ],
      [
        116.277572,
        40.02406
      ],
      [
        116.276905,
        40.024803
      ],
      [
        116.276632,
        40.025109
      ],
      [
        116.27556,
        40.026352
      ]
    ]
  },
  {
    "segment_id": "S-26-08",
    "name": "知春路中段-蓟门桥北",
    "from_node": "N26",
    "to_node": "N08",
    "road_type": "main",
    "length_m": 521,
    "lane_count": 4,
    "speed_limit": 60,
    "base_risk": 0,
    "camera_ids": [
      "C26",
      "C08"
    ],
    "traffic_flow": 323,
    "avg_speed": 31,
    "risk_score": 82,
    "status": "danger",
    "path": [
      [
        116.272571,
        40.024805
      ],
      [
        116.272563,
        40.024801
      ],
      [
        116.272481,
        40.024759
      ],
      [
        116.271163,
        40.026254
      ],
      [
        116.27041,
        40.027104
      ],
      [
        116.270371,
        40.02718
      ],
      [
        116.268017,
        40.029902
      ],
      [
        116.267211,
        40.03084
      ],
      [
        116.266973,
        40.031106
      ]
    ]
  }
];
