import { getApiBaseUrl } from './apiConfig';

export const getBackendUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  
  const urlMap: Record<string, string> = {
    'BACKEND_ORDERS_URL': '/api/orders',
    'BACKEND_MATERIALS_URL': '/api/materials',
    'BACKEND_COLORS_URL': '/api/colors',
    'BACKEND_CATEGORIES_URL': '/api/sections',
    'BACKEND_WAREHOUSE_URL': '/api/warehouse',
    'BACKEND_SHIPPING_URL': '/api/shipments',
    'BACKEND_INCOMING_URL': '/api/arrivals',
    'BACKEND_DEFECTS_URL': '/api/defects',
    'BACKEND_CUTTING_URL': '/api/cutting',
    'BACKEND_AUTH_URL': '/api/auth',
  };

  const path = urlMap[endpoint] || endpoint;
  return `${baseUrl}${path}`;
};

export const AUTH_URL = 'https://functions.poehali.dev/f567299e-ff65-4a50-b8fa-ac9d7433171c';
export const ORDERS_URL = 'https://functions.poehali.dev/87ce04ef-e03c-437d-90c5-8f6cc94d3ba0';
export const MATERIALS_URL = 'https://functions.poehali.dev/0de22a89-5bb9-438f-b066-1ab4cc574784';
export const SECTIONS_URL = 'https://functions.poehali.dev/5b5b5237-7f90-4dff-80fe-95c8dc652afc';
export const COLORS_URL = 'https://functions.poehali.dev/aa4a8ccb-fd8f-4896-98a4-ef9e7e18c85f';
