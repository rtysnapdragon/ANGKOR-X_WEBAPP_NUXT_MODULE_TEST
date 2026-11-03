// composables/useRemoveDuplicate.js
export const useRemoveDuplicate = () => {
  return (list, keys) => {
    const seen = new Set();
    return list?.filter(item => {
      if (!item) return false;

      const key = Array.isArray(keys)
        ? keys.map(k => item?.[k] ?? '').join('|')
        : item?.[keys] ?? '';

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
};
