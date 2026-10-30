import isNotEmpty from "./isNotEmpty";
import rdate from "./rdate";
export default (val, type) => {
  return isNotEmpty(val) ? byType(val, type) : "..";
};
function byType(val, type = "") {
  let value;
  if (type == "date") value = rdate(val);
  else value = val;
  return value;
}
