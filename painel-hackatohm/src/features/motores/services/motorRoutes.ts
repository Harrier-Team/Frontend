export const motorRoutes = {
  collection: '/motores',
  byId: (motorId: number) => `/motores/${motorId}`,
  status: (motorId: number) => `/motores/${motorId}/status`,
  sensorPing: (sensorId: string) =>
    `/motores/sensores/${encodeURIComponent(sensorId)}/ping`,
};
