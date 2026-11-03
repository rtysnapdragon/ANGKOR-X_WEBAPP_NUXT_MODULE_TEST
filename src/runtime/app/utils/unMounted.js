export default (handler) => {
  onUnmounted(() => {
    setTimeout(handler, 10);
  });
};
