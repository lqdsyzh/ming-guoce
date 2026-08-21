// ============================================================
// 天命·国策  —  后端服务（零依赖，Node 内置模块）
// 功能：用户注册登录 / 社区 / 管理后台 / 游戏云存档
// ============================================================
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// ---------------- 数据库初始化 ----------------
const db = new DatabaseSync(path.join(__dirname, 'data.db'));
db.exec(`
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  is_admin INTEGER DEFAULT 0,
  banned INTEGER DEFAULT 0,
  avatar_color TEXT DEFAULT '#c9a84c',
  created_at TEXT DEFAULT (datetime('now','localtime')),
  last_login TEXT
);
CREATE TABLE IF NOT EXISTS sessions(
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  last_active TEXT DEFAULT (datetime('now','localtime'))
);
CREATE TABLE IF NOT EXISTS posts(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  board TEXT DEFAULT 'general',
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  image TEXT DEFAULT '',
  link TEXT DEFAULT '',
  likes INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  deleted INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);
CREATE TABLE IF NOT EXISTS comments(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  deleted INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);
CREATE TABLE IF NOT EXISTS likes(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  UNIQUE(post_id, user_id)
);
CREATE TABLE IF NOT EXISTS error_logs(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  username TEXT,
  page TEXT,
  message TEXT,
  stack TEXT,
  resolved INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);
CREATE TABLE IF NOT EXISTS game_saves(
  user_id INTEGER PRIMARY KEY,
  save_data TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now','localtime'))
);
-- 社区增强：帖子标签
CREATE TABLE IF NOT EXISTS post_tags(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  tag TEXT NOT NULL,
  UNIQUE(post_id, tag)
);
CREATE INDEX IF NOT EXISTS idx_pt_tag ON post_tags(tag);
-- 社区增强：用户关注
CREATE TABLE IF NOT EXISTS follows(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  follower_id INTEGER NOT NULL,
  following_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  UNIQUE(follower_id, following_id)
);
-- 社区增强：通知
CREATE TABLE IF NOT EXISTS notifications(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, read);
-- 社区增强：帖子收藏
CREATE TABLE IF NOT EXISTS bookmarks(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  post_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  UNIQUE(user_id, post_id)
);
-- 社区增强：帖子精选(管理员置顶/加精)
CREATE TABLE IF NOT EXISTS post_featured(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL UNIQUE,
  type TEXT DEFAULT 'pin',
  created_at TEXT DEFAULT (datetime('now','localtime'))
);
`);

// 种子管理员账号 admin / admin123
(function seedAdmin() {
  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!exists) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync('admin123', salt, 64).toString('hex');
    db.prepare('INSERT INTO users(username,password_hash,salt,is_admin,avatar_color) VALUES(?,?,?,?,?)')
      .run('admin', hash, salt, 1, '#d44a4a');
    console.log('[seed] 管理员账号已创建: admin / admin123');
  }
})();

// ---------------- 工具函数 ----------------
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > 8 * 1024 * 1024) { reject(new Error('请求体过大')); req.destroy(); return; }
      body += chunk;
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); } catch (e) { reject(new Error('JSON解析失败')); }
    });
    req.on('error', reject);
  });
}

function sendJSON(res, code, data) {
  const str = JSON.stringify(data);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(str);
}

function getToken(req) {
  const auth = req.headers['authorization'];
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  const cookie = req.headers['cookie'] || '';
  const m = cookie.match(/token=([a-f0-9]+)/);
  return m ? m[1] : null;
}

function getSessionUser(req) {
  const token = getToken(req);
  if (!token) return null;
  const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
  if (!session) return null;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id);
  if (!user) return null;
  db.prepare("UPDATE sessions SET last_active = datetime('now','localtime') WHERE token = ?").run(token);
  db.prepare("UPDATE users SET last_login = datetime('now','localtime') WHERE id = ?").run(user.id);
  return user;
}

function requireAuth(req, res) {
  const user = getSessionUser(req);
  if (!user) { sendJSON(res, 401, { error: '未登录' }); return null; }
  if (user.banned) { sendJSON(res, 403, { error: '账号已被封禁' }); return null; }
  return user;
}

function requireAdmin(req, res) {
  const user = requireAuth(req, res);
  if (!user) return null;
  if (!user.is_admin) { sendJSON(res, 403, { error: '需要管理员权限' }); return null; }
  return user;
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------------- 静态文件服务 ----------------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};

function serveStatic(req, res, urlPath) {
  let filePath = urlPath === '/' ? '/index.html' : urlPath;
  // 上传文件
  if (filePath.startsWith('/uploads/')) {
    const fp = path.join(UPLOAD_DIR, path.basename(filePath));
    if (fs.existsSync(fp)) {
      res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
      fs.createReadStream(fp).pipe(res);
    } else { res.writeHead(404); res.end('Not Found'); }
    return;
  }
  const fullPath = path.join(PUBLIC_DIR, path.normalize(filePath).replace(/^(\.\.[\/\\])+/, ''));
  if (!fullPath.startsWith(PUBLIC_DIR)) { res.writeHead(403); res.end('Forbidden'); return; }
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fullPath)] || 'application/octet-stream' });
  fs.createReadStream(fullPath).pipe(res);
}

// ---------------- 路由处理 ----------------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;
  const method = req.method;

  try {
    // ===== 认证 =====
    if (p === '/api/register' && method === 'POST') {
      const { username, password } = await parseBody(req);
      if (!username || !password) return sendJSON(res, 400, { error: '用户名和密码不能为空' });
      if (username.length < 2 || username.length > 20) return sendJSON(res, 400, { error: '用户名长度2-20个字符' });
      if (password.length < 6) return sendJSON(res, 400, { error: '密码至少6位' });
      const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
      if (exists) return sendJSON(res, 400, { error: '用户名已存在' });
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = hashPassword(password, salt);
      const colors = ['#c9a84c', '#3a6ac8', '#3ac86a', '#7a3ac8', '#3ac8c8', '#c86a3a'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const info = db.prepare('INSERT INTO users(username,password_hash,salt,avatar_color) VALUES(?,?,?,?)')
        .run(username, hash, salt, color);
      return sendJSON(res, 200, { ok: true, userId: Number(info.lastInsertRowid), message: '注册成功，请登录' });
    }

    if (p === '/api/login' && method === 'POST') {
      const { username, password } = await parseBody(req);
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username || '');
      if (!user) return sendJSON(res, 400, { error: '用户不存在' });
      if (user.banned) return sendJSON(res, 403, { error: '账号已被封禁，请联系管理员' });
      if (hashPassword(password || '', user.salt) !== user.password_hash) {
        return sendJSON(res, 400, { error: '密码错误' });
      }
      const token = crypto.randomBytes(32).toString('hex');
      db.prepare('INSERT INTO sessions(token,user_id) VALUES(?,?)').run(token, user.id);
      db.prepare("UPDATE users SET last_login = datetime('now','localtime') WHERE id = ?").run(user.id);
      res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);
      return sendJSON(res, 200, { ok: true, token, user: { id: user.id, username: user.username, is_admin: !!user.is_admin, avatar_color: user.avatar_color } });
    }

    if (p === '/api/logout' && method === 'POST') {
      const token = getToken(req);
      if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      res.setHeader('Set-Cookie', 'token=; Path=/; HttpOnly; Max-Age=0');
      return sendJSON(res, 200, { ok: true });
    }

    if (p === '/api/me' && method === 'GET') {
      const user = getSessionUser(req);
      if (!user) return sendJSON(res, 401, { error: '未登录' });
      return sendJSON(res, 200, { user: { id: user.id, username: user.username, is_admin: !!user.is_admin, avatar_color: user.avatar_color, banned: !!user.banned, created_at: user.created_at } });
    }

    // ===== 社区 =====
    if (p === '/api/community/posts' && method === 'GET') {
      const board = url.searchParams.get('board') || '';
      const sort = url.searchParams.get('sort') || 'new';
      const search = url.searchParams.get('q') || '';
      const tag = url.searchParams.get('tag') || '';
      const page = Math.max(1, parseInt(url.searchParams.get('page')) || 1);
      const limit = 20;
      const offset = (page - 1) * limit;
      let where = 'WHERE p.deleted = 0';
      const params = [];
      if (board && board !== 'all') { where += ' AND p.board = ?'; params.push(board); }
      if (search) { where += ' AND (p.title LIKE ? OR p.content LIKE ?)'; params.push('%'+search+'%','%'+search+'%'); }
      if (tag) { where += ' AND p.id IN (SELECT post_id FROM post_tags WHERE tag=?)'; params.push(tag); }
      const order = sort === 'hot' ? 'ORDER BY p.likes DESC, p.created_at DESC' : 'ORDER BY p.created_at DESC';
      const rows = db.prepare(`
        SELECT p.*, u.username, u.avatar_color,
          (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.deleted = 0) AS cmt_count,
          (SELECT GROUP_CONCAT(tag, ',') FROM post_tags WHERE post_id = p.id) AS tags,
          EXISTS(SELECT 1 FROM post_featured WHERE post_id = p.id) AS is_featured
        FROM posts p JOIN users u ON u.id = p.user_id
        ${where} ${order} LIMIT ? OFFSET ?
      `).all(...params, limit, offset);
      const total = db.prepare(`SELECT COUNT(*) AS n FROM posts p ${where}`).get(...params).n;
      return sendJSON(res, 200, { posts: rows, total, page, pages: Math.ceil(total / limit) });
    }

    if (p === '/api/community/posts' && method === 'POST') {
      const user = requireAuth(req, res); if (!user) return;
      const { board, title, content, image, link, tags } = await parseBody(req);
      if (!title || !title.trim()) return sendJSON(res, 400, { error: '标题不能为空' });
      if (title.length > 100) return sendJSON(res, 400, { error: '标题过长' });
      if ((content || '').length > 10000) return sendJSON(res, 400, { error: '内容过长' });
      let imagePath = '';
      if (image && image.startsWith('data:image/')) {
        const m = image.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.+)$/);
        if (m) {
          const buf = Buffer.from(m[2], 'base64');
          if (buf.length > 3 * 1024 * 1024) return sendJSON(res, 400, { error: '图片不能超过3MB' });
          const fname = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`;
          fs.writeFileSync(path.join(UPLOAD_DIR, fname), buf);
          imagePath = '/uploads/' + fname;
        }
      }
      const info = db.prepare('INSERT INTO posts(user_id,board,title,content,image,link) VALUES(?,?,?,?,?,?)')
        .run(user.id, board || 'general', title.trim(), escapeHtml(content || ''), imagePath, escapeHtml(link || ''));
      const newPostId = Number(info.lastInsertRowid);
      // 保存标签
      if (Array.isArray(tags)) {
        const insTag = db.prepare('INSERT OR IGNORE INTO post_tags(post_id, tag) VALUES(?, ?)');
        tags.slice(0, 5).forEach(t => { const tag = String(t).trim().slice(0, 20); if (tag) insTag.run(newPostId, tag); });
      }
      return sendJSON(res, 200, { ok: true, postId: newPostId });
    }

    // 热门标签
    if (p === '/api/community/tags' && method === 'GET') {
      const rows = db.prepare(`
        SELECT tag, COUNT(*) AS n FROM post_tags
        GROUP BY tag ORDER BY n DESC LIMIT 20`).all();
      return sendJSON(res, 200, { tags: rows });
    }

    // 帖子搜索
    if (p === '/api/community/search' && method === 'GET') {
      const q = url.searchParams.get('q') || '';
      if (!q.trim()) return sendJSON(res, 200, { posts: [] });
      const rows = db.prepare(`
        SELECT p.*, u.username, u.avatar_color,
          (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.deleted = 0) AS cmt_count
        FROM posts p JOIN users u ON u.id = p.user_id
        WHERE p.deleted = 0 AND (p.title LIKE ? OR p.content LIKE ?)
        ORDER BY p.likes DESC LIMIT 30`).all('%'+q+'%','%'+q+'%');
      return sendJSON(res, 200, { posts: rows });
    }

    let mPost = p.match(/^\/api\/community\/posts\/(\d+)$/);
    if (mPost && method === 'GET') {
      const post = db.prepare(`
        SELECT p.*, u.username, u.avatar_color FROM posts p JOIN users u ON u.id = p.user_id
        WHERE p.id = ? AND p.deleted = 0`).get(parseInt(mPost[1]));
      if (!post) return sendJSON(res, 404, { error: '帖子不存在' });
      const comments = db.prepare(`
        SELECT c.*, u.username, u.avatar_color FROM comments c JOIN users u ON u.id = c.user_id
        WHERE c.post_id = ? AND c.deleted = 0 ORDER BY c.created_at ASC`).all(post.id);
      return sendJSON(res, 200, { post, comments });
    }

    mPost = p.match(/^\/api\/community\/posts\/(\d+)\/like$/);
    if (mPost && method === 'POST') {
      const user = requireAuth(req, res); if (!user) return;
      const postId = parseInt(mPost[1]);
      const post = db.prepare('SELECT id, user_id, title FROM posts WHERE id = ? AND deleted = 0').get(postId);
      if (!post) return sendJSON(res, 404, { error: '帖子不存在' });
      const existing = db.prepare('SELECT id FROM likes WHERE post_id = ? AND user_id = ?').get(postId, user.id);
      if (existing) {
        db.prepare('DELETE FROM likes WHERE id = ?').run(existing.id);
        db.prepare('UPDATE posts SET likes = MAX(0, likes - 1) WHERE id = ?').run(postId);
        return sendJSON(res, 200, { ok: true, liked: false });
      } else {
        db.prepare('INSERT INTO likes(post_id,user_id) VALUES(?,?)').run(postId, user.id);
        db.prepare('UPDATE posts SET likes = likes + 1 WHERE id = ?').run(postId);
        // 通知帖主
        if (post.user_id !== user.id) {
          db.prepare('INSERT INTO notifications(user_id,type,title,body,link) VALUES(?,?,?,?,?)')
            .run(post.user_id, 'like', `${user.username} 赞了你的帖子`, post.title, `/post/${postId}`);
        }
        return sendJSON(res, 200, { ok: true, liked: true });
      }
    }

    mPost = p.match(/^\/api\/community\/posts\/(\d+)\/comments$/);
    if (mPost && method === 'POST') {
      const user = requireAuth(req, res); if (!user) return;
      const { content } = await parseBody(req);
      if (!content || !content.trim()) return sendJSON(res, 400, { error: '评论不能为空' });
      if (content.length > 2000) return sendJSON(res, 400, { error: '评论过长' });
      const postId = parseInt(mPost[1]);
      const post = db.prepare('SELECT id, user_id, title FROM posts WHERE id = ? AND deleted = 0').get(postId);
      if (!post) return sendJSON(res, 404, { error: '帖子不存在' });
      db.prepare('INSERT INTO comments(post_id,user_id,content) VALUES(?,?,?)')
        .run(postId, user.id, escapeHtml(content.trim()));
      db.prepare('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?').run(postId);
      // 通知帖主
      if (post.user_id !== user.id) {
        db.prepare('INSERT INTO notifications(user_id,type,title,body,link) VALUES(?,?,?,?,?)')
          .run(post.user_id, 'comment', `${user.username} 评论了你的帖子`, escapeHtml(content.trim()).slice(0, 100), `/post/${postId}`);
      }
      return sendJSON(res, 200, { ok: true });
    }

    // ---- 社区增强：收藏 ----
    mPost = p.match(/^\/api\/community\/posts\/(\d+)\/bookmark$/);
    if (mPost && method === 'POST') {
      const user = requireAuth(req, res); if (!user) return;
      const pid = parseInt(mPost[1]);
      const existing = db.prepare('SELECT id FROM bookmarks WHERE user_id=? AND post_id=?').get(user.id, pid);
      if (existing) {
        db.prepare('DELETE FROM bookmarks WHERE id=?').run(existing.id);
        return sendJSON(res, 200, { ok: true, bookmarked: false });
      }
      db.prepare('INSERT OR IGNORE INTO bookmarks(user_id, post_id) VALUES(?, ?)').run(user.id, pid);
      return sendJSON(res, 200, { ok: true, bookmarked: true });
    }

    // 我的收藏列表
    if (p === '/api/community/bookmarks' && method === 'GET') {
      const user = requireAuth(req, res); if (!user) return;
      const rows = db.prepare(`
        SELECT p.*, u.username, u.avatar_color,
          (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.deleted = 0) AS cmt_count
        FROM bookmarks b JOIN posts p ON p.id = b.post_id JOIN users u ON u.id = p.user_id
        WHERE b.user_id = ? AND p.deleted = 0 ORDER BY b.created_at DESC LIMIT 50`).all(user.id);
      return sendJSON(res, 200, { posts: rows });
    }

    // ---- 社区增强：关注用户 ----
    let mFollow = p.match(/^\/api\/community\/follow\/(\d+)$/);
    if (mFollow && method === 'POST') {
      const user = requireAuth(req, res); if (!user) return;
      const targetId = parseInt(mFollow[1]);
      if (targetId === user.id) return sendJSON(res, 400, { error: '不能关注自己' });
      const target = db.prepare('SELECT id, username FROM users WHERE id=?').get(targetId);
      if (!target) return sendJSON(res, 404, { error: '用户不存在' });
      const existing = db.prepare('SELECT id FROM follows WHERE follower_id=? AND following_id=?').get(user.id, targetId);
      if (existing) {
        db.prepare('DELETE FROM follows WHERE id=?').run(existing.id);
        return sendJSON(res, 200, { ok: true, following: false });
      }
      db.prepare('INSERT OR IGNORE INTO follows(follower_id, following_id) VALUES(?, ?)').run(user.id, targetId);
      // 通知被关注者
      db.prepare('INSERT INTO notifications(user_id,type,title,body,link) VALUES(?,?,?,?,?)')
        .run(targetId, 'follow', `${user.username} 关注了你`, '', `/user/${user.id}`);
      return sendJSON(res, 200, { ok: true, following: true });
    }

    // 关注列表 / 粉丝列表
    if (p === '/api/community/following' && method === 'GET') {
      const user = requireAuth(req, res); if (!user) return;
      const rows = db.prepare(`
        SELECT u.id, u.username, u.avatar_color FROM follows f JOIN users u ON u.id = f.following_id
        WHERE f.follower_id = ? ORDER BY f.created_at DESC`).all(user.id);
      return sendJSON(res, 200, { users: rows });
    }
    if (p === '/api/community/followers' && method === 'GET') {
      const uid = parseInt(url.searchParams.get('user_id') || '0');
      const rows = db.prepare(`
        SELECT u.id, u.username, u.avatar_color FROM follows f JOIN users u ON u.id = f.follower_id
        WHERE f.following_id = ? ORDER BY f.created_at DESC`).all(uid);
      return sendJSON(res, 200, { users: rows });
    }

    // ---- 社区增强：通知系统 ----
    if (p === '/api/notifications' && method === 'GET') {
      const user = requireAuth(req, res); if (!user) return;
      const rows = db.prepare(`
        SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`).all(user.id);
      const unread = db.prepare('SELECT COUNT(*) AS n FROM notifications WHERE user_id=? AND read=0').get(user.id).n;
      return sendJSON(res, 200, { notifications: rows, unread });
    }
    if (p === '/api/notifications/read' && method === 'POST') {
      const user = requireAuth(req, res); if (!user) return;
      const { id } = await parseBody(req);
      if (id) {
        db.prepare('UPDATE notifications SET read=1 WHERE id=? AND user_id=?').run(id, user.id);
      } else {
        db.prepare('UPDATE notifications SET read=1 WHERE user_id=?').run(user.id);
      }
      return sendJSON(res, 200, { ok: true });
    }

    // ---- 社区增强：管理员精选/置顶 ----
    mPost = p.match(/^\/api\/admin\/posts\/(\d+)\/feature$/);
    if (mPost && method === 'POST') {
      const user = requireAuth(req, res); if (!user || !user.is_admin) return sendJSON(res, 403, { error: '无权限' });
      const pid = parseInt(mPost[1]);
      const existing = db.prepare('SELECT id FROM post_featured WHERE post_id=?').get(pid);
      if (existing) {
        db.prepare('DELETE FROM post_featured WHERE id=?').run(existing.id);
        return sendJSON(res, 200, { ok: true, featured: false });
      }
      db.prepare('INSERT OR IGNORE INTO post_featured(post_id) VALUES(?)').run(pid);
      return sendJSON(res, 200, { ok: true, featured: true });
    }

    // 精选帖子列表
    if (p === '/api/community/featured' && method === 'GET') {
      const rows = db.prepare(`
        SELECT p.*, u.username, u.avatar_color,
          (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.deleted = 0) AS cmt_count
        FROM post_featured f JOIN posts p ON p.id = f.post_id JOIN users u ON u.id = p.user_id
        WHERE p.deleted = 0 ORDER BY f.created_at DESC LIMIT 10`).all();
      return sendJSON(res, 200, { posts: rows });
    }

    // 个人主页数据
    const mUser = p.match(/^\/api\/community\/user\/(\d+)$/);
    if (mUser && method === 'GET') {
      const uid = parseInt(mUser[1]);
      const target = db.prepare('SELECT id,username,avatar_color,created_at,is_admin FROM users WHERE id = ?').get(uid);
      if (!target) return sendJSON(res, 404, { error: '用户不存在' });
      const posts = db.prepare('SELECT id,title,board,likes,comment_count,created_at FROM posts WHERE user_id = ? AND deleted = 0 ORDER BY created_at DESC LIMIT 50').all(uid);
      const comments = db.prepare(`
        SELECT c.id, c.content, c.created_at, c.post_id, p.title AS post_title
        FROM comments c JOIN posts p ON p.id = c.post_id
        WHERE c.user_id = ? AND c.deleted = 0 ORDER BY c.created_at DESC LIMIT 50`).all(uid);
      return sendJSON(res, 200, { profile: target, posts, comments });
    }

    // ===== 错误上报 =====
    if (p === '/api/error-report' && method === 'POST') {
      const { message, stack, page } = await parseBody(req);
      const user = getSessionUser(req);
      db.prepare('INSERT INTO error_logs(user_id,username,page,message,stack) VALUES(?,?,?,?,?)')
        .run(user ? user.id : null, user ? user.username : '匿名', page || '', String(message || '').slice(0, 2000), String(stack || '').slice(0, 4000));
      return sendJSON(res, 200, { ok: true });
    }

    // ===== 游戏云存档 =====
    if (p === '/api/game/save' && method === 'GET') {
      const user = requireAuth(req, res); if (!user) return;
      const row = db.prepare('SELECT save_data, updated_at FROM game_saves WHERE user_id = ?').get(user.id);
      return sendJSON(res, 200, { save: row ? row.save_data : null, updated_at: row ? row.updated_at : null });
    }
    if (p === '/api/game/save' && method === 'POST') {
      const user = requireAuth(req, res); if (!user) return;
      const { data } = await parseBody(req);
      if (!data) return sendJSON(res, 400, { error: '存档数据为空' });
      if (JSON.stringify(data).length > 2 * 1024 * 1024) return sendJSON(res, 400, { error: '存档过大' });
      const str = JSON.stringify(data);
      const exists = db.prepare('SELECT user_id FROM game_saves WHERE user_id = ?').get(user.id);
      if (exists) {
        db.prepare("UPDATE game_saves SET save_data = ?, updated_at = datetime('now','localtime') WHERE user_id = ?").run(str, user.id);
      } else {
        db.prepare('INSERT INTO game_saves(user_id,save_data) VALUES(?,?)').run(user.id, str);
      }
      return sendJSON(res, 200, { ok: true });
    }

    // ===== 管理后台 =====
    if (p === '/api/admin/stats' && method === 'GET') {
      const admin = requireAdmin(req, res); if (!admin) return;
      const userCount = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
      const postCount = db.prepare('SELECT COUNT(*) AS n FROM posts WHERE deleted = 0').get().n;
      const commentCount = db.prepare('SELECT COUNT(*) AS n FROM comments WHERE deleted = 0').get().n;
      const errorCount = db.prepare('SELECT COUNT(*) AS n FROM error_logs WHERE resolved = 0').get().n;
      const onlineRecent = db.prepare("SELECT COUNT(*) AS n FROM sessions WHERE last_active > datetime('now','localtime','-10 minutes')").get().n;
      const todayLogin = db.prepare("SELECT COUNT(DISTINCT user_id) AS n FROM sessions WHERE last_active > datetime('now','localtime','-24 hours')").get().n;
      return sendJSON(res, 200, { userCount, postCount, commentCount, errorCount, onlineRecent, todayLogin });
    }

    if (p === '/api/admin/users' && method === 'GET') {
      const admin = requireAdmin(req, res); if (!admin) return;
      const rows = db.prepare(`
        SELECT u.id, u.username, u.is_admin, u.banned, u.created_at, u.last_login, u.avatar_color,
          (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id AND p.deleted = 0) AS post_count,
          (SELECT MAX(last_active) FROM sessions s WHERE s.user_id = u.id) AS last_active
        FROM users u ORDER BY u.created_at DESC`).all();
      return sendJSON(res, 200, { users: rows });
    }

    mPost = p.match(/^\/api\/admin\/users\/(\d+)\/ban$/);
    if (mPost && method === 'POST') {
      const admin = requireAdmin(req, res); if (!admin) return;
      const uid = parseInt(mPost[1]);
      if (uid === admin.id) return sendJSON(res, 400, { error: '不能封禁自己' });
      const target = db.prepare('SELECT * FROM users WHERE id = ?').get(uid);
      if (!target) return sendJSON(res, 404, { error: '用户不存在' });
      if (target.is_admin) return sendJSON(res, 400, { error: '不能封禁管理员' });
      const { banned } = await parseBody(req);
      db.prepare('UPDATE users SET banned = ? WHERE id = ?').run(banned ? 1 : 0, uid);
      if (banned) db.prepare('DELETE FROM sessions WHERE user_id = ?').run(uid);
      return sendJSON(res, 200, { ok: true });
    }

    if (p === '/api/admin/errors' && method === 'GET') {
      const admin = requireAdmin(req, res); if (!admin) return;
      const rows = db.prepare('SELECT * FROM error_logs ORDER BY resolved ASC, created_at DESC LIMIT 100').all();
      return sendJSON(res, 200, { errors: rows });
    }

    mPost = p.match(/^\/api\/admin\/errors\/(\d+)\/resolve$/);
    if (mPost && method === 'POST') {
      const admin = requireAdmin(req, res); if (!admin) return;
      db.prepare('UPDATE error_logs SET resolved = 1 WHERE id = ?').run(parseInt(mPost[1]));
      return sendJSON(res, 200, { ok: true });
    }

    mPost = p.match(/^\/api\/admin\/posts\/(\d+)$/);
    if (mPost && method === 'DELETE') {
      const admin = requireAdmin(req, res); if (!admin) return;
      db.prepare('UPDATE posts SET deleted = 1 WHERE id = ?').run(parseInt(mPost[1]));
      return sendJSON(res, 200, { ok: true });
    }

    // ===== 静态文件 =====
    if (method === 'GET') return serveStatic(req, res, p);

    sendJSON(res, 404, { error: '接口不存在' });
  } catch (err) {
    console.error('[server error]', err);
    sendJSON(res, 500, { error: err.message || '服务器内部错误' });
  }
});

server.listen(PORT, () => {
  console.log(`[天命·国策] 服务器已启动: http://localhost:${PORT}`);
  console.log(`[天命·国策] 管理后台: http://localhost:${PORT}/admin.html`);
});
