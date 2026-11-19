<template>
  <div class="demo-page">
    <header class="demo-page__head">
      <h1>Button components</h1>
      <p>
        Live demos and usage notes for the four button components. Each page shows every prop, state and combination,
        the code that produces it, and the gotchas to avoid.
      </p>
    </header>

    <div class="demo-grid">
      <NuxtLink v-for="c in components" :key="c.to" :to="c.to" target="_blank" class="demo-link">
        <RCard class="demo-tile">
          <div class="demo-tile__icon"><i :class="c.icon" /></div>
          <h3>{{ c.name }}</h3>
          <p>{{ c.text }}</p>
          <ul>
            <li v-for="u in c.uses" :key="u">{{ u }}</li>
          </ul>
          <span class="demo-tile__go">Open demo <i class="ri-arrow-right-line" /></span>
        </RCard>
      </NuxtLink>
    </div>

    <DemoCase title="Which one do I use?" layout="column">
      <table class="demo-table">
        <thead><tr><th>I need…</th><th>Use</th></tr></thead>
        <tbody>
          <tr v-for="r in choose" :key="r[0]"><td>{{ r[0] }}</td><td><code>{{ r[1] }}</code></td></tr>
        </tbody>
      </table>
    </DemoCase>

    <DemoCase title="Things that apply to all of them" layout="column">
      <ol class="demo-rules">
        <li>
          <b>Permissions.</b> Buttons check <code>menuStore.getActionPermission(permission)</code>. Value <code>1</code> = allowed. Not
          allowed: a warning toast (and no event) unless <code>showIfAllowed</code> is false, which hides the control. The demos use
          the key <code>demo.buttons</code>; set it (or change the constant at the top of each demo page) so clicks go through.
        </li>
        <li>
          <b>Bind booleans.</b> RBtn, RBtns, RTblBtns and RTblChip declare props as untyped arrays, so write
          <code>:disabled="true"</code> not <code>disabled</code>. Inside <code>data</code> / <code>items</code> objects use real booleans.
        </li>
        <li>
          <b>Client-only parts.</b> <code>RTblBtns</code> and <code>RTblChip</code> touch <code>window</code> / <code>document</code> while being
          created: render them inside <code>&lt;ClientOnly&gt;</code>.
        </li>
        <li>
          <b>Icons.</b> Remix Icon classes (<code>ri-…</code>) everywhere, with keyword shortcuts for common actions.
        </li>
      </ol>
    </DemoCase>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'navbar'})

const components = [
  {
    name: 'RBtn',
    to: '/demo/buttons/rbtn',
    icon: 'ri-cursor-line',
    text: 'The single action button.',
    uses: ['Forms, toolbars, dialogs', 'Solid / outline, 3 sizes', 'Loading, disabled, permissions'],
  },
  {
    name: 'RBtns',
    to: '/demo/buttons/rbtns',
    icon: 'ri-apps-line',
    text: 'A group of RBtn from one array.',
    uses: ['Page headers with several actions', 'Inline or 3-dot menu', 'One click event (type, item)'],
  },
  {
    name: 'RTblBtns',
    to: '/demo/buttons/rtblbtns',
    icon: 'ri-table-line',
    text: 'Icon buttons for table rows.',
    uses: ['Tooltip per action', 'Auto "more" menu', 'Colour palette per action'],
  },
  {
    name: 'RTblChip',
    to: '/demo/buttons/rtblchip',
    icon: 'ri-price-tag-3-line',
    text: 'Removable chips for filters.',
    uses: ['Active filters above a table', 'Avatars, locked chips', 'Remember chips with state-key'],
  },
]

const choose = [
  ['One labelled action (Save, Create, Delete)', 'RBtn'],
  ['Several labelled actions in a page header', 'RBtns'],
  ['Everything behind one 3-dot menu', 'RBtns :three-dot-only="true"'],
  ['Compact icon actions on a table row', 'RTblBtns'],
  ['Show and remove active filters or selected people', 'RTblChip'],
]
</script>

<style lang="scss" scoped>
.demo-page {
  max-width: 1040px;
  margin: 0 auto;
  padding: 0 16px 48px;

  &__head {
    margin-bottom: 18px;

    h1 {
      margin: 0 0 4px;
      font-size: 24px;
      font-weight: 700;
    }

    p {
      max-width: 72ch;
      margin: 0;
      font-size: 14px;
      line-height: 1.6;
      color: var(--c-muted, var(--ui-text-muted));
    }
  }
}

code {
  padding: 1px 5px;
  border-radius: 5px;
  background: color-mix(in srgb, var(--c-accent, #6366f1) 10%, transparent);
  font-size: 0.92em;
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.demo-link {
  display: block;
  color: inherit;
  text-decoration: none;
}

.demo-tile {
  height: 100%;
  transition:
    transform 0.2s,
    box-shadow 0.2s;

  h3 {
    margin: 10px 0 2px;
    font-size: 16px;
    font-weight: 600;
  }

  p {
    margin: 0 0 8px;
    font-size: 13px;
    color: var(--c-muted, var(--ui-text-muted));
  }

  ul {
    margin: 0 0 12px;
    padding-left: 16px;
    font-size: 12.5px;
    line-height: 1.7;
  }

  &__icon {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--c-accent, #6366f1) 12%, transparent);
    color: var(--c-accent, #6366f1);
    font-size: 19px;
  }

  &__go {
    font-size: 12.5px;
    font-weight: 500;
    color: var(--c-accent, #6366f1);
  }
}

.demo-link:hover .demo-tile {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px -12px color-mix(in srgb, var(--c-accent, #6366f1) 45%, transparent);
}

.demo-rules {
  margin: 0;
  padding-left: 20px;
  font-size: 13.5px;
  line-height: 1.7;

  li + li {
    margin-top: 6px;
  }
}

.demo-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  th,
  td {
    padding: 8px 10px;
    border-bottom: 1px solid var(--c-border, var(--ui-border));
    text-align: left;
  }

  th {
    font-weight: 600;
    color: var(--c-muted, var(--ui-text-muted));
  }
}

@media (prefers-reduced-motion: reduce) {
  .demo-tile {
    transition: none;
  }
}
</style>
