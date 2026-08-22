// ============================================================
// 天命·国策 — OSS 纯静态版适配脚本
// 作用：模拟登录、移除所有后端 API 依赖、云存档改为 localStorage
// 在 game.js + app.js 之后加载
// ============================================================

// ------ 1. 模拟用户 ------
window.currentUser = {
  id: 1,
  username: '本地帝王',
  is_admin: false,
  avatar_color: '#c9a84c'
};
// 注意：app.js 里已声明 let currentUser，这里不要重复声明，直接赋值
currentUser = window.currentUser;

// ------ 2. 所有 API 调用降级为 mock ------
async function api(path, options = {}) {
  // 游戏相关 API：在 OSS 版全部 mock 或禁用
  if (path === '/api/game/save' && options.method === 'POST') return { ok: true };
  if (path === '/api/game/save') return { save: null, updated_at: null };
  if (path === '/api/me') return { user: window.currentUser };
  if (path === '/api/login' || path === '/api/register' || path === '/api/logout') return { message: 'OSS 纯静态版不支持账号系统，请使用本地存档' };
  // 其他（社区/管理后台）：静默返回空
  return {};
}

// ------ 3. 本地存档（替代云存档） ------
const SAVE_KEY = 'tm_oss_save_v1';

function localSave() {
  if (!G) { addNotif('请先开始游戏', 'bad'); return; }
  try {
    const plain = JSON.parse(JSON.stringify(G, (k, v) => typeof v === 'function' ? undefined : v));
    localStorage.setItem(SAVE_KEY, JSON.stringify(plain));
    addNotif('💾 本地存档成功（浏览器 localStorage）', 'good');
    document.getElementById('save-status').textContent = '已存档 ' + new Date().toLocaleTimeString('zh-CN');
  } catch (e) { addNotif('存档失败：' + e.message, 'bad'); }
}

function localLoad() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      // 没有本地档也没关系，直接开新档
      addNotif('浏览器中暂无存档，已开启新朝', 'info');
      startNewGame();
      return;
    }
    loadFromPlain(JSON.parse(raw));
    addNotif('📂 本地档读取成功', 'good');
  } catch (e) { addNotif('读档失败：' + e.message, 'bad'); }
}

// 导出 JSON 沿用 game.js 中已有的 exportSave() 函数

// ------ 4. 兼容原按钮绑定（app.js 可能还引用 cloudSave/cloudLoad） ------
function cloudSave() { localSave(); }
function cloudLoad() { localLoad(); }

// ------ 5. 启动应用（替代 app.js 的 init()） ------
(async function ossInit() {
  // 等待 app.js / game.js 中的基础函数准备好
  const waitReady = () => new Promise((res) => {
    const check = () => {
      if (typeof updateAll === 'function' && typeof startNewGame === 'function' && typeof switchPanel === 'function') res();
      else setTimeout(check, 50);
    };
    check();
  });

  await waitReady();

  // 直接进入主应用界面
  try {
    document.getElementById('auth-screen').style.display = 'none';
    const appEl = document.getElementById('app');
    if (appEl) appEl.style.display = 'flex';
  } catch (e) {}

  // 用户信息占位（尽管 UI 上隐藏了，填充下避免 app.js 里有报错）
  try {
    const nameEl = document.getElementById('user-name');
    if (nameEl) nameEl.textContent = window.currentUser.username;
    const av = document.getElementById('user-avatar');
    if (av) {
      av.textContent = '帝';
      av.style.background = window.currentUser.avatar_color;
    }
  } catch (e) {}

  // 载入游戏：优先浏览器本地档，否则开新档
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) {
    try {
      loadFromPlain(JSON.parse(raw));
      const st = document.getElementById('save-status');
      if (st) st.textContent = '本地档已加载';
    } catch (e) {
      startNewGame();
    }
  } else {
    startNewGame();
  }

  try { switchView('game'); } catch (e) {}
})();
