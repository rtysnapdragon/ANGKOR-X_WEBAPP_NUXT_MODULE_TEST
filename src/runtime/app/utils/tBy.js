import { isNotEmpty, useCookie } from "#imports";
import str from "../helpers/str";
export default function (arrg) {
  const locale = useCookie(str.langCode).value;

  switch (locale) {
    case "km":
      return isNotEmpty(arrg.km) ? arrg?.km : isNotEmpty(arrg.en) ? arrg?.en : "";
    case "en":
      return isNotEmpty(arrg.en) ? arrg?.en : isNotEmpty(arrg.km) ? arrg?.km : "";
    case "zh":
      return isNotEmpty(arrg.zh) ? arrg?.zh : isNotEmpty(arrg.zh) ? arrg?.zh : "";
    default:
      return isNotEmpty(arrg.km) ? arrg?.km : isNotEmpty(arrg.en) ? arrg?.en : isNotEmpty(arrg.zh) ? arrg?.zh : "";
  }
}
