export default (handler) => {
  onMounted(() => {
    setTimeout(handler, 10);
  });
};
