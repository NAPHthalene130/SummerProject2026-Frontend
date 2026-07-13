import { FormEvent, useState } from "react";
import { createUser, loginUser, type UserItem } from "../api/client";

type AuthMode = "login" | "register";

const USER_TYPES = [
  { value: "admin", label: "系统管理员" },
  { value: "dispatcher", label: "调度人员" },
  { value: "reviewer", label: "审核人员" },
];

export function AuthPage({ onAuthenticated }: { onAuthenticated: (user: UserItem) => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState("dispatcher");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = userName.trim();
    if (!normalizedName) {
      setError("请输入用户名");
      return;
    }
    if (password.length < (mode === "register" ? 8 : 1)) {
      setError(mode === "register" ? "密码至少需要 8 位" : "请输入密码");
      return;
    }
    if (mode === "register" && password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      if (mode === "register") {
        await createUser({ user_name: normalizedName, user_type: userType, password });
      }
      const user = await loginUser({ user_name: normalizedName, password });
      onAuthenticated(user);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "认证服务暂时不可用");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-identity" aria-label="系统介绍">
        <div className="auth-brand-row">
          <span className="auth-brand-mark">路</span>
          <div><strong>智慧路政巡检分析系统</strong><small>ROAD INSPECTION COMMAND CENTER</small></div>
        </div>
        <div className="auth-intro">
          <span className="auth-kicker">TRAFFIC OPERATIONS / 2026</span>
          <h1>看清道路状态，<br />让处置更快一步。</h1>
          <p>统一接入道路风险、实时监控与移动工单，为交通管理人员提供连续、可信的事件处置环境。</p>
        </div>
        <div className="auth-signal-grid" aria-label="系统状态">
          <div><span>服务状态</span><strong><i />在线</strong></div>
          <div><span>数据通道</span><strong>实时同步</strong></div>
          <div><span>访问区域</span><strong>管理内网</strong></div>
        </div>
        <footer>北京交通大学 · 智慧交通联合实验项目</footer>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="auth-mode-switch" aria-label="认证方式">
            <button className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>登录</button>
            <button className={mode === "register" ? "active" : ""} onClick={() => switchMode("register")}>注册</button>
          </div>
          <header className="auth-form-head">
            <span>{mode === "login" ? "WELCOME BACK" : "CREATE ACCOUNT"}</span>
            <h2>{mode === "login" ? "登录管理工作台" : "创建管理端账号"}</h2>
            <p>{mode === "login" ? "使用已分配的账号继续处理道路事件。" : "注册后将直接进入系统，账号信息由用户管理页统一维护。"}</p>
          </header>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label>
              <span>用户名</span>
              <input autoComplete="username" value={userName} onChange={(event) => setUserName(event.target.value)} placeholder="输入用户名" />
            </label>
            {mode === "register" ? (
              <label>
                <span>岗位权限</span>
                <select value={userType} onChange={(event) => setUserType(event.target.value)}>
                  {USER_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </label>
            ) : null}
            <label>
              <span>密码</span>
              <div className="auth-password-field">
                <input type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "register" ? "至少 8 位" : "输入密码"} />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "隐藏" : "显示"}</button>
              </div>
            </label>
            {mode === "register" ? (
              <label>
                <span>确认密码</span>
                <input type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="再次输入密码" />
              </label>
            ) : null}
            <div className={`auth-form-message ${error ? "error" : ""}`} role="status">
              {error || (mode === "register" ? "密码将使用安全哈希保存。" : "登录即表示你已获授权访问管理数据。")}
            </div>
            <button className="auth-submit" type="submit" disabled={submitting}>
              <span>{submitting ? "正在验证" : mode === "login" ? "进入工作台" : "注册并进入"}</span><b aria-hidden="true">→</b>
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
