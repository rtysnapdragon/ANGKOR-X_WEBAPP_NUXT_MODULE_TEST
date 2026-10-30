import { useToast } from "#imports";
import queryString from "query-string";
export default (key, value) => {
  const toast = useToast();
  const currentUrl = new URL(window.location.href);
  const currentQueryParams = queryString.parse(currentUrl.search);
  if (key == "keep") {
    const updatedQueryString = queryString.stringify(currentQueryParams);
    const updatedUrl = `?${updatedQueryString}`;
    return updatedUrl;
  }
  if (value == "delete") {
    delete currentQueryParams[key];
    const updatedQueryString = queryString.stringify(currentQueryParams);
    const updatedUrl = `?${updatedQueryString}`;
    // window.history.replaceState({}, '', updatedUrl);
    return updatedUrl;
  }
  if ((typeof value === "object" || Array.isArray(value)) && key) {
    // Encode an object into the query parameter
    try {
      const jsonString = JSON.stringify(value);
      // const base64String = btoa(jsonString);
      const base64String = btoa(unescape(encodeURIComponent(jsonString)));
      const urlSafeBase64String = encodeURIComponent(base64String);
      const newQueryParams = {
        ...currentQueryParams,
        [key]: urlSafeBase64String,
      };
      const updatedQueryString = queryString.stringify(newQueryParams);
      if (updatedQueryString.length > 2000) {
        toast.add({
          color: "yellow",
          title: "Query string exceeds 2000 characters, truncating.",
        });
        // return ""; // Return current URL if too long
      }
      const updatedUrl = `?${updatedQueryString}`;
      return updatedUrl;
    } catch (error) {
      console.error("Error encoding object:", error);
      return currentUrl.href; // Return current URL if encoding fails
    }
  }

  // Decode the query parameter into an object
  if (!value && !key && Object.keys(currentQueryParams).length > 0) {
    let newObj = {};
    for (let paramName in currentQueryParams) {
      try {
        const base64StringDecoded = decodeURIComponent(
          currentQueryParams[paramName]
        );
        // const jsonStringDecoded = atob(base64StringDecoded);
        const jsonStringDecoded = decodeURIComponent(
          escape(atob(base64StringDecoded))
        );
        const jsonObjectDecoded = JSON.parse(jsonStringDecoded);
        newObj[paramName] = jsonObjectDecoded; // Use paramName to assign to newObj keys
      } catch (error) {
        newObj[paramName] = currentQueryParams[paramName];
      }
    }
    return newObj;
  }
  return null;
};
