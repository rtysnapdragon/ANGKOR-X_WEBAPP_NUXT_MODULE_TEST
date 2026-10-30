<template>
    <div class="relative max-w-full">
        <video ref="refVideo" :src="path" :class="`w-full ${vdoStyle ?? ''} ${isPlaying ? 'cursor-pointer' : ''}`"
            @click="togglePlay" @ended="handleEnded" :autoplay="autoPlay" :controls="autoPlay" @error="$emit('error', $event)"></video>
        <button v-if="!autoPlay" @click="onPlay" class="btn-play-video"
            :class="[btnStyle, isPlaying ? '' : 'show', widthVideo > 200 ? 'w-10 h-10' : 'w-8 h-8']">
            <i class="ri-play-fill flex justify-center items-center pl-1 text-white"
                :class="[icoStyle, widthVideo > 200 ? 'w-10 h-10 text-3xl' : 'w-8 h-8 text-2xl']"></i>
        </button>
    </div>
</template>

<script setup>
const props = defineProps(['path', 'VideoStyle', 'BtnStyle', 'IconStyle', 'autoPlay', 'eventNone'])
const path = computed(() => props.path ?? '')
const vdoStyle = computed(() => props.VideoStyle ?? '')
const btnStyle = computed(() => props.BtnStyle ?? '')
const icoStyle = computed(() => props.IconStyle ?? '')
const autoPlay = computed(() => isNotEmpty(props.autoPlay))
const eventNone = computed(() => isNotEmpty(props.eventNone))
const refVideo = ref(null)
const isPlaying = ref(false)
const showButton = ref(false)
const widthVideo = ref(201)

mounted(() => {
    // console.log('---->>>> video  >>', autoPlay.value)
    refVideo.value.addEventListener('play', handlePlay)
    refVideo.value.addEventListener('pause', handlePause)
    refVideo.value.addEventListener('ended', handleEnded)

    widthVideo.value = refVideo.value?.getBoundingClientRect().width

    window.addEventListener('resize', (e) => {
        widthVideo.value = refVideo.value?.getBoundingClientRect().width
        // console.log('====>>> w video >>>', refVideo.value?.getBoundingClientRect().width)
    })
})

onUnmounted(() => {

})

watch(path, (n) => {
    if (n) {
        refVideo.value.load()
        isPlaying.value = false
        showButton.value = true
    }
})

watch(autoPlay, (n) => {
    if (n) refVideo.value?.play()
    else refVideo.value?.pause()
})

const togglePlay = () => {
    if (autoPlay.value) return
    if (isPlaying.value) {
        refVideo.value.pause()
        setTimeout(() => {
            isPlaying.value = !isPlaying.value
        }, 1);
    }
    return
    if (isPlaying.value) refVideo.value.pause()
    else refVideo.value.play()
    isPlaying.value = !isPlaying.value
}

const onPlay = () => {
    if (eventNone.value) return
    refVideo.value.play()
    isPlaying.value = !isPlaying.value
}

const handlePlay = () => {
    isPlaying.value = true
    showButton.value = false
}

const handlePause = () => {
    isPlaying.value = false
    showButton.value = true
}

const handleEnded = () => {
    isPlaying.value = false
    showButton.value = true
}

function container() {
    return refVideo.value
}

defineExpose({ container })
</script>

<style lang="scss">
.btn-play-video {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    display: flex;
    justify-content: center;
    align-items: center;

    background-color: #ffffff33;
    border-radius: 50%;
    transition: all .1s ease-in-out;
    visibility: hidden;
    opacity: 0;
    cursor: pointer;

    &.show {
        opacity: 1;
        visibility: visible;
        z-index: 1;
        transform: translate(-50%, -50%) scale(1);
    }
}
</style>