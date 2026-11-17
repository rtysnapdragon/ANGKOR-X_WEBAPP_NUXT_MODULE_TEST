<script setup>
// defineOptions({ name: 'RTableMobileCard' })

const props = defineProps([
  'rows', 
  'columns', 
  'loading'
])

const rows = computed(() => props.rows ?? [])
const columns = computed(() => props.columns)
const loading = computed(() => props.loading)
const { t } = useI18n()
</script>

<template>
  <div class="r-table-cards" role="list">

    <!-- Loading -->
    <div v-if="loading" class="r-table-cards__loader" aria-busy="true">
      <UIcon name="i-ri-loader-4-line" class="r-table-cards__spinner" />
    </div>

    <!-- Cards -->
    <template v-else-if="rows.length">
      <article
        v-for="(row, idx) in rows"
        :key="row?.Id ?? row?.id ?? idx"
        class="r-table-cards__item"
        role="listitem"
      >
        <!-- Full card override from parent -->
        <slot name="card" :row="row" :index="idx">
          <!-- Auto-generated card from column definitions -->
          <RCard class="r-table-cards__card">
            <div
              v-for="col in columns"
              :key="col.key"
              class="r-table-cards__field"
            >
              <span class="r-table-cards__label">{{ col.label ?? col.key }}</span>
              <span class="r-table-cards__value">
                <slot :name="col.key" :row="row" :value="row[col.key]">
                  {{ row[col.key] ?? '—' }}
                </slot>
              </span>
            </div>

            <div v-if="$slots.actions" class="r-table-cards__actions">
              <slot name="actions" :row="row" :index="idx" />
            </div>
          </RCard>
        </slot>
      </article>
    </template>

    <!-- Empty -->
    <div v-else class="r-table-cards__empty" role="status">
      <UIcon name="i-ri-database-2-line" />
      <span>{{ t('data_not_found') }}</span>
    </div>

  </div>
</template>

<style lang="scss" scoped>
@mixin respond-to($bp) {
  @if $bp == tablet  { @media (min-width: 768px) and (max-width: 1023px) { @content; } }
}
@mixin flex-center  { display: flex; align-items: center; justify-content: center; }

.r-table-cards {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem;
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;

  @include respond-to(tablet) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }

  &__loader {
    @include flex-center;
    padding: 2.5rem;
    color: var(--ui-text-muted);
  }

  &__spinner {
    width: 1.5rem;
    height: 1.5rem;
    animation: card-spin 0.75s linear infinite;
  }

  @keyframes card-spin { to { transform: rotate(360deg); } }

  &__item { width: 100%; }

  &__card { width: 100%; }

  &__field {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.375rem 0;
    font-size: 0.875rem;
    border-bottom: 1px solid color-mix(in srgb, var(--ui-border) 50%, transparent);

    &:last-of-type { border-bottom: none; }
  }

  &__label {
    font-weight: 600;
    color: var(--ui-text-muted);
    flex-shrink: 0;
    max-width: 45%;
  }

  &__value {
    color: var(--ui-text);
    text-align: right;
    word-break: break-word;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.375rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--ui-border);
    flex-wrap: wrap;
  }

  &__empty {
    @include flex-center;
    flex-direction: column;
    gap: 0.5rem;
    padding: 3rem 1rem;
    color: var(--ui-text-muted);
    font-size: 0.875rem;
  }
}
</style>