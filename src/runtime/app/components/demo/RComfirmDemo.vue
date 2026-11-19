
<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold">Confirm Examples</h1>
      <p class="text-sm text-gray-500">
        Examples of RConfirm dialog usage.
      </p>
    </div>

    <!-- Basic Confirmations -->
    <UCard>
      <template #header>
        <h3 class="font-semibold">1. Basic Confirmations</h3>
      </template>

      <div class="flex flex-wrap gap-2">
        <UButton @click="showConfirm('confirm')">
          Confirm
        </UButton>

        <UButton color="error" @click="showConfirm('delete')">
          Delete
        </UButton>

        <UButton color="success" @click="showConfirm('create')">
          Create
        </UButton>

        <UButton color="info" @click="showConfirm('update')">
          Update
        </UButton>

        <UButton color="primary" @click="showConfirm('save')">
          Save
        </UButton>

        <UButton color="warning" @click="showConfirm('warning')">
          Warning
        </UButton>

        <UButton color="neutral" @click="showConfirm('info')">
          Information
        </UButton>

        <UButton variant="outline" @click="showConfirm('view')">
          View
        </UButton>

        <UButton variant="outline" @click="showConfirm('custom')">
          Custom
        </UButton>

        <UButton @click="showConfirm('vnode')">
          Show RConfirm with VNode
        </UButton>

        <UButton @click="showConfirm('html')">
          Show RConfirm with html
        </UButton>

        <UButton @click="showConfirm('component')">
          Show RConfirm with component
        </UButton>
        <UButton @click="showConfirm('deleteVNode')">
          deleteVNode
        </UButton>
        <UButton @click="showConfirm('deleteVNode2')">
          deleteVNode2
        </UButton>
        <RBtn type="delete" color="delete" label="Delete user" @click="showConfirm('deleteUser')" />
      </div>
    </UCard>

    <!-- Custom Description -->
    <UCard>
      <template #header>
        <h3 class="font-semibold">2. Custom Vue Template Description</h3>
      </template>

      <div class="space-y-3">
        <p class="text-sm text-gray-500">
          Render a Vue component inside the confirmation dialog.
        </p>

        <UButton color="error" @click="showCustomDescription">
          Show Custom Description
        </UButton>
      </div>
    </UCard>

    <!-- HTML Description -->
    <UCard>
      <template #header>
        <h3 class="font-semibold">3. Rich HTML Description</h3>
      </template>

      <UButton @click="showHtmlDescription">
        Show HTML Description
      </UButton>
    </UCard>

    <!-- API Callback -->
    <UCard>
      <template #header>
        <h3 class="font-semibold">4. Async API Confirmation</h3>
      </template>

      <div class="space-y-3">
        <p class="text-sm text-gray-500">
          Simulate API request with loading and error handling.
        </p>

        <UButton
          :loading="apiTesting"
          color="success"
          @click="showApiConfirm"
        >
          Test API Confirmation
        </UButton>
      </div>
    </UCard>

    <!-- Cancel -->
    <UCard>
      <template #header>
        <h3 class="font-semibold">5. Cancel Callback</h3>
      </template>

      <UButton color="warning" @click="showCancelConfirm">
        Test Cancel Callback
      </UButton>
    </UCard>

    <UCard>
      <template #header>
        <h3 class="font-semibold">6. TemplateRender Callback</h3>
      </template>

      <UButton color="warning" @click="templateRender">
        Test TemplateRender
      </UButton>
    </UCard>

    <!-- Persistent -->
    <UCard>
      <template #header>
        <h3 class="font-semibold">6. Persistent Dialog</h3>
      </template>

      <UButton @click="showPersistent">
        Show Persistent Dialog
      </UButton>
    </UCard>

    <!-- Form Example -->
    <UCard>
      <template #header>
        <h3 class="font-semibold">7. Confirm Form Submission</h3>
      </template>

      <UForm :state="form" @submit="submitForm">
        <div class="space-y-3">
          <UFormField label="Name" name="name">
            <UInput v-model="form.name" class="w-full" />
          </UFormField>

          <UFormField label="Email" name="email">
            <UInput v-model="form.email" type="email" class="w-full" />
          </UFormField>

          <UButton type="submit">
            Submit Form
          </UButton>
        </div>
      </UForm>
    </UCard>

    <!-- Result -->
    <UCard>
      <template #header>
        <h3 class="font-semibold">8. Action Logs</h3>
      </template>

      <div class="space-y-2">
        <div
          v-for="(log, index) in logs"
          :key="index"
          class="text-sm border-b border-default pb-2"
        >
          {{ log }}
        </div>

        <UButton
          size="sm"
          color="neutral"
          variant="outline"
          @click="logs = []"
        >
          Clear Logs
        </UButton>
      </div>
    </UCard>
  </div>
</template>

<script setup>
import DeleteDescription from './test/confirm/DeleteDescription.vue'
import RRecordPreview from './test/confirm/RRecordPreview.vue'
import { h } from 'vue'

const confirmStore = useConfirmStore()

const logs = ref([])
const apiTesting = ref(false)

const form = reactive({
  name: '',
  email: ''
})

function log(message) {
  logs.value.unshift(
    `${new Date().toLocaleTimeString()} - ${message}`
  )
}

const createDeletePreview = (record) => {
  const details = [
    { label: 'Record ID', value: record.id ?? '—' },
    { label: 'Category', value: record.category ?? '—' },
    { label: 'Created', value: record.createdAt ?? '—' },
    { label: 'Status', value: record.status ?? '—' }
  ]

  return h('div', { class: 'flex flex-col gap-4' }, [
    // Record preview
    h('div', {
      class: 'rounded-xl border p-4 flex flex-col gap-3',
      style: 'border-color:var(--c-border)'
    }, [
      h('span', {
        class: 'text-xs font-semibold opacity-60'
      }, 'RECORD PREVIEW'),

      h('div', {
        class: 'flex items-center gap-3'
      }, [
        record.thumbnailUrl
          ? h('img', {
              src: record.thumbnailUrl,
              alt: record.name || 'Record',
              class: 'w-14 h-14 rounded-xl object-cover'
            })
          : h('div', {
              class: 'w-14 h-14 rounded-xl flex items-center justify-center',
              style: 'background:var(--c-surface-secondary)'
            }, [
              h('i', {
                class: 'ri-file-list-3-line text-2xl'
              })
            ]),

        h('div', { class: 'flex flex-col gap-1 min-w-0' }, [
          h('strong', {
            class: 'text-base truncate'
          }, record.name || 'Unnamed record'),

          h('span', {
            class: 'text-xs opacity-60'
          }, record.category || 'Record')
        ])
      ]),

      h('div', {
        class: 'grid grid-cols-2 gap-3 pt-3',
        style: 'border-top:1px solid var(--c-border)'
      }, details.map(item =>
        h('div', { class: 'flex flex-col gap-1 min-w-0' }, [
          h('span', {
            class: 'text-xs opacity-60'
          }, item.label),

          h('span', {
            class: 'text-sm font-medium break-words'
          }, String(item.value))
        ])
      ))
    ]),

    // Description
    record.description
      ? h('p', {
          class: 'text-sm opacity-70'
        }, record.description)
      : null,

    // Warning
    h('div', {
      class: 'flex items-start gap-2 rounded-xl p-3',
      style: 'background:color-mix(in srgb, #ef4444 8%, transparent)'
    }, [
      h('i', {
        class: 'ri-alert-line text-lg shrink-0',
        style: 'color:#ef4444'
      }),

      h('div', { class: 'flex flex-col gap-1' }, [
        h('strong', {
          class: 'text-sm',
          style: 'color:#ef4444'
        }, 'Permanent deletion'),

        h('p', {
          class: 'text-sm opacity-70'
        }, 'This record will be permanently deleted. This action cannot be undone.')
      ])
    ])
  ])
}

const user = {
  id: 'USR-000128',
  name: 'Rithy',
  email: 'rithy@example.com',
  role: 'Administrator',
  status: 'Active',
  createdAt: '20 Oct 2026',
  avatar: '/images/avatar.png'
}

const userPreview = h(RRecordPreview, {
  title: user.name,
  subtitle: user.email,
  image: user.avatar,
  icon: 'ri-user-line',

  status: {
    label: user.status,
    variant: 'success'
  },

  fields: [
    { label: 'User ID', value: user.id },
    { label: 'Email', value: user.email },
    { label: 'Role', value: user.role },
    { label: 'Created', value: user.createdAt }
  ],

  warningTitle: 'Permanent deletion',
  warningMessage: 'This user account will be permanently deleted.'
})

// 1. All basic confirmation types
function showConfirm(type) {
  const config = {
    confirm: {
      title: 'Confirm Action',
      description: 'Do you want to continue?'
    },
    delete: {
      title: 'Delete Record',
      description: 'Are you sure you want to delete this record?'
    },
    create: {
      title: 'Create Record',
      description: 'Do you want to create this record?'
    },
    update: {
      title: 'Update Record',
      description: 'Do you want to update this record?'
    },
    save: {
      title: 'Save Changes',
      description: 'Do you want to save your changes?'
    },
    warning: {
      title: 'Warning',
      description: 'Please review this action before continuing.'
    },
    info: {
      title: 'Information',
      description: 'This is an information dialog.'
    },
    view: {
      title: 'View Details',
      description: 'Do you want to view this record?'
    },
    custom: {
      title: 'Custom Action',
      description: 'Do you want to execute this custom action?',
      labelBtn: 'Continue'
    },
    vnode: {
      type: 'vnode',
      title: 'View Delete Item',
      description: h('p', {}, [
        'Delete ',
        h('strong', {}, 'Rithy'),
        ' permanently?'
      ]),
      labelBtn: 'Delete'
    },

    deleteVNode :{
        type: 'vnode',
        title: 'Delete this item?',
        description: h('div', {
            class: 'flex flex-col gap-4'
        }, [
            // Selected item
            h('div', {
            class: 'flex items-center gap-3 rounded-xl p-3',
            style: 'background:var(--c-surface-secondary)'
            }, [
            h('div', {
                class: 'flex items-center justify-center rounded-lg',
                style: 'width:40px;height:40px;background:var(--c-surface)'
            }, [
                h('i', {
                class: 'ri-user-line text-xl'
                })
            ]),
            h('div', { class: 'flex flex-col gap-1' }, [
                h('span', {
                class: 'text-xs opacity-60'
                }, 'ITEM TO DELETE'),
                h('strong', {
                class: 'font-semibold'
                }, 'Rithy')
            ])
            ]),

            // Warning
            h('div', {
            class: 'flex items-start gap-2 rounded-xl p-3',
            style: 'background:color-mix(in srgb, #ef4444 8%, transparent)'
            }, [
            h('i', {
                class: 'ri-alert-line text-lg',
                style: 'color:#ef4444'
            }),
            h('div', { class: 'flex flex-col gap-1' }, [
                h('strong', {
                class: 'text-sm',
                style: 'color:#ef4444'
                }, 'This action cannot be undone.'),

                h('p', {
                class: 'text-sm opacity-70'
                }, 'The selected item will be permanently removed from your records.')
            ])
            ])
        ]),
        labelBtn: 'Delete permanently'
    },

    deleteVNode2 :{
        type: 'vnode',
        title: 'Delete this item?',
        description: createDeletePreview({
            id: 'USR-000128',
            name: 'Luxury Camera Model X',
            thumbnailUrl:
            'https://images.unsplash.com/photo-1526170755737-f0e3bc94114e?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400',
            category: 'Photography',
            status: 'active',
            createdAt: '2025-10-26T10:00:00Z',
            description: 'High-end camera equipment ready for sale.'
        }),
        labelBtn: 'Delete permanently',
        onConfirm: async () => {
            log('Delete permanently confirmed')
        },
        onCancel: async () => {
            log('Delete permanently cancelled')
        }
    },
    deleteUser: {
        type: 'warning',
        title: 'Delete this user?',
        description: userPreview,
        labelBtn: 'Delete user',
        onConfirm: async () => {
            await userService.delete(user.id)
            return
        }
    },

    html: {
      type: 'html',
      title: 'View Delete Item',
      description: '<strong class="text-red-500">Cannot be undone!</strong>',
      labelBtn: 'Delete'
    },

    component: {
      type: 'component',
      title: 'View Delete Item',
      description: DeleteDescription,
      descriptionProps: {
        name: 'Rithy',
        count: 5
      },
      labelBtn: 'Delete'
    }
  }

  confirmStore.show({
    type,
    ...config[type],

    onConfirm: async () => {
      log(`${type.toUpperCase()} confirmed`)
    },

    onCancel: async () => {
      log(`${type.toUpperCase()} cancelled`)
    }
  })
}

// 2. Custom Vue component description
function showCustomDescription() {
  confirmStore.show({
    type: 'delete',
    title: 'Delete Academic Setting',

    descriptionComponent: DeleteDescription,

    descriptionProps: {
      name: 'Academic Setting',
      count: 5
    },

    onConfirm: async () => {
      log('Custom description confirmed')
    }
  })
}


function templateRender() {
confirmStore.show({
  type: 'delete',
  title: 'gifts.delete_gift_record',

  description: h(
    'p',
    {
      style: 'margin-bottom:var(--sp-5);color:var(--c-muted)'
    },
    [
      'gifts.delete_gift_from',
      h('strong', {}, '1212'),
      ' ($121221212)',
      'common.cannot_be_undone'
    ]
  ),

  onConfirm: async () => {
    // await doDelete(rowData)
    log('TemplateRender confirmed')
  }
})
}

// 3. Rich HTML description
function showHtmlDescription() {
  confirmStore.show({
    type: 'confirm',
    title: 'Review Information',

    description: `
      <div class="space-y-2">
        <p>Are you sure you want to continue?</p>
        <strong class="text-primary">
          Please review before proceeding.
        </strong>
      </div>
    `,

    onConfirm: async () => {
      log('HTML description confirmed')
    }
  })
}

// 4. Async API simulation
function showApiConfirm() {
  confirmStore.show({
    type: 'update',
    title: 'Update Database',
    description: 'Are you sure you want to update this record?',

    onConfirm: async () => {
      apiTesting.value = true

      try {
        await new Promise(resolve => setTimeout(resolve, 2000))

        log('API request successful')
      } catch (error) {
        log('API request failed')
        throw error
      } finally {
        apiTesting.value = false
      }
    }
  })
}

// 5. Cancel callback
function showCancelConfirm() {
  confirmStore.show({
    type: 'confirm',
    title: 'Cancel Operation',
    description: 'Do you want to continue or cancel?',

    onConfirm: async () => {
      log('Operation continued')
    },

    onCancel: async () => {
      log('Cancel callback executed')
    }
  })
}

// 6. Persistent dialog
function showPersistent() {
  confirmStore.show({
    type: 'warning',
    title: 'Important Confirmation',
    description: 'You must explicitly select an action.',
    persistent: true,

    onConfirm: async () => {
      log('Persistent dialog confirmed')
    }
  })
}

// 7. Form submission
function submitForm() {
  confirmStore.show({
    type: 'save',
    title: 'Submit Form',
    description: `
      Name: ${form.name}
      Email: ${form.email}
    `,

    onConfirm: async () => {
      log(`Form submitted: ${form.name}`)
      // await $fetch('/api/users', {
      //   method: 'POST',
      //   body: form
      // })
    }
  })
}
</script>
