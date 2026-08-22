// ============================================================
// 天命·国策 — 应用层：鉴权 / 社区 / 个人主页 / 管理后台 / 错误上报
// ============================================================

let TOKEN = localStorage.getItem('tm_token') || '';
// 声明为 let 并挂载到 window 供 game.js 读取
let currentUser = null;
window.currentUser = null;
let currentBoard = 'all';
let currentSort = 'new';
let currentPage = 1;
const likedPosts = new Set();

const BOARD_NAMES = { all:'全部帖子', general:'综合讨论', strategy:'游戏攻略', dynasty:'王朝风云', showoff:'战绩晒图', chat:'闲聊灌水', notice:'站务公告' };

// ---------------- 通用请求 ----------------
async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (TOKEN) headers['Authorization'] = 'Bearer ' + TOKEN;
  const res = await fetch(path, { ...options, headers });
  let data = {};
  try { data = await res.json(); } catch (e) {}
  if (!res.ok) throw new Error(data.error || `请求失败(${res.status})`);
  return data;
}

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function timeAgo(t) {
  if (!t) return '—';
  const d = new Date(t.replace(' ', 'T'));
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
  if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
  if (diff < 86400 * 30) return Math.floor(diff / 86400) + '天前';
  return t.slice(0, 10);
}

// ---------------- 全局错误上报 ----------------
function reportError(message, stack, page) {
  try {
    fetch('/api/error-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': TOKEN ? 'Bearer ' + TOKEN : '' },
      body: JSON.stringify({ message: String(message).slice(0, 2000), stack: String(stack || '').slice(0, 4000), page: page || location.hash })
    });
  } catch (e) {}
}
window.addEventListener('error', e => reportError(e.message, e.error && e.error.stack, location.pathname));
window.addEventListener('unhandledrejection', e => reportError('Promise: ' + (e.reason && e.reason.message || e.reason), e.reason && e.reason.stack, location.pathname));

// ---------------- 认证 ----------------
function switchAuthTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('auth-form-login').style.display = tab === 'login' ? '' : 'none';
  document.getElementById('auth-form-register').style.display = tab === 'register' ? '' : 'none';
  document.getElementById('auth-msg').textContent = '';
}

function authMsg(text, ok) {
  const el = document.getElementById('auth-msg');
  el.textContent = text;
  el.style.color = ok ? 'var(--accent-green)' : 'var(--accent-red)';
}

async function doRegister() {
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;
  const password2 = document.getElementById('reg-password2').value;
  if (!username || !password) return authMsg('用户名和密码不能为空');
  if (password !== password2) return authMsg('两次输入的密码不一致');
  try {
    const data = await api('/api/register', { method: 'POST', body: JSON.stringify({ username, password }) });
    authMsg(data.message + '，正在跳转登录…', true);
    setTimeout(() => { switchAuthTab('login'); document.getElementById('login-username').value = username; }, 800);
  } catch (e) { authMsg(e.message); }
}

async function doLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  if (!username || !password) return authMsg('请输入用户名和密码');
  try {
    const data = await api('/api/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    TOKEN = data.token;
    localStorage.setItem('tm_token', TOKEN);
    currentUser = data.user;
    window.currentUser = data.user;
    await enterApp();
  } catch (e) { authMsg(e.message); }
}

async function doLogout() {
  try { await api('/api/logout', { method: 'POST' }); } catch (e) {}
  TOKEN = ''; currentUser = null; window.currentUser = null;
  localStorage.removeItem('tm_token');
  document.getElementById('app').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
}

async function enterApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  document.getElementById('user-name').textContent = currentUser.username;
  const av = document.getElementById('user-avatar');
  av.textContent = currentUser.username[0].toUpperCase();
  av.style.background = currentUser.avatar_color || '#c9a84c';
  document.getElementById('admin-nav-btn').style.display = currentUser.is_admin ? '' : 'none';

  // 通知轮询
  loadNotifBadge();
  setInterval(loadNotifBadge, 30000);

  // 载入游戏：优先云档
  try {
    const data = await api('/api/game/save');
    if (data.save) { loadFromPlain(JSON.parse(data.save)); document.getElementById('save-status').textContent = '云档 ' + (data.updated_at || ''); }
    else startNewGame();
  } catch (e) { startNewGame(); }
  switchView('game');
}

// ---------------- 视图切换 ----------------
function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.top-nav-btn').forEach(b => b.classList.remove('active'));
  const v = document.getElementById('view-' + name);
  if (v) v.classList.add('active');
  const b = document.querySelector(`.top-nav-btn[data-view="${name}"]`);
  if (b) b.classList.add('active');
  if (name === 'community') { loadPosts(); loadHotTags(); }
  if (name === 'profile') loadProfile(currentUser.id);
  if (name === 'admin') loadAdmin();
  if (name === 'game' && G) updateAll();
}

// ---------------- 社区 ----------------
function switchBoard(board) {
  currentBoard = board; currentPage = 1;
  document.querySelectorAll('.board-item').forEach(b => b.classList.toggle('active', b.dataset.board === board));
  document.getElementById('community-board-name').textContent = BOARD_NAMES[board] || '帖子';
  loadPosts();
}

function setSort(sort) {
  currentSort = sort; currentPage = 1;
  document.getElementById('sort-new').classList.toggle('btn-gold', sort === 'new');
  document.getElementById('sort-hot').classList.toggle('btn-gold', sort === 'hot');
  loadPosts();
}

async function loadPosts() {
  const list = document.getElementById('post-list');
  list.innerHTML = '<div class="text-dim text-center" style="padding:40px">加载中…</div>';
  try {
    const search = document.getElementById('search-input')?.value || '';
    let url = `/api/community/posts?board=${currentBoard}&sort=${currentSort}&page=${currentPage}`;
    if (search) url += `&q=${encodeURIComponent(search)}`;
    const data = await api(url);
    if (!data.posts.length) {
      list.innerHTML = '<div class="text-dim text-center" style="padding:60px">还没有帖子，来发第一帖吧 ✏</div>';
    } else {
      list.innerHTML = data.posts.map(p => {
        const tags = p.tags ? p.tags.split(',').filter(Boolean) : [];
        const tagHtml = tags.map(t => `<span class="post-tag" onclick="event.stopPropagation();searchByTag('${esc(t)}')">#${esc(t)}</span>`).join('');
        const featuredHtml = p.is_featured ? '<span class="featured-badge">📌 精选</span>' : '';
        return `
        <div class="post-card" onclick="openPostDetail(${p.id})">
          ${featuredHtml}
          <div class="post-head">
            <span class="avatar" style="background:${p.avatar_color};width:22px;height:22px;font-size:11px">${esc(p.username[0]).toUpperCase()}</span>
            <span style="font-size:12px">${esc(p.username)}</span>
            <span class="board-tag">${BOARD_NAMES[p.board] || p.board}</span>
            <span class="text-dim" style="font-size:11px;margin-left:auto">${timeAgo(p.created_at)}</span>
          </div>
          <div class="post-title">${esc(p.title)}</div>
          ${p.content ? `<div class="post-excerpt">${esc(p.content).slice(0, 150)}</div>` : ''}
          ${p.image ? `<img class="post-image" src="${p.image}" alt="">` : ''}
          ${p.link ? `<div class="text-dim" style="font-size:11px">🔗 ${esc(p.link).slice(0, 60)}</div>` : ''}
          ${tagHtml ? `<div class="post-tags-row">${tagHtml}</div>` : ''}
          <div class="post-meta">
            <span class="like-btn ${likedPosts.has(p.id) ? 'liked' : ''}" onclick="event.stopPropagation();toggleLike(${p.id},this)">❤ ${p.likes}</span>
            <span>💬 ${p.cmt_count}</span>
          </div>
        </div>`;
      }).join('');
    }
    // 分页
    const pg = document.getElementById('post-pagination');
    if (data.pages > 1) {
      let html = '';
      if (currentPage > 1) html += `<button class="btn btn-sm" onclick="goPage(${currentPage - 1})">上一页</button> `;
      html += `<span class="text-dim" style="margin:0 10px">${currentPage} / ${data.pages}</span>`;
      if (currentPage < data.pages) html += `<button class="btn btn-sm" onclick="goPage(${currentPage + 1})">下一页</button>`;
      pg.innerHTML = html;
    } else pg.innerHTML = '';
  } catch (e) {
    list.innerHTML = `<div class="text-red text-center" style="padding:40px">${esc(e.message)}</div>`;
  }
}

function goPage(p) { currentPage = p; loadPosts(); }

async function toggleLike(postId, el) {
  try {
    const data = await api(`/api/community/posts/${postId}/like`, { method: 'POST' });
    if (data.liked) likedPosts.add(postId); else likedPosts.delete(postId);
    loadPosts();
  } catch (e) { addNotif(e.message, 'bad'); }
}

// ---- 发帖 ----
let pendingImage = '';
function openPostEditor() {
  pendingImage = '';
  showModal('✏ 发布新帖', `
    <div class="post-editor">
      <select id="post-board">
        <option value="general">💬 综合讨论</option>
        <option value="strategy">📖 游戏攻略</option>
        <option value="dynasty">👑 王朝风云</option>
        <option value="showoff">🏆 战绩晒图</option>
        <option value="chat">🍵 闲聊灌水</option>
        ${currentUser.is_admin ? '<option value="notice">📢 站务公告</option>' : ''}
      </select>
      <input id="post-title" placeholder="标题（必填，最多100字）" maxlength="100">
      <textarea id="post-content" placeholder="正文内容（可选）… 支持纯文字分享"></textarea>
      <div>
        <label class="upload-btn">🖼 添加图片（≤3MB）<input type="file" accept="image/*" style="display:none" onchange="pickImage(this)"></label>
        <img id="post-image-preview" class="image-preview">
      </div>
      <input id="post-link" placeholder="🔗 附带网址（可选，如 https://…）">
      <input id="post-tags" placeholder="🏷 标签（逗号分隔，最多5个，如：洪武,开局,攻略）">
    </div>
  `, [
    { text: '发布', cls: 'btn-gold', fn: submitPost },
    { text: '取消', cls: '', fn: closeModal }
  ]);
  document.getElementById('post-board').value = currentBoard !== 'all' ? currentBoard : 'general';
}

function pickImage(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 3 * 1024 * 1024) { addNotif('图片不能超过3MB', 'bad'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    pendingImage = e.target.result;
    const img = document.getElementById('post-image-preview');
    img.src = pendingImage;
    img.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

async function submitPost() {
  const title = document.getElementById('post-title').value.trim();
  const content = document.getElementById('post-content').value;
  const link = document.getElementById('post-link').value.trim();
  const board = document.getElementById('post-board').value;
  const tagsRaw = document.getElementById('post-tags').value.trim();
  if (!title) { addNotif('标题不能为空', 'bad'); return; }
  const tags = tagsRaw ? tagsRaw.split(/[,，]/).map(t => t.trim()).filter(Boolean).slice(0, 5) : [];
  try {
    await api('/api/community/posts', { method: 'POST', body: JSON.stringify({ board, title, content, image: pendingImage, link, tags }) });
    closeModal();
    addNotif('📮 发布成功', 'good');
    currentPage = 1;
    loadPosts();
    loadHotTags();
  } catch (e) { addNotif(e.message, 'bad'); }
}

// ---- 帖子详情与评论 ----
async function openPostDetail(postId) {
  try {
    const data = await api(`/api/community/posts/${postId}`);
    const p = data.post;
    const linkHtml = p.link ? `<a class="post-link-card" href="${esc(p.link)}" target="_blank" rel="noopener">🔗 ${esc(p.link)}</a>` : '';
    showModal(p.title, `
      <div class="post-head" style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span class="avatar" style="background:${p.avatar_color};width:26px;height:26px;font-size:12px;cursor:pointer" onclick="closeModal();switchView('profile');loadProfile(${p.user_id})">${esc(p.username[0]).toUpperCase()}</span>
        <span style="cursor:pointer" onclick="closeModal();switchView('profile');loadProfile(${p.user_id})">${esc(p.username)}</span>
        <span class="board-tag">${BOARD_NAMES[p.board] || p.board}</span>
        <span class="text-dim" style="font-size:11px;margin-left:auto">${p.created_at}</span>
      </div>
      ${p.content ? `<div class="post-detail-content">${esc(p.content)}</div>` : ''}
      ${p.image ? `<img class="post-detail-image" src="${p.image}">` : ''}
      ${linkHtml}
      <div class="flex gap-4" style="margin:10px 0">
        <button class="btn btn-sm ${likedPosts.has(p.id) ? 'btn-red' : ''}" onclick="toggleLikeDetail(${p.id})">❤ 赞 ${p.likes}</button>
        <button class="btn btn-sm" onclick="toggleBookmark(${p.id})">⭐ 收藏</button>
        ${p.user_id !== currentUser.id ? `<button class="btn btn-sm" id="follow-btn-detail" onclick="toggleFollow(${p.user_id})">➕ 关注</button>` : ''}
        ${currentUser.is_admin ? `<button class="btn btn-sm" onclick="toggleFeature(${p.id})">📌 ${p.is_featured ? '取消精选' : '加精置顶'}</button>` : ''}
      </div>
      <div class="section-title">评论（${data.comments.length}）</div>
      <div style="max-height:240px;overflow-y:auto">
        ${data.comments.length ? data.comments.map(c => `
          <div class="comment-item">
            <div class="comment-head">
              <span class="avatar" style="background:${c.avatar_color};width:20px;height:20px;font-size:10px">${esc(c.username[0]).toUpperCase()}</span>
              <b>${esc(c.username)}</b>
              <span class="text-dim" style="margin-left:auto">${timeAgo(c.created_at)}</span>
            </div>
            <div>${esc(c.content)}</div>
          </div>`).join('') : '<div class="text-dim" style="padding:12px">暂无评论，来抢沙发～</div>'}
      </div>
      <div class="comment-input-wrap">
        <textarea id="comment-input" placeholder="写下你的评论…（最多2000字）"></textarea>
        <button class="btn btn-gold" style="align-self:flex-end" onclick="submitComment(${p.id})">评论</button>
      </div>
    `, [{ text: '返回列表', cls: '', fn: () => { closeModal(); loadPosts(); } }]);
  } catch (e) { addNotif(e.message, 'bad'); }
}

async function toggleLikeDetail(postId) {
  try {
    const data = await api(`/api/community/posts/${postId}/like`, { method: 'POST' });
    if (data.liked) likedPosts.add(postId); else likedPosts.delete(postId);
    openPostDetail(postId);
  } catch (e) { addNotif(e.message, 'bad'); }
}

async function submitComment(postId) {
  const input = document.getElementById('comment-input');
  const content = input.value.trim();
  if (!content) return;
  try {
    await api(`/api/community/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content }) });
    openPostDetail(postId);
  } catch (e) { addNotif(e.message, 'bad'); }
}

// ---------------- 个人主页 ----------------
async function loadProfile(uid) {
  const el = document.getElementById('profile-content');
  el.innerHTML = '<div class="text-dim text-center" style="padding:40px">加载中…</div>';
  try {
    const data = await api(`/api/community/user/${uid}`);
    const u = data.profile;
    const totalLikes = data.posts.reduce((s, p) => s + p.likes, 0);
    el.innerHTML = `
      <div class="profile-header">
        <span class="avatar" style="background:${u.avatar_color}">${esc(u.username[0]).toUpperCase()}</span>
        <div>
          <div style="font-size:18px;color:var(--text-bright);font-weight:bold">${esc(u.username)} ${u.is_admin ? '<span class="board-tag">管理员</span>' : ''}</div>
          <div class="text-dim" style="font-size:12px">加入于 ${u.created_at.slice(0, 10)}</div>
        </div>
        <div class="profile-stats" style="margin-left:auto">
          <div><b>${data.posts.length}</b>帖子</div>
          <div><b>${data.comments.length}</b>评论</div>
          <div><b>${totalLikes}</b>获赞</div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">TA 的帖子</div>
        ${data.posts.length ? `<table>
          <tr><th>标题</th><th>板块</th><th>赞</th><th>评论</th><th>时间</th></tr>
          ${data.posts.map(p => `<tr class="clickable" onclick="openPostDetail(${p.id})">
            <td class="text-gold">${esc(p.title)}</td>
            <td class="text-dim">${BOARD_NAMES[p.board] || p.board}</td>
            <td>${p.likes}</td><td>${p.comment_count}</td>
            <td class="text-dim">${timeAgo(p.created_at)}</td>
          </tr>`).join('')}
        </table>` : '<div class="text-dim">还没有发过帖子</div>'}
      </div>
      <div class="card">
        <div class="card-header">TA 的评论</div>
        ${data.comments.length ? data.comments.map(c => `
          <div class="comment-item">
            <div class="text-dim" style="font-size:11px;margin-bottom:2px">在 <span class="text-gold" style="cursor:pointer" onclick="openPostDetail(${c.post_id})">《${esc(c.post_title)}》</span> · ${timeAgo(c.created_at)}</div>
            <div>${esc(c.content)}</div>
          </div>`).join('') : '<div class="text-dim">还没有发过评论</div>'}
      </div>`;
  } catch (e) { el.innerHTML = `<div class="text-red text-center" style="padding:40px">${esc(e.message)}</div>`; }
}

// ---------------- 社区增强：搜索/标签/收藏/关注/通知/精选 ----------------

// 搜索
function doSearch() {
  currentPage = 1;
  loadPosts();
}

// 按标签筛选
function searchByTag(tag) {
  document.getElementById('search-input').value = '';
  currentBoard = 'all';
  document.querySelectorAll('.board-item').forEach(b => b.classList.toggle('active', b.dataset.board === 'all'));
  const list = document.getElementById('post-list');
  list.innerHTML = '<div class="text-dim text-center" style="padding:40px">加载中…</div>';
  api(`/api/community/posts?board=all&sort=new&page=1&tag=${encodeURIComponent(tag)}`).then(data => {
    document.getElementById('community-board-name').textContent = `#${tag}`;
    if (!data.posts.length) {
      list.innerHTML = `<div class="text-dim text-center" style="padding:60px">没有带 #${esc(tag)} 标签的帖子</div>`;
    } else {
      list.innerHTML = data.posts.map(p => `
        <div class="post-card" onclick="openPostDetail(${p.id})">
          <div class="post-head">
            <span class="avatar" style="background:${p.avatar_color};width:22px;height:22px;font-size:11px">${esc(p.username[0]).toUpperCase()}</span>
            <span style="font-size:12px">${esc(p.username)}</span>
            <span class="board-tag">${BOARD_NAMES[p.board] || p.board}</span>
          </div>
          <div class="post-title">${esc(p.title)}</div>
          <div class="post-meta"><span>❤ ${p.likes}</span><span>💬 ${p.cmt_count}</span></div>
        </div>`).join('');
    }
    document.getElementById('post-pagination').innerHTML = '';
  }).catch(e => addNotif(e.message, 'bad'));
}

// 热门标签
async function loadHotTags() {
  try {
    const data = await api('/api/community/tags');
    const el = document.getElementById('hot-tags');
    if (!el) return;
    el.innerHTML = data.tags.length ? data.tags.map(t =>
      `<span class="hot-tag" onclick="searchByTag('${esc(t.tag)}')">#${esc(t.tag)} <span class="text-dim">${t.n}</span></span>`
    ).join('') : '<div class="text-dim" style="font-size:11px">暂无标签</div>';
  } catch(e) {}
}

// 收藏
async function toggleBookmark(postId) {
  try {
    const data = await api(`/api/community/posts/${postId}/bookmark`, { method: 'POST' });
    addNotif(data.bookmarked ? '⭐ 已收藏' : '已取消收藏', data.bookmarked ? 'good' : '');
  } catch(e) { addNotif(e.message, 'bad'); }
}

// 收藏列表
async function loadBookmarks() {
  const list = document.getElementById('post-list');
  document.getElementById('community-board-name').textContent = '⭐ 我的收藏';
  document.querySelectorAll('.board-item').forEach(b => b.classList.remove('active'));
  list.innerHTML = '<div class="text-dim text-center" style="padding:40px">加载中…</div>';
  try {
    const data = await api('/api/community/bookmarks');
    if (!data.posts.length) {
      list.innerHTML = '<div class="text-dim text-center" style="padding:60px">还没有收藏过帖子</div>';
    } else {
      list.innerHTML = data.posts.map(p => `
        <div class="post-card" onclick="openPostDetail(${p.id})">
          <div class="post-head">
            <span class="avatar" style="background:${p.avatar_color};width:22px;height:22px;font-size:11px">${esc(p.username[0]).toUpperCase()}</span>
            <span style="font-size:12px">${esc(p.username)}</span>
            <span class="board-tag">${BOARD_NAMES[p.board] || p.board}</span>
          </div>
          <div class="post-title">${esc(p.title)}</div>
          <div class="post-meta"><span>❤ ${p.likes}</span><span>💬 ${p.cmt_count}</span></div>
        </div>`).join('');
    }
    document.getElementById('post-pagination').innerHTML = '';
  } catch(e) { addNotif(e.message, 'bad'); }
}

// 精选
async function loadFeatured() {
  const list = document.getElementById('post-list');
  document.getElementById('community-board-name').textContent = '📌 精选好帖';
  document.querySelectorAll('.board-item').forEach(b => b.classList.remove('active'));
  list.innerHTML = '<div class="text-dim text-center" style="padding:40px">加载中…</div>';
  try {
    const data = await api('/api/community/featured');
    if (!data.posts.length) {
      list.innerHTML = '<div class="text-dim text-center" style="padding:60px">暂无精选帖子</div>';
    } else {
      list.innerHTML = data.posts.map(p => `
        <div class="post-card" onclick="openPostDetail(${p.id})">
          <span class="featured-badge">📌 精选</span>
          <div class="post-head">
            <span class="avatar" style="background:${p.avatar_color};width:22px;height:22px;font-size:11px">${esc(p.username[0]).toUpperCase()}</span>
            <span style="font-size:12px">${esc(p.username)}</span>
            <span class="board-tag">${BOARD_NAMES[p.board] || p.board}</span>
          </div>
          <div class="post-title">${esc(p.title)}</div>
          <div class="post-meta"><span>❤ ${p.likes}</span><span>💬 ${p.cmt_count}</span></div>
        </div>`).join('');
    }
    document.getElementById('post-pagination').innerHTML = '';
  } catch(e) { addNotif(e.message, 'bad'); }
}

// 共治投票
async function loadPolls() {
  const list = document.getElementById('post-list');
  document.getElementById('community-board-name').textContent = '🗳 共治投票';
  document.querySelectorAll('.board-item').forEach(b => b.classList.remove('active'));
  list.innerHTML = '<div class="text-dim text-center" style="padding:40px">加载中…</div>';
  try {
    const data = await api('/api/community/polls');
    let html = `<div style="margin-bottom:12px"><button class="btn btn-gold" onclick="openPollEditor()">➕ 发起投票</button></div>`;
    if (!data.polls.length) {
      html += '<div class="text-dim text-center" style="padding:60px">还没有投票，来发起第一个吧</div>';
    } else {
      html += data.polls.map(p => {
        const maxCount = Math.max(1, ...p.counts);
        return `
        <div class="post-card">
          <div class="post-head">
            <span style="font-size:12px">🗳 ${esc(p.author)}</span>
            <span class="text-dim" style="font-size:11px;margin-left:auto">${timeAgo(p.created_at)} · ${p.total}票</span>
          </div>
          <div class="post-title">${esc(p.title)}</div>
          <div style="margin-top:8px">
            ${p.options.map((opt, i) => {
              const pct = p.total ? Math.round(p.counts[i] / p.total * 100) : 0;
              const isMine = p.myVote === i;
              const isLead = p.counts[i] === maxCount && p.total > 0;
              return `<div style="margin:6px 0;cursor:${p.myVote === null && !p.closed ? 'pointer' : 'default'}" onclick="votePoll(${p.id},${i})">
                <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px">
                  <span class="${isMine ? 'text-gold' : ''}">${isMine ? '✔ ' : ''}${esc(opt)}</span>
                  <span class="${isLead ? 'text-gold' : 'text-dim'}">${p.counts[i]}票 (${pct}%)</span>
                </div>
                <div style="height:6px;background:var(--bg-card);border-radius:3px;overflow:hidden">
                  <div style="height:100%;width:${pct}%;background:${isLead ? 'var(--gold)' : 'var(--border-light)'}"></div>
                </div>
              </div>`;
            }).join('')}
          </div>
          ${p.myVote === null && !p.closed ? '<div class="text-dim" style="font-size:11px;margin-top:4px">点击选项即可投票（每人一票）</div>' : ''}
        </div>`;
      }).join('');
    }
    list.innerHTML = html;
    document.getElementById('post-pagination').innerHTML = '';
  } catch(e) { list.innerHTML = `<div class="text-red text-center" style="padding:40px">${esc(e.message)}</div>`; }
}

async function votePoll(pollId, idx) {
  try {
    await api(`/api/community/polls/${pollId}/vote`, { method: 'POST', body: JSON.stringify({ option_idx: idx }) });
    addNotif('🗳 投票成功', 'good');
    loadPolls();
  } catch(e) { addNotif(e.message, 'bad'); }
}

function openPollEditor() {
  showModal('🗳 发起共治投票', `
    <input id="poll-title" placeholder="投票主题（如：下一步国策优先发展什么？）" maxlength="100">
    <input id="poll-opt-0" placeholder="选项1" maxlength="50">
    <input id="poll-opt-1" placeholder="选项2" maxlength="50">
    <input id="poll-opt-2" placeholder="选项3（可选）" maxlength="50">
    <input id="poll-opt-3" placeholder="选项4（可选）" maxlength="50">
  `, [
    { text: '发起', cls: 'btn-gold', fn: async () => {
      const title = document.getElementById('poll-title').value.trim();
      const options = [0,1,2,3].map(i => document.getElementById('poll-opt-'+i).value.trim()).filter(Boolean);
      if (!title) { addNotif('标题不能为空', 'bad'); return; }
      if (options.length < 2) { addNotif('至少需要2个选项', 'bad'); return; }
      try {
        await api('/api/community/polls', { method: 'POST', body: JSON.stringify({ title, options }) });
        addNotif('🗳 投票已发起', 'good');
        closeModal(); loadPolls();
      } catch(e) { addNotif(e.message, 'bad'); }
    }},
    { text: '取消', cls: '', fn: closeModal }
  ]);
}

// 龙椅排行榜
async function loadLeaderboard() {
  const list = document.getElementById('post-list');
  document.getElementById('community-board-name').textContent = '🏆 龙椅排行榜';
  document.querySelectorAll('.board-item').forEach(b => b.classList.remove('active'));
  list.innerHTML = '<div class="text-dim text-center" style="padding:40px">加载中…</div>';
  try {
    const data = await api('/api/dynasty/leaderboard');
    if (!data.records.length) {
      list.innerHTML = '<div class="text-dim text-center" style="padding:60px">暂无王朝终章记录——王朝覆灭时自动写入史册</div>';
    } else {
      const medals = ['🥇','🥈',''];
      list.innerHTML = `
      <div class="post-card" style="cursor:default">
        <table>
          <tr><th>名次</th><th>玩家</th><th>王朝终章</th><th>国祚</th><th>国库</th><th>天命</th><th>胜仗</th><th>奇观</th><th>覆灭原因</th></tr>
          ${data.records.map((r, i) => `<tr>
            <td>${medals[i] || (i+1)}</td>
            <td class="text-gold">${esc(r.username)}</td>
            <td>${esc(r.era)}</td>
            <td>${r.turns}年</td>
            <td>${Number(r.treasury).toLocaleString('zh-CN')}</td>
            <td>${r.tianming}</td>
            <td>${r.battles_won}</td>
            <td>${r.wonders_done}</td>
            <td class="text-dim">${esc(r.cause)}</td>
          </tr>`).join('')}
        </table>
      </div>`;
    }
    document.getElementById('post-pagination').innerHTML = '';
  } catch(e) { list.innerHTML = `<div class="text-red text-center" style="padding:40px">${esc(e.message)}</div>`; }
}

// 管理员精选切换
async function toggleFeature(postId) {
  try {
    const data = await api(`/api/admin/posts/${postId}/feature`, { method: 'POST' });
    addNotif(data.featured ? '📌 已加精置顶' : '已取消精选', 'good');
    openPostDetail(postId);
  } catch(e) { addNotif(e.message, 'bad'); }
}

// 关注用户
async function toggleFollow(userId) {
  try {
    const data = await api(`/api/community/follow/${userId}`, { method: 'POST' });
    const btn = document.getElementById('follow-btn-detail');
    if (btn) btn.textContent = data.following ? '✅ 已关注' : '➕ 关注';
    addNotif(data.following ? '关注成功' : '已取消关注', data.following ? 'good' : '');
  } catch(e) { addNotif(e.message, 'bad'); }
}

// 通知系统
async function loadNotifBadge() {
  if (!TOKEN) return;
  try {
    const data = await api('/api/notifications');
    const badge = document.getElementById('notif-badge');
    if (data.unread > 0) {
      badge.textContent = data.unread > 99 ? '99+' : data.unread;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  } catch(e) {}
}

async function openNotifications() {
  try {
    const data = await api('/api/notifications');
    const notifs = data.notifications || [];
    const html = notifs.length ? notifs.map(n => `
      <div class="notif-item ${n.read ? '' : 'unread'}" onclick="markNotifRead(${n.id})">
        <div style="font-size:13px"><b>${esc(n.title)}</b></div>
        ${n.body ? `<div class="text-dim" style="font-size:12px;margin-top:2px">${esc(n.body)}</div>` : ''}
        <div class="text-dim" style="font-size:10px;margin-top:2px">${timeAgo(n.created_at)}</div>
      </div>
    `).join('') : '<div class="text-dim text-center" style="padding:40px">暂无通知</div>';
    showModal('🔔 通知中心', html, [
      { text: '全部已读', cls: 'btn-gold', fn: async () => {
        await api('/api/notifications/read', { method: 'POST', body: JSON.stringify({}) });
        closeModal(); loadNotifBadge();
      }},
      { text: '关闭', cls: '', fn: closeModal }
    ]);
  } catch(e) { addNotif(e.message, 'bad'); }
}

async function markNotifRead(id) {
  try {
    await api('/api/notifications/read', { method: 'POST', body: JSON.stringify({ id }) });
    loadNotifBadge();
    openNotifications();
  } catch(e) {}
}

// ---------------- 管理后台 ----------------
let adminTab = 'overview';
async function loadAdmin() {
  if (!currentUser || !currentUser.is_admin) return;
  const el = document.getElementById('admin-content');
  el.innerHTML = `
    <div class="admin-tabs">
      <button class="admin-tab ${adminTab === 'overview' ? 'active' : ''}" onclick="adminTab='overview';loadAdmin()">📊 数据总览</button>
      <button class="admin-tab ${adminTab === 'users' ? 'active' : ''}" onclick="adminTab='users';loadAdmin()">👥 用户监控</button>
      <button class="admin-tab ${adminTab === 'errors' ? 'active' : ''}" onclick="adminTab='errors';loadAdmin()">🐛 错误日志</button>
      <button class="admin-tab ${adminTab === 'posts' ? 'active' : ''}" onclick="adminTab='posts';loadAdmin()">📮 帖子管理</button>
    </div>
    <div id="admin-body"><div class="text-dim">加载中…</div></div>`;
  const body = document.getElementById('admin-body');
  try {
    if (adminTab === 'overview') {
      const s = await api('/api/admin/stats');
      body.innerHTML = `
        <div class="grid-3">
          <div class="stat-card"><div class="stat-num">${s.userCount}</div><div class="stat-label">注册用户</div></div>
          <div class="stat-card"><div class="stat-num">${s.onlineRecent}</div><div class="stat-label">10分钟内活跃</div></div>
          <div class="stat-card"><div class="stat-num">${s.todayLogin}</div><div class="stat-label">24小时内登录</div></div>
          <div class="stat-card"><div class="stat-num">${s.postCount}</div><div class="stat-label">帖子总数</div></div>
          <div class="stat-card"><div class="stat-num">${s.commentCount}</div><div class="stat-label">评论总数</div></div>
          <div class="stat-card"><div class="stat-num" style="color:${s.errorCount ? 'var(--accent-red)' : 'var(--accent-green)'}">${s.errorCount}</div><div class="stat-label">未处理错误</div></div>
        </div>
        <div class="text-dim mt-8" style="font-size:12px">提示：点击「用户监控」查看每个用户的登录状态；点击「错误日志」处理前端上报的异常。</div>`;
    } else if (adminTab === 'users') {
      const data = await api('/api/admin/users');
      body.innerHTML = `
        <div class="card">
          <div class="card-header">全部用户 <span class="sub">绿点=10分钟内活跃 · 登录时间实时更新</span></div>
          <table>
            <tr><th>ID</th><th>用户名</th><th>状态</th><th>登录情况</th><th>最后活跃</th><th>发帖</th><th>注册时间</th><th>操作</th></tr>
            ${data.users.map(u => {
              const online = u.last_active && (Date.now() - new Date(u.last_active.replace(' ', 'T')).getTime() < 10 * 60 * 1000);
              return `<tr>
                <td class="text-dim">${u.id}</td>
                <td><span class="avatar" style="background:${u.avatar_color};width:18px;height:18px;font-size:10px;margin-right:4px">${esc(u.username[0]).toUpperCase()}</span>${esc(u.username)} ${u.is_admin ? '<span class="board-tag">管理</span>' : ''}</td>
                <td>${u.banned ? '<span class="text-red">已封禁</span>' : online ? '<span class="text-green"><span class="status-dot online"></span>在线</span>' : '<span class="text-dim"><span class="status-dot offline"></span>离线</span>'}</td>
                <td class="${u.last_login ? 'text-green' : 'text-red'}">${u.last_login ? '已登录 · ' + timeAgo(u.last_login) : '<span class="text-red">从未登录</span>'}</td>
                <td class="text-dim">${timeAgo(u.last_active)}</td>
                <td>${u.post_count}</td>
                <td class="text-dim">${u.created_at.slice(0, 10)}</td>
                <td>${u.is_admin ? '—' : `<button class="btn btn-sm ${u.banned ? 'btn-green' : 'btn-red'}" onclick="toggleBan(${u.id},${u.banned ? 0 : 1})">${u.banned ? '解封' : '封禁'}</button>`}</td>
              </tr>`;
            }).join('')}
          </table>
        </div>`;
    } else if (adminTab === 'errors') {
      const data = await api('/api/admin/errors');
      body.innerHTML = data.errors.length ? data.errors.map(e => `
        <div class="error-item ${e.resolved ? 'resolved' : ''}">
          <div class="flex" style="justify-content:space-between">
            <span class="text-dim">#${e.id} · ${esc(e.username || '匿名')} · ${e.created_at} · 页面:${esc(e.page || '—')}</span>
            ${e.resolved ? '<span class="text-green">✓ 已处理</span>' : `<button class="btn btn-sm btn-green" onclick="resolveError(${e.id})">标记已处理</button>`}
          </div>
          <div class="error-msg">${esc(e.message)}</div>
          ${e.stack ? `<div class="error-stack">${esc(e.stack)}</div>` : ''}
        </div>`).join('') : '<div class="text-dim text-center" style="padding:40px">暂无错误记录 🎉</div>';
    } else if (adminTab === 'posts') {
      const data = await api('/api/community/posts?board=all&sort=new&page=1');
      body.innerHTML = `
        <div class="card">
          <div class="card-header">帖子管理 <span class="sub">共 ${data.total} 帖（显示前20）</span></div>
          <table>
            <tr><th>ID</th><th>标题</th><th>作者</th><th>板块</th><th>赞/评</th><th>时间</th><th>操作</th></tr>
            ${data.posts.map(p => `<tr>
              <td class="text-dim">${p.id}</td>
              <td class="text-gold" style="cursor:pointer" onclick="openPostDetail(${p.id})">${esc(p.title)}</td>
              <td>${esc(p.username)}</td>
              <td class="text-dim">${BOARD_NAMES[p.board] || p.board}</td>
              <td>${p.likes}/${p.cmt_count}</td>
              <td class="text-dim">${timeAgo(p.created_at)}</td>
              <td><button class="btn btn-sm btn-red" onclick="adminDeletePost(${p.id})">删除</button></td>
            </tr>`).join('')}
          </table>
        </div>`;
    }
  } catch (e) { body.innerHTML = `<div class="text-red">${esc(e.message)}</div>`; }
}

async function toggleBan(uid, banned) {
  try {
    await api(`/api/admin/users/${uid}/ban`, { method: 'POST', body: JSON.stringify({ banned: !!banned }) });
    addNotif(banned ? '已封禁该用户' : '已解封该用户', 'good');
    loadAdmin();
  } catch (e) { addNotif(e.message, 'bad'); }
}

async function resolveError(id) {
  try {
    await api(`/api/admin/errors/${id}/resolve`, { method: 'POST' });
    loadAdmin();
  } catch (e) { addNotif(e.message, 'bad'); }
}

async function adminDeletePost(id) {
  if (!confirm('确定删除该帖子？')) return;
  try {
    await api(`/api/admin/posts/${id}`, { method: 'DELETE' });
    addNotif('帖子已删除', 'good');
    loadAdmin();
  } catch (e) { addNotif(e.message, 'bad'); }
}

// ---------------- 启动 ----------------
(async function init() {
  // 回车快捷登录/注册
  document.getElementById('login-password').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('reg-password2').addEventListener('keydown', e => { if (e.key === 'Enter') doRegister(); });

  if (!TOKEN) return; // 未登录停留在登录页
  try {
    const data = await api('/api/me');
    currentUser = data.user;
    window.currentUser = data.user;
    await enterApp();
  } catch (e) {
    TOKEN = ''; currentUser = null; window.currentUser = null;
    localStorage.removeItem('tm_token');
  }
})();
