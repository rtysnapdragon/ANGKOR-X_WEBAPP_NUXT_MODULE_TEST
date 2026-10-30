export default (value) => copyWith(value);

function copyWith(value) {
  if (Array.isArray(value)) {
    return value.map(copyWith);
  }

  if (typeof value === "object" && value !== null) {
    const copy = {};
    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        const val = value[key];
        if (isValidDate(val)) {
          copy[key] = val;
        } else {
          copy[key] = copyWith(value[key]);
        }
      }
    }

    return copy;
  }

  return value;
}
function isValidDate(value) {
  return typeof value === "object" && !isNaN(Date.parse(value));
}
