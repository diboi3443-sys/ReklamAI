#!/bin/bash
# ReklamAI VPS Setup Script for Ubuntu 22/24
# Запускай: sudo bash setup_vps.sh YOUR_DOMAIN
# Пример:  sudo bash setup_vps.sh reklamai.ru

set -e

DOMAIN=${1:-"reklamai.ru"}
WEB_ROOT="/var/www/reklamai"

echo "========================================"
echo "  ReklamAI VPS Setup"
echo "  Домен: $DOMAIN"
echo "========================================"

# 1. Обновление системы
echo "[1/6] Обновляю систему..."
apt update && apt upgrade -y

# 2. Установка Nginx
echo "[2/6] Устанавливаю Nginx..."
apt install -y nginx certbot python3-certbot-nginx

# 3. Создание директории
echo "[3/6] Создаю директорию для сайта..."
mkdir -p $WEB_ROOT
chown -R www-data:www-data $WEB_ROOT

# 4. Конфиг Nginx
echo "[4/6] Настраиваю Nginx..."
cat > /etc/nginx/sites-available/reklamai << NGINXEOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    root $WEB_ROOT;
    index index.html;

    # Gzip сжатие
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    # Кеш для статики (JS/CSS с хешами в именах)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    # SPA fallback - все маршруты -> index.html
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Безопасность
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
NGINXEOF

# Активируем сайт
ln -sf /etc/nginx/sites-available/reklamai /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Проверяем конфиг
nginx -t

# 5. Перезапуск Nginx
echo "[5/6] Перезапускаю Nginx..."
systemctl restart nginx
systemctl enable nginx

# 6. Инструкция
echo ""
echo "========================================"
echo "  VPS настроен!"
echo "========================================"
echo ""
echo "Следующие шаги:"
echo ""
echo "1. Загрузи файлы фронтенда:"
echo "   scp -r dist/* root@ВАШ_IP:$WEB_ROOT/"
echo ""
echo "2. Создай config.js в $WEB_ROOT/:"
echo '   window.APP_CONFIG = {'
echo '     VITE_SUPABASE_URL: "https://wgblrrhstqxwfiltkwcc.supabase.co",'
echo '     VITE_SUPABASE_ANON_KEY: "ТВОЙ_ANON_KEY"'
echo '   };'
echo ""
echo "3. Добавь <script src=\"/config.js\"></script> в index.html"
echo "   ПЕРЕД строкой <script type=\"module\"..."
echo ""
echo "4. SSL сертификат:"
echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "5. Открой http://$DOMAIN в браузере"
echo ""
