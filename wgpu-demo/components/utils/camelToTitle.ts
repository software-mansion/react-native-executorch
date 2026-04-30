export const camelToTitle = (str: string) =>
  str.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
