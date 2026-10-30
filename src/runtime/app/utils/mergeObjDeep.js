function mergeDeep(target, source) {
  // Ensure target and source are valid objects
  if (!target || typeof target !== "object") {
    target = {};
  }
  if (!source || typeof source !== "object") {
    return target;
  }

  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      // Handle nested objects
      target[key] = mergeDeep(target[key] || {}, source[key]);
    } else if (Array.isArray(source[key])) {
      // Handle arrays
      if (!Array.isArray(target[key])) {
        target[key] = [];
      }
      // Merge arrays by index
      target[key] = source[key].map((item, index) => {
        if (
          target[key][index] &&
          typeof item === "object" &&
          !Array.isArray(item)
        ) {
          return mergeDeep({ ...target[key][index] }, item);
        }
        return Array.isArray(item) ? [...item] : item;
      });
      // Append any extra elements from target[key] if it's longer
      if (target[key].length > source[key].length) {
        target[key].push(...target[key].slice(source[key].length));
      }
    } else {
      // Handle primitive values
      target[key] = source[key];
    }
  }

  return target;
}

export default mergeDeep;
