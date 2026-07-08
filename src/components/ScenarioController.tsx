import { scenarioTimeline } from "../data/scenarioTimeline";

interface ScenarioControllerProps {
  currentStepIndex: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onJump: (index: number) => void;
}

export function ScenarioController({
  currentStepIndex,
  isPlaying,
  onPlay,
  onPause,
  onReset,
  onNext,
  onPrevious,
  onJump,
}: ScenarioControllerProps) {
  const current = scenarioTimeline[currentStepIndex];

  return (
    <section className="scenario-controller">
      <div>
        <p className="eyebrow">Scenario Timeline</p>
        <h2>科技园区道路测试场景</h2>
        <p className="scenario-desc">{current.description}</p>
      </div>
      <div className="scenario-actions">
        {isPlaying ? <button onClick={onPause}>暂停</button> : <button onClick={onPlay}>播放</button>}
        <button onClick={onReset}>重置</button>
        <button onClick={onPrevious}>上一步</button>
        <button onClick={onNext}>下一步</button>
        <label>
          跳转
          <select value={currentStepIndex} onChange={(event) => onJump(Number(event.target.value))}>
            {scenarioTimeline.map((step, index) => (
              <option key={step.time_sec} value={index}>
                T{index} · {String(step.time_sec).padStart(2, "0")}s
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="timeline-rail">
        {scenarioTimeline.map((step, index) => (
          <button
            key={step.time_sec}
            className={index <= currentStepIndex ? "active" : ""}
            onClick={() => onJump(index)}
            title={step.description}
          >
            {step.time_sec}s
          </button>
        ))}
      </div>
    </section>
  );
}
