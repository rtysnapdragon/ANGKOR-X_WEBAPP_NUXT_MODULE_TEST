import { onMounted } from "vue";

export default (handler: () => void | Promise<void>) => {
  onMounted(() => {
    setTimeout(async () => {
      await handler();
    }, 10);
  });
};