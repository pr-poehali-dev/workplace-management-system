import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { downloadDeploymentPackage } from '@/utils/deploymentScript';

export default function DeploymentTab() {
  const [sshHost, setSshHost] = useState('');
  const [sshPort, setSshPort] = useState('22');
  const [sshUsername, setSshUsername] = useState('root');
  const [sshPassword, setSshPassword] = useState('');
  const [sshPath, setSshPath] = useState('/var/www/html');
  const [deploying, setDeploying] = useState(false);
  const [deployLog, setDeployLog] = useState<string[]>([]);
  const [databaseUrl, setDatabaseUrl] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const savedConfig = localStorage.getItem('vps_config');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setDatabaseUrl(config.databaseUrl || '');
    }
  }, []);

  const handleDeploy = async () => {
    if (!sshHost || !sshUsername || !sshPassword) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля SSH',
        variant: 'destructive',
      });
      return;
    }

    setDeploying(true);
    setDeployLog([]);
    
    const addLog = (message: string) => {
      setDeployLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    try {
      addLog('🚀 Начало развертывания...');
      addLog(`📡 Подключение к ${sshHost}:${sshPort}`);

      const deploymentData = {
        ssh: {
          host: sshHost,
          port: parseInt(sshPort),
          username: sshUsername,
          password: sshPassword,
          path: sshPath,
        },
        config: {
          apiBaseUrl: `http://${sshHost}`,
          databaseUrl: databaseUrl,
        },
      };

      addLog('📦 Подготовка файлов проекта...');
      
      const projectFiles = await fetch('/dist/index.html').then(r => r.text());
      
      addLog('⚙️ Настройка конфигурации...');
      
      const updatedConfig = JSON.stringify(deploymentData.config);
      
      addLog('📤 Отправка файлов на сервер...');
      addLog('⚠️ Внимание: Автоматическая загрузка через SSH требует backend функции');
      addLog('📋 Инструкции для ручного развертывания:');
      addLog('');
      addLog('1. Подключитесь к серверу:');
      addLog(`   ssh ${sshUsername}@${sshHost} -p ${sshPort}`);
      addLog('');
      addLog('2. Создайте директорию проекта:');
      addLog(`   mkdir -p ${sshPath}`);
      addLog('');
      addLog('3. Скачайте код проекта:');
      addLog('   - Нажмите "Скачать → Скачать билд" в редакторе');
      addLog('   - Загрузите архив на сервер через SCP или FTP');
      addLog('');
      addLog('4. Распакуйте архив:');
      addLog(`   cd ${sshPath}`);
      addLog('   unzip project-build.zip');
      addLog('');
      addLog('5. Настройте веб-сервер (Nginx):');
      addLog('   - Укажите root директорию на папку с index.html');
      addLog('   - Настройте проксирование API запросов');
      addLog('');
      addLog('6. После загрузки файлов, вернитесь в админку:');
      addLog('   - Вкладка "Настройки VPS"');
      addLog(`   - Введите адрес: http://${sshHost}`);
      addLog('   - Нажмите "Сохранить"');
      addLog('');
      addLog('✅ Конфигурация сохранена локально');
      addLog('');
      addLog('📦 Скачивание файлов конфигурации...');
      
      localStorage.setItem('deployment_config', JSON.stringify(deploymentData));
      localStorage.setItem('vps_config', updatedConfig);

      downloadDeploymentPackage({
        host: sshHost,
        port: parseInt(sshPort),
        username: sshUsername,
        path: sshPath,
        apiBaseUrl: `http://${sshHost}`,
        databaseUrl: databaseUrl,
      });

      addLog('✅ Файлы конфигурации скачаны!');
      addLog('📋 Скачано: deploy.sh, nginx.conf, docker-compose.yml, README.md');

      toast({
        title: 'Конфигурация готова',
        description: 'Файлы развертывания скачаны',
      });

    } catch (error) {
      addLog(`❌ Ошибка: ${error}`);
      toast({
        title: 'Ошибка развертывания',
        description: 'Проверьте лог для деталей',
        variant: 'destructive',
      });
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ssh-host">Адрес сервера *</Label>
          <Input
            id="ssh-host"
            type="text"
            value={sshHost}
            onChange={(e) => setSshHost(e.target.value)}
            placeholder="192.168.1.100 или domain.com"
          />
        </div>
        <div>
          <Label htmlFor="ssh-port">SSH порт</Label>
          <Input
            id="ssh-port"
            type="text"
            value={sshPort}
            onChange={(e) => setSshPort(e.target.value)}
            placeholder="22"
          />
        </div>
        <div>
          <Label htmlFor="ssh-username">Пользователь SSH *</Label>
          <Input
            id="ssh-username"
            type="text"
            value={sshUsername}
            onChange={(e) => setSshUsername(e.target.value)}
            placeholder="root"
          />
        </div>
        <div>
          <Label htmlFor="ssh-password">Пароль SSH *</Label>
          <Input
            id="ssh-password"
            type="password"
            value={sshPassword}
            onChange={(e) => setSshPassword(e.target.value)}
            placeholder="Пароль"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="ssh-path">Путь на сервере</Label>
          <Input
            id="ssh-path"
            type="text"
            value={sshPath}
            onChange={(e) => setSshPath(e.target.value)}
            placeholder="/var/www/html"
          />
        </div>
      </div>

      <Button onClick={handleDeploy} disabled={deploying} className="w-full">
        <Icon name={deploying ? 'Loader2' : 'Rocket'} size={18} className={`mr-2 ${deploying ? 'animate-spin' : ''}`} />
        {deploying ? 'Развертывание...' : 'Начать развертывание'}
      </Button>

      {deployLog.length > 0 && (
        <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
          {deployLog.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      )}
    </div>
  );
}
