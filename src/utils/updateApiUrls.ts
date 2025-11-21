import { getApiBaseUrl } from './apiConfig';

export const getBackendUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  
  const urlMap: Record<string, string> = {
    'orders': '/api/orders',
    'materials': '/api/materials',
    'colors': '/api/colors',
    'sections': '/api/sections',
    'warehouse': '/api/warehouse',
    'shipments': '/api/shipments',
    'arrivals': '/api/arrivals',
    'defects': '/api/defects',
    'cutting': '/api/cutting',
    'auth': '/api/auth',
  };

  const path = urlMap[endpoint] || `/api/${endpoint}`;
  return `${baseUrl}${path}`;
};

export const API_URLS = {
  AUTH: 'https://functions.poehali.dev/f567299e-ff65-4a50-b8fa-ac9d7433171c',
  ORDERS: 'https://functions.poehali.dev/87ce04ef-e03c-437d-90c5-8f6cc94d3ba0',
  MATERIALS: 'https://functions.poehali.dev/0de22a89-5bb9-438f-b066-1ab4cc574784',
  SECTIONS: 'https://functions.poehali.dev/5b5b5237-7f90-4dff-80fe-95c8dc652afc',
  COLORS: 'https://functions.poehali.dev/aa4a8ccb-fd8f-4896-98a4-ef9e7e18c85f',
};

export const getApiUrl = (endpoint: keyof typeof API_URLS): string => {
  const savedConfig = localStorage.getItem('vps_config');
  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig);
      if (config.apiBaseUrl) {
        return getBackendUrl(endpoint.toLowerCase());
      }
    } catch {
      // Invalid config, use default
    }
  }
  return API_URLS[endpoint];
};