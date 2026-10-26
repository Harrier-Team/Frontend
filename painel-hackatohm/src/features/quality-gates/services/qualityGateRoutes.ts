export const qualityGateRoutes = {
  collection: '/regras-qualidade',
  byId: (regraId: string) => `/regras-qualidade/${regraId}`,
  motorCollection: (motorId: number) =>
    `/motores/${motorId}/regras-qualidade`,
  motorByRule: (motorId: number, regraId: string) =>
    `/motores/${motorId}/regras-qualidade/${regraId}`,
};
