export interface DeploymentConfig {
  host: string;
  port: number;
  username: string;
  path: string;
  apiBaseUrl: string;
  databaseUrl?: string;
}

export const generateDeploymentScript = (config: DeploymentConfig): string => {
  return `#!/bin/bash

# Автоматический скрипт развертывания
# Сгенерирован: ${new Date().toLocaleString()}

set -e

echo "🚀 Начало развертывания проекта..."
echo "📡 Сервер: ${config.host}"
echo "📁 Директория: ${config.path}"
echo ""

# Переменные
PROJECT_PATH="${config.path}"
API_BASE_URL="${config.apiBaseUrl}"
${config.databaseUrl ? `DATABASE_URL="${config.databaseUrl}"` : ''}

# Создание директории проекта
echo "📂 Создание директории проекта..."
mkdir -p "$PROJECT_PATH"
cd "$PROJECT_PATH"

# Проверка и установка Node.js
if ! command -v node &> /dev/null; then
    echo "📦 Установка Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Проверка и установка Nginx
if ! command -v nginx &> /dev/null; then
    echo "🌐 Установка Nginx..."
    apt-get update
    apt-get install -y nginx
fi

echo ""
echo "✅ Подготовка завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Загрузите файлы проекта в директорию: $PROJECT_PATH"
echo "2. Настройте Nginx конфигурацию:"
echo ""
echo "cat > /etc/nginx/sites-available/myproject << 'EOF'
server {
    listen 80;
    server_name ${config.host};
    root $PROJECT_PATH;
    index index.html;

    location / {
        try_files \\$uri \\$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_cache_bypass \\$http_upgrade;
    }
}
EOF"
echo ""
echo "3. Активируйте конфигурацию:"
echo "   ln -s /etc/nginx/sites-available/myproject /etc/nginx/sites-enabled/"
echo "   nginx -t"
echo "   systemctl restart nginx"
echo ""
echo "4. Откройте админ-панель по адресу: http://${config.host}"
echo "   Логин: admin"
echo "   Пароль: admin123"
echo ""
echo "5. Перейдите в Администрирование → Настройки VPS"
echo "   API URL: http://${config.host}"
echo "   Нажмите 'Сохранить'"
echo ""
echo "🎉 Готово!"
`;
};

export const generateNginxConfig = (config: DeploymentConfig): string => {
  return `server {
    listen 80;
    server_name ${config.host};
    root ${config.path};
    index index.html;

    # Gzip сжатие
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Основное приложение
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Статические файлы с кэшированием
    location ~* \\.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Проксирование API (если используется)
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Логи
    access_log /var/log/nginx/myproject_access.log;
    error_log /var/log/nginx/myproject_error.log;
}`;
};

export const generateDockerCompose = (config: DeploymentConfig): string => {
  return `version: '3.8'

services:
  app:
    image: nginx:alpine
    container_name: workplace-management
    ports:
      - "80:80"
    volumes:
      - ${config.path}:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    restart: unless-stopped

  ${config.databaseUrl ? `postgres:
    image: postgres:15-alpine
    container_name: workplace-db
    environment:
      POSTGRES_USER: \${DB_USER:-admin}
      POSTGRES_PASSWORD: \${DB_PASSWORD:-admin123}
      POSTGRES_DB: \${DB_NAME:-workplace}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    ports:
      - "5432:5432"

volumes:
  postgres_data:` : ''}
`;
};

export const downloadDeploymentPackage = (config: DeploymentConfig) => {
  const script = generateDeploymentScript(config);
  const nginx = generateNginxConfig(config);
  const docker = generateDockerCompose(config);

  const readme = `# Инструкция по развертыванию

## Вариант 1: Автоматическое развертывание (рекомендуется)

1. Загрузите файлы на сервер:
   \`\`\`bash
   scp -r * ${config.username}@${config.host}:${config.path}/
   \`\`\`

2. Подключитесь к серверу:
   \`\`\`bash
   ssh ${config.username}@${config.host} -p ${config.port}
   \`\`\`

3. Запустите скрипт развертывания:
   \`\`\`bash
   cd ${config.path}
   chmod +x deploy.sh
   sudo ./deploy.sh
   \`\`\`

## Вариант 2: Docker (быстрый старт)

1. Установите Docker и Docker Compose на сервере
2. Загрузите файлы проекта и конфигурацию
3. Запустите:
   \`\`\`bash
   docker-compose up -d
   \`\`\`

## Вариант 3: Ручная настройка

1. Скопируйте содержимое nginx.conf в /etc/nginx/sites-available/myproject
2. Создайте симлинк:
   \`\`\`bash
   ln -s /etc/nginx/sites-available/myproject /etc/nginx/sites-enabled/
   \`\`\`
3. Перезапустите Nginx:
   \`\`\`bash
   sudo systemctl restart nginx
   \`\`\`

## После развертывания

1. Откройте: http://${config.host}
2. Войдите как администратор (admin / admin123)
3. Перейдите в Администрирование → Настройки VPS
4. Укажите API URL: ${config.apiBaseUrl}
5. Сохраните настройки

## Поддержка

Если возникли проблемы, проверьте:
- Логи Nginx: /var/log/nginx/myproject_error.log
- Доступность порта 80 (sudo netstat -tlnp | grep :80)
- Права доступа к файлам: sudo chown -R www-data:www-data ${config.path}
`;

  const files = [
    { name: 'deploy.sh', content: script },
    { name: 'nginx.conf', content: nginx },
    { name: 'docker-compose.yml', content: docker },
    { name: 'README.md', content: readme },
  ];

  files.forEach(file => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
};
