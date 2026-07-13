import { useEffect, useMemo, useState } from "react";
import {
  applyScenarioSteps,
  getScenarioEvents,
  getScenarioWorkOrders,
  scenarioTimeline,
} from "../data/scenarioTimeline";
// 【修改点1】：导入新生成的海淀区数据
import {
  haidianCameras,
  haidianNodes,
  haidianSegments,
} from "../data/haidianRoadNetwork";

export function useScenarioPlayback() {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setStepIndex((previous) => {
        if (previous >= scenarioTimeline.length - 1) {
          setIsPlaying(false);
          return previous;
        }
        return previous + 1;
      });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const state = useMemo(() => {
    const current = scenarioTimeline[stepIndex];
    return {
      currentStepIndex: stepIndex,
      currentTimeSec: current.time_sec,
      currentDescription: current.description,
      // 【修改点2】：将状态替换为海淀区数据
      nodes: haidianNodes,
      segments: applyScenarioSteps(haidianSegments, stepIndex),
      cameras: haidianCameras,
      events: getScenarioEvents(stepIndex),
      workOrders: getScenarioWorkOrders(stepIndex),
    };
  }, [stepIndex]);

  return {
    ...state,
    isPlaying,
    play: () => setIsPlaying(true),
    pause: () => setIsPlaying(false),
    reset: () => {
      setIsPlaying(false);
      setStepIndex(0);
    },
    next: () => setStepIndex((previous) => Math.min(previous + 1, scenarioTimeline.length - 1)),
    previous: () => setStepIndex((previous) => Math.max(previous - 1, 0)),
    jump: (index: number) => setStepIndex(Math.max(0, Math.min(index, scenarioTimeline.length - 1))),
  };
}
