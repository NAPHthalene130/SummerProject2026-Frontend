import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  createMobileUser,
  deleteMobileUser,
  fetchMobileUsers,
  updateMobileUser,
  type MobileUserItem,
} from "../api/client";


type EditorMode = "create" | "edit";

interface EditorState {
  mode: EditorMode;
  user: MobileUserItem | null;
}

interface UserFormValues {
  userName: string;
  phone: string;
  personnelCategory: string;
  site: string;
  password: string;
  confirmPassword: string;
}

const emptyForm: UserFormValues = {
  userName: "",
  phone: "",
  personnelCategory: "traffic_police",
  site: "",
  password: "",
  confirmPassword: "",
};

export function UserPage() {
  const [users, setUsers] = useState<MobileUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [deletingUser, setDeletingUser] = useState<MobileUserItem | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUsers(await fetchMobileUsers());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "用户数据加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  const handleSaved = (savedUser: MobileUserItem, mode: EditorMode) => {
    setUsers((current) => {
      if (mode === "create") return [...current, savedUser].sort((a, b) => a.user_id - b.user_id);
      return current.map((user) => user.user_id === savedUser.user_id ? savedUser : user);
    });
    setEditor(null);
    showNotice(mode === "create" ? "用户创建成功" : "用户信息已更新");
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    try {
      await deleteMobileUser(deletingUser.user_id);
      setUsers((current) => current.filter((user) => user.user_id !== deletingUser.user_id));
      setDeletingUser(null);
      showNotice("用户已删除");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "删除用户失败");
      setDeletingUser(null);
    }
  };

  return (
    <section className="user-management-page">
      <div className="user-page-frame">
        <header className="user-page-header">
          <div>
            <span className="user-page-kicker">MOBILE PERSONNEL</span>
            <h1>移动端用户管理</h1>
            <p>查看可接收工单的手机端工作人员，维护手机号、人员类别与所属站点。</p>
          </div>
          <div className="user-header-actions">
            <div className={`database-state ${error ? "error" : "ready"}`}>
              <i aria-hidden="true" />
              <span>{error ? "数据库连接异常" : loading ? "正在同步数据库" : "数据库已同步"}</span>
              <strong>{loading ? "--" : `${users.length} 位用户`}</strong>
            </div>
            <button className="primary-user-button" onClick={() => setEditor({ mode: "create", user: null })}>
              创建用户
            </button>
          </div>
        </header>

        {error ? (
          <div className="user-error-state" role="alert">
            <div>
              <strong>无法获取用户数据</strong>
              <span>{error}</span>
            </div>
            <button onClick={() => void loadUsers()}>重新加载</button>
          </div>
        ) : null}

        <section className="user-list-panel" aria-busy={loading}>
          <div className="user-list-heading">
            <div>
              <h2>用户目录</h2>
              <span>按用户 ID 排列</span>
            </div>
            <button className="refresh-users-button" disabled={loading} onClick={() => void loadUsers()}>
              {loading ? "同步中" : "刷新数据"}
            </button>
          </div>

          <div className="user-table-scroll">
            <table className="user-table">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">姓名</th>
                  <th scope="col">手机号</th>
                  <th scope="col">人员类别</th>
                  <th scope="col">所属站点</th>
                  <th scope="col"><span className="sr-only">操作</span></th>
                </tr>
              </thead>
              <tbody>
                {loading ? <UserTableSkeleton /> : null}
                {!loading && !error ? users.map((user) => (
                  <tr key={user.user_id}>
                    <td data-label="ID"><span className="user-id-cell">#{String(user.user_id).padStart(4, "0")}</span></td>
                    <td data-label="姓名">
                      <div className="user-name-cell">
                        <strong>{user.name}</strong>
                      </div>
                    </td>
                    <td data-label="手机号"><span className="user-role-cell">{user.phone || "未填写"}</span></td>
                    <td data-label="人员类别"><span className="user-role-cell">{user.role_name}</span></td>
                    <td data-label="所属站点"><span className="user-role-cell">{user.site || "未填写"}</span></td>
                    <td data-label="操作">
                      <div className="user-row-actions">
                        <button onClick={() => setEditor({ mode: "edit", user })}>修改</button>
                        <button className="delete-user-button" onClick={() => setDeletingUser(user)}>删除</button>
                      </div>
                    </td>
                  </tr>
                )) : null}
              </tbody>
            </table>
          </div>

          {!loading && !error && users.length === 0 ? (
            <div className="user-empty-state">
              <strong>还没有手机端工作人员</strong>
              <span>创建账号后，工作人员可以在移动端登录并接收工单。</span>
              <button onClick={() => setEditor({ mode: "create", user: null })}>创建手机端用户</button>
            </div>
          ) : null}
        </section>
      </div>

      {editor ? (
        <UserEditor
          mode={editor.mode}
          user={editor.user}
          onClose={() => setEditor(null)}
          onSaved={handleSaved}
        />
      ) : null}

      {deletingUser ? (
        <DeleteUserDialog
          user={deletingUser}
          onCancel={() => setDeletingUser(null)}
          onConfirm={() => void handleDelete()}
        />
      ) : null}

      {notice ? <div className="user-operation-toast" role="status">{notice}</div> : null}
    </section>
  );
}

function UserTableSkeleton() {
  return (
    <>
      {[0, 1, 2, 3].map((row) => (
        <tr className="user-skeleton-row" key={row}>
          <td><span /></td>
          <td><span /></td>
          <td><span /></td>
          <td><span /></td>
          <td><span /></td>
          <td><span /></td>
        </tr>
      ))}
    </>
  );
}

function UserEditor({
  mode,
  user,
  onClose,
  onSaved,
}: {
  mode: EditorMode;
  user: MobileUserItem | null;
  onClose: () => void;
  onSaved: (user: MobileUserItem, mode: EditorMode) => void;
}) {
  const [values, setValues] = useState<UserFormValues>(() => user ? {
    userName: user.name,
    phone: user.phone,
    personnelCategory: user.personnel_category,
    site: user.site,
    password: "",
    confirmPassword: "",
  } : emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field: keyof UserFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");

    const userName = values.userName.trim();
    const phone = values.phone.trim();
    if (!userName || !phone) {
      setFormError("请填写姓名和手机号");
      return;
    }
    if (mode === "create" && !values.password) {
      setFormError("请填写密码");
      return;
    }
    if (values.password && values.password.length < 8) {
      setFormError("密码至少需要 8 个字符");
      return;
    }
    if (values.password !== values.confirmPassword) {
      setFormError("两次输入的密码不一致");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: userName,
        phone,
        personnel_category: values.personnelCategory,
        site: values.site.trim(),
        ...(values.password ? { password: values.password } : {}),
      };
      const savedUser = mode === "create"
        ? await createMobileUser({ ...payload, password: values.password })
        : await updateMobileUser(user!.user_id, payload);
      onSaved(savedUser, mode);
    } catch (requestError) {
      setFormError(requestError instanceof Error ? requestError.message : "保存用户失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="user-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="user-editor-dialog" role="dialog" aria-modal="true" aria-labelledby="user-editor-title">
        <div className="user-dialog-heading">
          <div>
            <span>{mode === "create" ? "新增手机端账号" : `手机端用户 #${user?.user_id}`}</span>
            <h2 id="user-editor-title">{mode === "create" ? "创建手机端用户" : "修改手机端用户"}</h2>
          </div>
          <button type="button" aria-label="关闭" onClick={onClose}>关闭</button>
        </div>

        <form className="user-editor-form" onSubmit={(event) => void submit(event)}>
          <label>
            <span>姓名</span>
            <input
              autoFocus
              autoComplete="username"
              maxLength={255}
              value={values.userName}
              onChange={(event) => updateField("userName", event.target.value)}
              placeholder="请输入工作人员姓名"
            />
          </label>
          <label>
            <span>手机号</span>
            <input
              maxLength={32}
              value={values.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder="请输入移动端登录手机号"
            />
          </label>
          <label>
            <span>人员类别</span>
            <select value={values.personnelCategory} onChange={(event) => updateField("personnelCategory", event.target.value)}>
              <option value="traffic_police">交警执法</option>
              <option value="road_maintenance">道路养护</option>
              <option value="municipal_facilities">市政设施</option>
              <option value="vehicle_rescue">清障救援</option>
              <option value="traffic_coordination">交通疏导</option>
              <option value="emergency_fire">应急消防</option>
            </select>
          </label>
          <label>
            <span>所属站点</span>
            <input
              maxLength={255}
              value={values.site}
              onChange={(event) => updateField("site", event.target.value)}
              placeholder="例如：海淀交通支队"
            />
          </label>
          <label>
            <span>{mode === "create" ? "密码" : "新密码（可选）"}</span>
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              value={values.password}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder={mode === "create" ? "至少 8 个字符" : "留空则不修改密码"}
            />
            <small>密码将在服务端使用 Argon2id 哈希后存储。</small>
          </label>
          <label>
            <span>确认密码</span>
            <input
              type="password"
              autoComplete="new-password"
              minLength={values.password ? 8 : undefined}
              maxLength={128}
              value={values.confirmPassword}
              onChange={(event) => updateField("confirmPassword", event.target.value)}
              placeholder="请再次输入密码"
            />
          </label>

          {formError ? <div className="user-form-error" role="alert">{formError}</div> : null}

          <div className="user-form-actions">
            <button type="button" onClick={onClose}>取消</button>
            <button className="primary-user-button" type="submit" disabled={submitting}>
              {submitting ? "正在保存" : mode === "create" ? "创建手机端用户" : "保存修改"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteUserDialog({
  user,
  onCancel,
  onConfirm,
}: {
  user: MobileUserItem;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="user-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <div className="delete-user-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-user-title">
        <span>删除用户</span>
        <h2 id="delete-user-title">确认删除“{user.name}”？</h2>
        <p>此操作会删除该工作人员的移动端登录账号，且无法撤销。</p>
        <div className="user-form-actions">
          <button onClick={onCancel}>取消</button>
          <button className="confirm-delete-user-button" onClick={onConfirm}>确认删除</button>
        </div>
      </div>
    </div>
  );
}
