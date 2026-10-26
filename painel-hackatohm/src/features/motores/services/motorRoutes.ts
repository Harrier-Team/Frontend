export const motorRoutes = {
  collection: '/motores',
  byId: (motorId: number) => `/motores/${motorId}`,
  sensorPing: (sensorId: string) =>
    `/motores/sensores/${encodeURIComponent(sensorId)}/ping`,
};
