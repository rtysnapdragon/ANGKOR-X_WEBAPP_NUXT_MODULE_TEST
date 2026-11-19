<template>
  <div>
    <fwb-dropdown placement="top" class="ocs-popup-drop-record" close-inside>
        <template #trigger>
          <div class="trigger"><span>{{ model }} <i class="ri-arrow-down-s-line" :class="!!refPopup ? 'isShow' : ''"></i></span></div>
        </template>
        <FwbListGroup class="popup" ref="refPopup">
            <div class="item" v-for="item in items"  @click="fnClick(item)"><span>{{ item }}</span></div>
        </FwbListGroup>
    </fwb-dropdown>
  </div>
</template>

<script setup>
import { FwbDropdown, FwbListGroup, FwbListGroupItem } from "flowbite-vue";
const model = defineModel()
const emit = defineEmits(['select'])
const items = [10,20,50,100]
const refPopup = ref()

function fnClick(val){
  model.value = val
  emit('select')
}
</script>

<style lang="scss">
.ocs-popup-drop-record {
    display: flex;
    grid-gap: 6px;
    user-select: none;
     position: relative;

    .trigger {
      width: 60px;
      height: 32px;
      border-radius: 10px;
      padding: 0px 8px 0px 10px;

      background: var(--bg-content); 
      color: var(--color-w-b-1);
      cursor: pointer;

      span{
        height: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
        line-height: 13px;
        pointer-events: none;
          i{
            font-size: 13px;
            line-height: 13px;
            transition: 0.2s ease-in-out;

            &.isShow{
              transform: rotate(180deg);
            }
          }
      }

    }

      .popup {
        width: 60px;
        min-width: 60px;
        position: absolute;
        padding: 6px 0px;
        background: var(--bg-content);
        border-radius: 10px;
        box-shadow: 0px 6px 20px #0000002d;
        bottom: 4px;
        animation: ani-top 0.2s ease-in-out;
        transform: translateY(6px);
        opacity: 1;
        display: flex;
        flex-direction: column;
        border: none;
      
        @keyframes ani-top {
            from {
                transform: translateY(0px);
                opacity: 0;
            }
          
            to {
                transform: translateY(6px);
                opacity: 1;
            }
        }
        
        .item{
          height: 25px;
          padding: 0px 16px;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          color:var(--color-w-b-1);
          transition: 0.25s ease-in-out;
          
          span{
            pointer-events: none;
          }

          &:hover{
             color:var(--color-primary);
          }
          &.active{
            color:var(--color-primary);
          }
        }
      }
}

.oc-content , .oc-modal{
  .ocs-popup-drop-record {
    .trigger{
      background: var(--bg-wrapper);
    }
    .popup{
      background: var(--bg-wrapper);
    }
  }
}

</style>