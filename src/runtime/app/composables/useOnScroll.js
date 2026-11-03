import { ref, onMounted, onUnmounted } from "vue";

export const useOnScroll = (el) => {
  const x = ref(0);
  const y = ref(0);

  function onMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!el.value) return;

    el.value.style.scrollSnapType = "none";
    el.value.style.scrollBehavior = "auto";

    x.value = e.pageX;
    y.value = e.pageY;

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  function onMouseUp(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!el.value) return;

    el.value.style.removeProperty("scroll-behavior");
    el.value.style.removeProperty("scroll-snap-type");
    el.value.style.removeProperty("pointer-events");

    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }

  function onMouseMove(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!el.value) return;

    el.value.style.pointerEvents = "none";

    const deltaX = e.pageX - x.value;
    const deltaY = e.pageY - y.value;

    x.value = e.pageX;
    y.value = e.pageY;

    el.value.scrollBy(-deltaX, -deltaY);
  }

  onMounted(() => {
    if (!el.value) return;

    el.value.addEventListener("mousedown", onMouseDown);
  });

  onUnmounted(() => {
    if (!el.value) return;

    el.value.removeEventListener("mousedown", onMouseDown);
  });
};
