<template>
  <div class="w-full h-[calc(100vh-66px)] relative">
    <RLoading :loading="loading" :fullscreen="true" />
    <iframe :src="url" :onload="onload" ref="rIframe" frameborder="0" :class="`w-full h-full`" allowfullscreen
      allow="camera; microphone; serial; clipboard-write; fullscreen; popup; display-capture; geolocation">
    </iframe>
  </div>
</template>

<script setup>
import { useUserData } from '#imports';
import {useBreadCrumb } from '~/composables/useBreadCrumb'
const breadCrumb = useBreadCrumb();
const { str, config } = helper();
const props = defineProps(["path", "querystring"]);
const emit = defineEmits(["onMessage"]);
const path = computed(() => props.path);
const querystring = computed(() => props.querystring);
const rIframe = ref();
const loading = ref(true);
const url = ref(
  `${config.webUrl}${path.value}?nocache=${config.version}&nolayout=true${querystring.value ? "&" + querystring.value : ""
  }`
);

defineExpose({
  rIframe,
  loadUrl,
});

function onload() {
  loading.value = false;
}

mounted(async () => {
  breadCrumb.add({});

  const lang = useCookie(str.langCode);

  useAuthorizeIframe({
    action: "change_lang",
    data: {
      langCode: lang.value,
      sameSite: config.sameSite,
    },
  });

  window.addEventListener("message", handleMessageEvent);

  // Auto refresh token
  const userData = useUserData().value;

  useAuthorizeIframe({
    action: "set_authorize_cookie",
    data: {
      cookie: {
        rty_access_token: userData.access_token,
        rty_expire: userData.expires,
      },
      sameSite: config.sameSite,
    },
  });

  await useRefreshToken();

  clearInterval(window.iframeRefreshTokenTimer);
  window.iframeRefreshTokenTimer = setInterval(useRefreshToken, 60000);
});

onUnmounted(() => {
  window.removeEventListener("message", handleMessageEvent);
  clearInterval(window.iframeRefreshTokenTimer);
});


function loadUrl(path, querystring) {
  loading.value = true;
  ocIframe.value.src = `${config.webUrl
    }${path}?nocache=${config.version}&nolayout=true${querystring ? "&" + querystring : ""
    }`;
}

function handleMessageEvent(event) {
  if (event.data?.action === "document ready") {
    loading.value = false;
  } else if (event.data?.action === "get domain") {
    postDomainToIframe();
  }
  previewReport(event);
  emit("onMessage", event);
}

function postDomainToIframe() {
  const origin = window.location.origin;
  ocIframe.value.contentWindow.postMessage(origin, "*");
  console.log("postDomainToIframe", origin);
}
</script>

<style lang="scss" scoped>
.iframe-bg {
  background-color: var(--bg-wrapper);
}
</style>
