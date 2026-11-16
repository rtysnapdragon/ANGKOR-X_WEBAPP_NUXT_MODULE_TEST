// export default (handler) => {
//   onMounted(() => {
//     setTimeout(handler, 10);
//   });
// };

import { onMounted } from "vue";

export default (handler: () => void | Promise<void>) => {
  onMounted(() => {
    setTimeout(async () => {
      await handler();
    }, 10);
  });
};