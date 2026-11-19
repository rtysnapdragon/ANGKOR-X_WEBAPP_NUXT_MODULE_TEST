<template>
  <UPagination v-model="page" :page-count="pageCount" :total="total" @click="changePagination(page)" show-last
    show-first />
</template>

<script setup>
const props = defineProps(['table', 'pageCount', 'total'])
const page = defineModel('page')
const table = computed(() => props.table)
const pageCount = computed(() => props.pageCount)
const total = computed(() => props.total)
function changePagination(page) {
  table.value.page(page - 1).draw('page');
}
</script>

<style></style>