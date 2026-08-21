#!/bin/bash
# ============================================
# 天命·国策 — 阿里云一键部署脚本
# 使用方法：在服务器上运行 bash deploy-aliyun.sh
# ============================================
set -e

echo "========== 天命·国策 部署开始 =========="

# 1. 安装 Node.js 20
if ! command -v node &> /dev/null; then
  echo "[1/6] 安装 Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "[1/6] Node.js 已安装: $(node -v)"
fi

# 2. 安装 Git
if ! command -v git &> /dev/null; then
  echo "[2/6] 安装 Git..."
  sudo apt-get install -y git
else
  echo "[2/6] Git 已安装"
fi

# 3. 创建项目目录
APP_DIR="/opt/tianming"
echo "[3/6] 创建项目目录 $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# 4. 复制代码（假设代码在当前目录）
echo "[4/6] 复制项目文件..."
cp -r . $APP_DIR/
cd $APP_DIR

# 5. 安装依赖
echo "[5/6] 安装 npm 依赖..."
npm install --production

# 6. 配置 systemd 服务（开机自启）
echo "[6/6] 配置系统服务..."
sudo tee /etc/systemd/system/tianming.service > /dev/null <<UNIT
[Unit]
Description=Tianming Game Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=$(which node) server.js
Restart=on-failure
RestartSec=5
Environment=PORT=3000
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable tianming
sudo systemctl restart tianming

# 开放防火墙
sudo ufw allow 3000/tcp 2>/dev/null || true

echo ""
echo "========== 部署完成 =========="
echo "🎮 游戏地址: http://$(curl -s http://checkip.amazonaws.com 2>/dev/null || echo '你的服务器公网IP'):3000"
echo "📜 落地页:   http://$(curl -s http://checkip.amazonaws.com 2>/dev/null || echo '你的服务器公网IP'):3000/promo.html"
echo ""
echo "常用命令:"
echo "  查看状态: sudo systemctl status tianming"
echo "  查看日志: sudo journalctl -u tianming -f"
echo "  重启服务: sudo systemctl restart tianming"
echo "  停止服务: sudo systemctl stop tianming"
