<template>
    <div class="r-status r-rounded-s" :class="color + ' ' + props.variant + ' ' + size">
        <i v-if="props.icon != undefined" :class="`${props.icon} ${props.color}`"></i>
        <span>{{ text }}</span>
    </div>
</template>

<script setup>
const props = defineProps(['icon', 'color', 'text', 'variant', 'size'])
const color = computed(() => props.color)
const text = computed(() => props.text)
const size = computed(() => props.size)
</script>

<style lang="scss" scoped>
.r-status {
    display: flex;
    align-items: center;
    grid-gap: 2px;
    height: 18px;
    font-size: 11px;
    line-height: 11px;
    font-family: var(--font-400);
    user-select: none;
    color: #fff;
    width: fit-content;

    &.s {
        height: 16px;
        font-size: 9px;
        line-height: 9px;
        font-family: var(--font-500);
    }

    i {
        font-size: 13px;
        line-height: 13px;

        &.nenoBlue {
            color: var(--r-c-nenoBlue);
        }

        &.green {
            color: var(--r-c-green);
        }

        &.dark-green {
            color: var(--r-c-dark-green);
        }

        &.orange {
            color: var(--r-c-orange);
        }

        &.purple {
            color: var(--r-c-purple);
        }

        &.purpleBlack {
            color: var(--r-c-purpleBlack);
        }

        &.red {
            color: var(--r-c-red);
        }

        &.orangeRed {
            color: var(--r-c-orangeRed);
        }

        &.blue {
            color: var(--r-c-blue);
        }

        &.capture {
            color: var(--r-c-capture);
        }

        &.gray {
            color: var(--r-c-gray);
        }

        &.grayDeep {
            color: #c9c9c9;
        }

        &.primary {
            color: var(--color-primary);
        }

        &.male {
            color: var(--r-c-male);
        }

        &.female {
            color: var(--r-c-female);
        }

        // Attendance Color
        &.absent {
            color: #FF5F5F;
        }

        &.permission {
            color: #8EB53D;
        }

        &.late {
            color: #C3BC0B
        }

        &.present {
            color: #8EB53D
        }

        &.hospital {
            color: #E01919;
        }
    }
}

.solid {
    padding: 0px 5px 0px 6px;

    i {
        color: var(--bg-content) !important;
    }

    &.s {
        padding: 0px 4px 0px 5px;
    }

    &.nenoBlue {
        background: var(--r-c-nenoBlue);
    }

    &.green {
        background: var(--r-c-green);
    }

    &.dark-green {
        background: var(--r-c-dark-green);
    }

    &.orange {
        background: var(--r-c-orange);
    }

    &.purple {
        background: var(--r-c-purple);
    }

    &.purpleBlack {
        background: var(--r-c-purpleBlack);
    }

    &.red {
        background: var(--r-c-red);
    }

    &.orangeRed {
        background: var(--r-c-orangeRed);
    }

    &.blue {
        background: var(--r-c-blue);
    }

    &.capture {
        background: var(--r-c-capture);
    }

    &.gray {
        background: var(--r-c-gray);
        color: var(--color-w-b-1);
    }

    &.grayDeep {
        background: #c9c9c947 !important;
        color: var(--color-w-b-1) !important;
    }

    &.primary {
        background: var(--color-primary);
    }

    &.male {
        background: var(--r-c-male);
    }

    &.female {
        background: var(--r-c-female);
    }

    // Attendance Color
    &.absent {
        background: #FF5F5F;
        color: #fff;
    }

    &.permission {
        background: #8EB53D;
        color: #fff;
    }

    &.late {
        background: #C3BC0B;
        color: #fff;
    }

    &.present {
        background: #8EB53D;
        color: #fff;
    }

    &.hospital {
        background: #E01919;
        color: #fff;
    }

    &.disabled {
        background: var(--r-b-disabled);
        color: var(--color-w-b-2) !important;
    }
}

.outline {
    padding: 0px 5px 0px 6px;
    outline-style: none;

    &.s {
        padding: 0px 4px 0px 5px;
    }

    &.nenoBlue {
        border: 1px solid var(--r-c-nenoBlue);
        color: var(--r-c-nenoBlue);
    }

    &.green {
        border: 1px solid var(--r-c-green);
        color: var(--r-c-green);
    }

    &.dark-green {
        border: 1px solid var(--r-c-dark-green);
        color: var(--r-c-dark-green);
    }

    &.orange {
        border: 1px solid var(--r-c-orange);
        color: var(--r-c-orange);
    }

    &.purple {
        border: 1px solid var(--r-c-purple);
        color: var(--r-c-purple);
    }

    &.purpleBlack {
        border: 1px solid var(--r-c-purpleBlack);
        color: var(--r-c-purpleBlack);
    }

    &.red {
        border: 1px solid var(--r-c-red);
        color: var(--r-c-red);
    }

    &.orangeRed {
        border: 1px solid var(--r-c-orangeRed);
        color: var(--r-c-orangeRed);
    }

    &.blue {
        border: 1px solid var(--r-c-blue);
        color: var(--r-c-blue);
    }

    &.capture {
        border: 1px solid var(--r-c-capture);
        color: var(--r-c-capture);
    }

    &.gray {
        border: 1px solid var(--r-c-gray);
        color: var(--r-c-gray);
    }

    &.primary {
        border: 1px solid var(--color-primary);
        color: var(--color-primary);
    }

    &.male {
        border: 1px solid var(--r-c-male);
        color: var(--r-c-male);
    }

    &.female {
        border: 1px solid var(--r-c-female);
        color: var(--r-c-female);
    }

    // Attendance Color
    &.absent {
        border: 1px solid #FF5F5F;
        color: #FF5F5F;
    }

    &.permission {
        border: 1px solid #8EB53D;
        color: #8EB53D;
    }

    &.late {
        border: 1px solid #C3BC0B;
        color: #C3BC0B;
    }

    &.present {
        border: 1px solid #8EB53D;
        color: #8EB53D;
    }

    &.hospital {
        border: 1px solid #E01919;
        color: #E01919;
    }
}
</style>