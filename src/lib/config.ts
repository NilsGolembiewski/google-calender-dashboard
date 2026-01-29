export const APP_CONFIG = {
  isDebug: process.env.DEBUG === '1',
  businessHours: {
    start: Number(process.env.NEXT_PUBLIC_BIZ_START || 8),
    end: Number(process.env.NEXT_PUBLIC_BIZ_END || 18),
  },
  alertThreshold: Number(process.env.NEXT_PUBLIC_ALERT_THRESHOLD || 8),
};
