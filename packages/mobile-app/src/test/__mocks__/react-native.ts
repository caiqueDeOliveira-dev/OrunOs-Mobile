export const Platform = {
  OS: "ios",
  select: (obj: Record<string, unknown>) => obj.ios ?? obj.default,
};

export const Linking = {
  openURL: async () => {},
  canOpenURL: async () => true,
};

export const Alert = {
  alert: () => {},
};

export const Dimensions = {
  get: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }),
};

export default {
  Platform,
  Linking,
  Alert,
  Dimensions,
};
