// export default (handler) => {
//   onMounted(() => {
//     setTimeout(handler, 10);
//   });
// };


import { onMounted } from "vue";

export default (handler) => {
  onMounted(() => {
    setTimeout(async () => {
      await handler();
    }, 10);
  });
};