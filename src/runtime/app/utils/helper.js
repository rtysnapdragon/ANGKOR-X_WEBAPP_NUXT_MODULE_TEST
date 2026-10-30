import apis from '../helpers/apis';
import str from '../helpers/str';
import config from '../helpers/config';
import globalHelper from './globalhelper';

export default () => {
  const gHelper = globalHelper();

  return {
    str: { ...gHelper.str, ...str },
    config: { ...gHelper.config, ...config },
    api: { ...gHelper.api, ...apis }, 
  };
};

// export default () => {
//   const data = JSON.parse(decryptAES(OCAPPCONFIGURATION));
//   let appConfig;

//   try {
//     appConfig = OC_CONFIGURATION;
//   } catch (e) {
//     appConfig = {};
//   }

//   const config = {
//     ...data,
//     signalRUrl: data.signalRUrl || data.apiUrl,
//     ...appConfig,
//   };
//   const userData = useUserData().value;
//   return { ...OC_HELPER, ...{ config }, ...{ userData } };
// };
