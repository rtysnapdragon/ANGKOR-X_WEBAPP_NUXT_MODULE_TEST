import { isNotEmpty, useCookie } from "#imports";
import str from "../helpers/str";
export default function (arrg) {
  const locale = useCookie(str.langCode).value;

  switch (locale) {
    case "km":
      return isNotEmpty(arrg.km) ? arrg?.km : isNotEmpty(arrg.en) ? arrg?.en : "";
    case "en":
      return isNotEmpty(arrg.en) ? arrg?.en : isNotEmpty(arrg.km) ? arrg?.km : "";
    default:
      return isNotEmpty(arrg.km) ? arrg?.km : isNotEmpty(arrg.en) ? arrg?.en : "";
  }
}
