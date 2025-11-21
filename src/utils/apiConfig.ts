export const getApiBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }

  const savedConfig = localStorage.getItem('vps_config');
  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig);
      if (config.apiBaseUrl) {
        return config.apiBaseUrl;
      }
    } catch {
      // Invalid config, fall through
    }
  }

  return window.location.origin;
};

export const getDatabaseUrl = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }

  const savedConfig = localStorage.getItem('vps_config');
  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig);
      return config.databaseUrl || '';
    } catch {
      return '';
    }
  }

  return '';
};

if (typeof window !== 'undefined') {
  window.addEventListener('vps-config-updated', () => {
    window.location.reload();
  });
}
