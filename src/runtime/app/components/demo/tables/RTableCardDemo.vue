
<template>
  <RWrapperPage>
  <RTable
    :data="localData"
    :columns="columnsLocal"
    :showTemplate="true"
    :showSearch="true"
    :options="{paging: true}"
  >
    <template #headerLeft>
        <span class="page-invoice__label">{{ $t('local_data_example') }}</span>
      </template>
      <template #headerApplyFilter>
        <RBtns
          :data="[{ label: $t('apply_filter'), icon: 'ri-filter-line'}]"
          @click="(type, list) => applyFilter()"
        />
      </template>
      <template #headerRight>
        <RBtns
          :data="[{ label: $t('create'), icon: 'ri-add-line'}]"
          @click="(type, list) => { openCreate(type,list); }"
        />
      </template>
    <template #template="{ data }">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <RCard
          v-for="user in data"
          :key="user.Id"
        >
          <template #header>
            <div class="flex items-center gap-3">
              <UAvatar
                :alt="user.Name"
                :text="user.Name.charAt(0)"
              />
              <div>
                <h3 class="font-semibold">
                  {{ user.Name }}
                </h3>
                <p class="text-sm text-gray-500">
                  {{ user.Position }}
                </p>
              </div>
            </div>
          </template>

          <div class="space-y-2">
            <div>
              <span class="font-medium">Email:</span>
              {{ user.Email }}
            </div>

            <div>
              <span class="font-medium">ID:</span>
              {{ user.Id }}
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-2">
              <RBtn
                size="xs"
                icon="i-ri-eye-line"
                color="primary"
                :label="$t('view')"
              />

              <RBtn
                size="xs"
                icon="i-ri-edit-line"
                color="warning"
                variant="soft"
                :label="$t('edit')"
                @click="openEdit"
              />
            </div>
          </template>
        </RCard>
      </div>
    </template>
  </RTable>

 <!-- Create / Edit Drawer -->
    <RSlider
      v-model="showDrawer"
      :title="editing ? 'Edit User' : 'Add User'"
      :dismissible="dismissible"
      @close="closeDrawer"
    >
      <RForm ref="formRef" :schema="formSchema" :state="form" @onSubmit="save">
        <RFormGroup :label="$t('code')" :help="tBy({en:'2-10 character ISO language code', km:'២~១០ តួអក្សរ នៃ ISO language code'}) "required>
          <RInput
            v-model="form.code"
            :placeholder="$t('code')"
            :maxlength="10"
            :required="true"
          />
        </RFormGroup>

        <RFormGroup :label="$t('name')" :help="tBy({en:'Name of the language', km:'ឈ្មោះនៃភាសា'})" required>
          <RInput
            v-model="form.name"
            placeholder="e.g. English, Khmer"
            :required="true"
          />
        </RFormGroup>

        <RFormGroup :label="$t('status')" :help="tBy({en:'Status of the language', km:'ស្ថានភាពនៃភាសា'})" required>
          <RSwitch
            v-model="form.active"
            label="Active"
          />
        </RFormGroup>
      </RForm>
      
      <!-- <template #footer>
        <RBtn color="cancel" :label="$t('cancel')" @click="showDrawer = false" :disabled="saving"/>
        <RBtn color="save" :label="$t('save')" @click="formSubmit" :loading="saving" />
      </template> -->
    </RSlider>
  </RWrapperPage>
</template>

<script setup>
import { ref } from 'vue'
definePageMeta({layout:'navbar'})
useHead({
    title: 'RTable -Card- User',
})

const { t } = useI18n()

// ── Ref to RTable instance (exposes: reload, clearSearch, clearAll, selected, data, total)
const rTable = ref()
import isEqual from 'lodash-es/isEqual'
import cloneDeep from 'lodash-es/cloneDeep'

import { z } from 'zod'
// definePageMeta({ layout: 'navbar', middleware: ['auth'], permission: undefined })
const toast = useToast()
const formRef = ref(null)

const formSchema = z.object({
  name: z.preprocess(
    (v) => v ?? '',
    z.string()
      .trim()
      .min(1, tBy({en:'Name is required',km:'ឈ្មោះមិនអាចទទេបានឡើយ'}))
      .min(2, tBy({en:'Name must be at least 2 characters',km:'ឈ្មោះត្រូវមានយ៉ាងតិច ២ តួអក្សរ'}))
      .max(10, tBy({en:'Name must be at most 10 characters',km:'ឈ្មោះត្រូវមានមិនលើសពី ១០ តួអក្សរ'}))
  ),

  code: z.preprocess(
    (v) => v ?? '',
    z.string()
      .trim()
      .min(1, tBy({en:'Code is required',km:'កូដមិនអាចទទេបានឡើយ'}))
      .min(2, tBy({en:'Code must be at least 2 characters',km:'កូដត្រូវមានយ៉ាងតិច ២ តួអក្សរ'}))
      .max(10, tBy({en:'Code must be at most 10 characters',km:'កូដត្រូវមានមិនលើសពី ១០ តួអក្សរ'}))
  ),
})

const showDrawer = ref(false)
const editing = ref(null)
const saving = ref(false)
const deletingItem = ref(null)
const deleting = ref(false)
const defaultForm = () => ({ code: '', name: '', active: true })
const form = reactive(defaultForm())
const initialForm = ref({})
initialForm.value = cloneDeep(form)

const formatDate = (dt) => dt ? new Date(dt).toLocaleDateString() : '—'

const formSubmit = () => {
  formRef.value.submit()
}

const openCreate = () => {
  editing.value = null
  Object.assign(form, defaultForm())
  initialForm.value = cloneDeep(form)
  showDrawer.value = true
}

function onAction(type, item) {
  if (type === 'edit') openEdit(item)
  else confirmDelete(item)
}

const openEdit = (lang) => {
  showDrawer.value = true
  editing.value = lang
  Object.assign(form, { code: lang.code, name: lang.name, active: lang.active })
  initialForm.value = cloneDeep(form)
}

const closeDrawer = (type) => {
  showDrawer.value = false
  editing.value = null
}

const isDirty = computed(() => {
  return !isEqual(form, initialForm.value)
})

const dismissible = computed(() => {
  return !isDirty.value
})


const confirmDelete = (lang) => {
  deletingItem.value = lang
  confirm.show({
    type: 'delete',
    title: tBy({en:'Delete language', km:'លុបភាសា'}),
    message: tBy({en:`Delete <strong>${lang?.name} (${lang?.code})</strong>? This cannot be undone.`, km:`លុប <strong>${lang?.name} (${lang?.code})</strong>? This cannot be undone.`}),
    onConfirm: async () => {}
  })
}


const localData = ref([
  {
    id: 1,
    Code: 'EMP-0001',
    Name: 'ឫទ្ធិ ដ្រាហ្គន់',
    NameEn: 'Rithy Dragon',
    Description: 'Senior Software Engineer with over 8 years of experience in full-stack development. Specialized in Vue.js, Node.js, and cloud architecture. Strong leader and mentor for junior developers.',
    Position: 'Senior Software Engineer',
    Department: 'Engineering',
    Email: 'rithy.dragon@company.com',
    Phone: '+855 12 345 678',
    Gender: 'Male',
    BirthDate: '1995-08-15',
    JoinDate: '2022-01-10',
    Status: 'Active',
    CreatedBy: 'Admin',
    UpdatedBy: 'HR',
    CreatedAt: '2022-01-10T08:30:00',
    UpdatedAt: '2024-06-20T14:25:00'
  },
  {
    id: 2,
    Code: 'EMP-0002',
    Name: 'សុផា រតនា',
    NameEn: 'Sopha Ratana',
    Description: 'Creative UI/UX Designer passionate about user-centered design. Experienced in building modern interfaces using Figma and Adobe tools. Led multiple successful product redesigns.',
    Position: 'UI/UX Designer',
    Department: 'Design',
    Email: 'sopha.ratana@company.com',
    Phone: '+855 15 678 901',
    Gender: 'Female',
    BirthDate: '1997-03-22',
    JoinDate: '2023-02-15',
    Status: 'Active',
    CreatedBy: 'HR',
    UpdatedBy: 'HR',
    CreatedAt: '2023-02-10T09:15:00',
    UpdatedAt: '2024-06-18T11:40:00'
  },
  {
    id: 3,
    Code: 'EMP-0003',
    Name: 'ម៉្រ ស្រីម៉ុម',
    NameEn: 'Mr Srey Mom',
    Description: 'DevOps Engineer responsible for infrastructure, CI/CD pipelines, and cloud infrastructure. Expert in Kubernetes, Docker, and AWS services.',
    Position: 'DevOps Engineer',
    Department: 'Engineering',
    Email: 'srey.mom@company.com',
    Phone: '+855 11 234 567',
    Gender: 'Male',
    BirthDate: '1994-11-05',
    JoinDate: '2021-06-01',
    Status: 'Active',
    CreatedBy: 'Admin',
    UpdatedBy: 'Engineering',
    CreatedAt: '2021-05-28T16:45:00',
    UpdatedAt: '2024-06-19T08:10:00'
  },
  {
    id: 4,
    Code: 'EMP-0004',
    Name: 'គីមឡេង',
    NameEn: 'Mrs Kimleng',
    Description: 'Digital Marketing Specialist with strong background in performance marketing, SEO, and social media campaigns. Proven track record in increasing brand visibility.',
    Position: 'Marketing Specialist',
    Department: 'Marketing',
    Email: 'kimleng@company.com',
    Phone: '+855 17 890 123',
    Gender: 'Female',
    BirthDate: '1996-07-18',
    JoinDate: '2022-11-15',
    Status: 'Active',
    CreatedBy: 'HR',
    UpdatedBy: 'Marketing',
    CreatedAt: '2022-11-10T10:20:00',
    UpdatedAt: '2024-06-15T17:55:00'
  },
  {
    id: 5,
    Code: 'EMP-0005',
    Name: 'ធារីតា ប៊ុនណា',
    NameEn: 'Tharita Bunna',
    Description: 'Business Analyst with experience in requirement gathering, process improvement, and stakeholder management. Helps bridge the gap between business needs and technical solutions.',
    Position: 'Business Analyst',
    Department: 'Product',
    Email: 'tharita.bunna@company.com',
    Phone: '+855 12 987 654',
    Gender: 'Female',
    BirthDate: '1998-01-30',
    JoinDate: '2023-05-20',
    Status: 'Active',
    CreatedBy: 'HR',
    UpdatedBy: 'Product',
    CreatedAt: '2023-05-15T14:00:00',
    UpdatedAt: '2024-06-20T09:30:00'
  },
  {
    id: 6,
    Code: 'EMP-0006',
    Name: 'វិរៈ សុខា',
    NameEn: 'Virak Sokha',
    Description: 'Full Stack Developer experienced in Laravel, Vue.js, and MySQL. Passionate about writing clean, maintainable code and delivering projects on time.',
    Position: 'Full Stack Developer',
    Department: 'Engineering',
    Email: 'virak.sokha@company.com',
    Phone: '+855 15 456 789',
    Gender: 'Male',
    BirthDate: '1993-12-10',
    JoinDate: '2022-03-01',
    Status: 'Active',
    CreatedBy: 'Admin',
    UpdatedBy: 'HR',
    CreatedAt: '2022-02-25T11:25:00',
    UpdatedAt: '2024-06-21T07:45:00'
  },
  {
    id: 7,
    Code: 'EMP-0007',
    Name: 'សុធារា ចាន់ធី',
    NameEn: 'Sotheara Chanthy',
    Description: 'HR Manager with expertise in talent acquisition, employee engagement, and organizational development. Strong advocate for company culture and employee wellbeing.',
    Position: 'HR Manager',
    Department: 'Human Resources',
    Email: 'sotheara.chanthy@company.com',
    Phone: '+855 11 567 890',
    Gender: 'Female',
    BirthDate: '1992-09-14',
    JoinDate: '2021-08-10',
    Status: 'Active',
    CreatedBy: 'CEO',
    UpdatedBy: 'CEO',
    CreatedAt: '2021-08-05T13:10:00',
    UpdatedAt: '2024-06-10T16:30:00'
  },
  {
    id: 8,
    Code: 'EMP-0008',
    Name: 'ហេង សុវណ្ណា',
    NameEn: 'Heng Sovanna',
    Description: 'Accountant handling financial reporting, budgeting, and tax compliance. Known for accuracy and strong analytical skills.',
    Position: 'Senior Accountant',
    Department: 'Finance',
    Email: 'heng.sovanna@company.com',
    Phone: '+855 17 234 567',
    Gender: 'Female',
    BirthDate: '1995-05-25',
    JoinDate: '2022-09-05',
    Status: 'Active',
    CreatedBy: 'Finance',
    UpdatedBy: 'Finance',
    CreatedAt: '2022-09-01T09:50:00',
    UpdatedAt: '2024-06-05T12:15:00'
  },
  {
    id: 9,
    Code: 'EMP-0009',
    Name: 'លីម សុភា',
    NameEn: 'Lim Sophea',
    Description: 'Product Manager driving product strategy and roadmap. Excellent at prioritizing features and working closely with engineering and design teams.',
    Position: 'Product Manager',
    Department: 'Product',
    Email: 'lim.sophea@company.com',
    Phone: '+855 12 678 901',
    Gender: 'Female',
    BirthDate: '1996-11-08',
    JoinDate: '2023-01-15',
    Status: 'Active',
    CreatedBy: 'CEO',
    UpdatedBy: 'Product',
    CreatedAt: '2023-01-10T15:40:00',
    UpdatedAt: '2024-06-18T10:05:00'
  },
  {
    id: 10,
    Code: 'EMP-0010',
    Name: 'ផាន់ រដ្ឋា',
    NameEn: 'Phan Rotha',
    Description: 'Sales Executive with excellent communication skills and proven ability to close deals in the B2B technology sector.',
    Position: 'Sales Executive',
    Department: 'Sales',
    Email: 'phan.rotha@company.com',
    Phone: '+855 15 890 123',
    Gender: 'Male',
    BirthDate: '1997-04-12',
    JoinDate: '2023-04-01',
    Status: 'Active',
    CreatedBy: 'Sales',
    UpdatedBy: 'Sales',
    CreatedAt: '2023-03-28T08:00:00',
    UpdatedAt: '2024-06-12T14:50:00'
  },
  {
    id: 11,
    Code: 'EMP-0011',
    Name: 'ធីតា សុខុម',
    NameEn: 'Thita Sokhom',
    Description: 'Senior Backend Developer specializing in microservices architecture and database optimization. Experienced with Python, Django, and PostgreSQL.',
    Position: 'Senior Backend Developer',
    Department: 'Engineering',
    Email: 'thita.sokhom@company.com',
    Phone: '+855 12 111 222',
    Gender: 'Female',
    BirthDate: '1994-02-28',
    JoinDate: '2022-06-15',
    Status: 'Active',
    CreatedBy: 'HR',
    UpdatedBy: 'Engineering',
    CreatedAt: '2022-06-10T10:30:00',
    UpdatedAt: '2024-06-19T09:20:00'
  },
  {
    id: 12,
    Code: 'EMP-0012',
    Name: 'សុវណ្ណ រតនៈ',
    NameEn: 'Sovann Ratanak',
    Description: 'Finance Manager overseeing budgeting, forecasting, and financial planning. Strong background in financial analysis and compliance.',
    Position: 'Finance Manager',
    Department: 'Finance',
    Email: 'sovann.ratanak@company.com',
    Phone: '+855 17 333 444',
    Gender: 'Male',
    BirthDate: '1991-07-19',
    JoinDate: '2020-11-01',
    Status: 'Active',
    CreatedBy: 'CEO',
    UpdatedBy: 'Finance',
    CreatedAt: '2020-10-25T13:30:00',
    UpdatedAt: '2024-06-20T13:35:00'
  },
  {
    id: 13,
    Code: 'EMP-0013',
    Name: 'ម៉ាឡៃ រស្មី',
    NameEn: 'Malai Rosmei',
    Description: 'Graphic Designer creating visual assets for marketing campaigns, websites, and product branding.',
    Position: 'Graphic Designer',
    Department: 'Design',
    Email: 'malai.rosmei@company.com',
    Phone: '+855 15 555 666',
    Gender: 'Female',
    BirthDate: '1998-09-05',
    JoinDate: '2023-08-20',
    Status: 'Active',
    CreatedBy: 'HR',
    UpdatedBy: 'Design',
    CreatedAt: '2023-08-15T11:45:00',
    UpdatedAt: '2024-06-19T15:10:00'
  },
  {
    id: 14,
    Code: 'EMP-0014',
    Name: 'គឹម សុខា',
    NameEn: 'Kim Sokha',
    Description: 'Quality Assurance Engineer focused on test automation and ensuring high software quality standards.',
    Position: 'QA Engineer',
    Department: 'Engineering',
    Email: 'kim.sokha@company.com',
    Phone: '+855 11 777 888',
    Gender: 'Male',
    BirthDate: '1995-12-12',
    JoinDate: '2022-04-10',
    Status: 'Active',
    CreatedBy: 'Engineering',
    UpdatedBy: 'Engineering',
    CreatedAt: '2022-04-05T14:20:00',
    UpdatedAt: '2024-06-08T12:00:00'
  },
  {
    id: 15,
    Code: 'EMP-0015',
    Name: 'បូណា វិរៈ',
    NameEn: 'Bona Virak',
    Description: 'Operations Manager responsible for office management, vendor coordination, and facility operations.',
    Position: 'Operations Manager',
    Department: 'Operations',
    Email: 'bona.virak@company.com',
    Phone: '+855 12 999 000',
    Gender: 'Male',
    BirthDate: '1993-03-25',
    JoinDate: '2021-02-15',
    Status: 'Active',
    CreatedBy: 'Admin',
    UpdatedBy: 'Operations',
    CreatedAt: '2021-02-10T09:05:00',
    UpdatedAt: '2024-06-17T16:40:00'
  },
  {
    id: 16,
    Code: 'EMP-0016',
    Name: 'ស្រីនី អ៊ីន',
    NameEn: 'Sreyni In',
    Description: 'Content Marketing Specialist creating engaging content for blogs, social media, and email campaigns.',
    Position: 'Content Marketing Specialist',
    Department: 'Marketing',
    Email: 'sreyni.in@company.com',
    Phone: '+855 15 112 233',
    Gender: 'Female',
    BirthDate: '1997-06-10',
    JoinDate: '2023-07-01',
    Status: 'Active',
    CreatedBy: 'Marketing',
    UpdatedBy: 'Marketing',
    CreatedAt: '2023-06-25T10:50:00',
    UpdatedAt: '2024-06-14T08:55:00'
  },
  {
    id: 17,
    Code: 'EMP-0017',
    Name: 'រ៉ាវី សុភា',
    NameEn: 'Ravy Sophea',
    Description: 'System Administrator managing servers, networks, and IT infrastructure security.',
    Position: 'System Administrator',
    Department: 'IT',
    Email: 'ravy.sophea@company.com',
    Phone: '+855 17 445 566',
    Gender: 'Male',
    BirthDate: '1994-08-08',
    JoinDate: '2022-05-10',
    Status: 'Active',
    CreatedBy: 'IT',
    UpdatedBy: 'IT',
    CreatedAt: '2022-05-05T13:30:00',
    UpdatedAt: '2024-06-19T11:25:00'
  },
  {
    id: 18,
    Code: 'EMP-0018',
    Name: 'ធឿន សុវណ្ណ',
    NameEn: 'Thoeun Sovann',
    Description: 'Talent Acquisition Specialist focused on recruiting top technical talent.',
    Position: 'Talent Acquisition Specialist',
    Department: 'Human Resources',
    Email: 'thoeun.sovann@company.com',
    Phone: '+855 11 778 899',
    Gender: 'Female',
    BirthDate: '1996-04-17',
    JoinDate: '2023-03-05',
    Status: 'Active',
    CreatedBy: 'HR',
    UpdatedBy: 'HR',
    CreatedAt: '2023-03-01T08:40:00',
    UpdatedAt: '2024-06-16T14:15:00'
  },
  {
    id: 19,
    Code: 'EMP-0019',
    Name: 'សុខុម រតនា',
    NameEn: 'Sokhom Ratana',
    Description: 'Data Analyst skilled in SQL, Python, and data visualization tools like Tableau and Power BI.',
    Position: 'Data Analyst',
    Department: 'Data',
    Email: 'sokhom.ratana@company.com',
    Phone: '+855 12 223 344',
    Gender: 'Male',
    BirthDate: '1995-10-22',
    JoinDate: '2022-08-20',
    Status: 'Active',
    CreatedBy: 'Data',
    UpdatedBy: 'Data',
    CreatedAt: '2022-08-15T12:10:00',
    UpdatedAt: '2024-06-20T10:30:00'
  },
  {
    id: 20,
    Code: 'EMP-0020',
    Name: 'ណារិត្តា វណ្ណា',
    NameEn: 'Naritha Vanna',
    Description: 'Cybersecurity Analyst performing vulnerability assessments and security monitoring.',
    Position: 'Cybersecurity Analyst',
    Department: 'IT',
    Email: 'naritha.vanna@company.com',
    Phone: '+855 15 556 677',
    Gender: 'Female',
    BirthDate: '1997-01-15',
    JoinDate: '2023-09-12',
    Status: 'Active',
    CreatedBy: 'Security',
    UpdatedBy: 'Security',
    CreatedAt: '2023-09-08T15:55:00',
    UpdatedAt: '2024-06-07T09:45:00'
  },
  {
    id: 21,
    Code: 'EMP-0021',
    Name: 'ប៉ាក់ សុខា',
    NameEn: 'Pak Sokha',
    Description: 'Customer Success Manager ensuring high customer satisfaction and retention.',
    Position: 'Customer Success Manager',
    Department: 'Sales',
    Email: 'pak.sokha@company.com',
    Phone: '+855 17 889 900',
    Gender: 'Male',
    BirthDate: '1994-05-30',
    JoinDate: '2022-07-01',
    Status: 'Active',
    CreatedBy: 'Sales',
    UpdatedBy: 'Sales',
    CreatedAt: '2022-06-25T11:15:00',
    UpdatedAt: '2024-05-28T13:20:00'
  },
  {
    id: 22,
    Code: 'EMP-0022',
    Name: 'ធីតា សុខុម',
    NameEn: 'Thita Sokhom',
    Description: 'Sustainability Officer working on green initiatives and ESG compliance.',
    Position: 'Sustainability Officer',
    Department: 'Operations',
    Email: 'thita.sokhom2@company.com',
    Phone: '+855 12 334 455',
    Gender: 'Female',
    BirthDate: '1996-02-14',
    JoinDate: '2023-06-10',
    Status: 'Active',
    CreatedBy: 'Operations',
    UpdatedBy: 'Operations',
    CreatedAt: '2023-06-05T14:35:00',
    UpdatedAt: '2024-06-11T17:05:00'
  },
  {
    id: 23,
    Code: 'EMP-0023',
    Name: 'សុវណ្ណ រដ្ឋា',
    NameEn: 'Sovann Rotha',
    Description: 'Business Intelligence Developer creating dashboards and reports.',
    Position: 'BI Developer',
    Department: 'Data',
    Email: 'sovann.rotha@company.com',
    Phone: '+855 15 667 788',
    Gender: 'Male',
    BirthDate: '1993-11-11',
    JoinDate: '2021-12-01',
    Status: 'Active',
    CreatedBy: 'Data',
    UpdatedBy: 'Data',
    CreatedAt: '2021-11-25T09:30:00',
    UpdatedAt: '2024-06-19T12:40:00'
  },
  {
    id: 24,
    Code: 'EMP-0024',
    Name: 'គ្រី សុភា',
    NameEn: 'Kry Sophea',
    Description: 'Event Coordinator handling internal and external company events.',
    Position: 'Event Coordinator',
    Department: 'Marketing',
    Email: 'kry.sophea@company.com',
    Phone: '+855 11 990 011',
    Gender: 'Female',
    BirthDate: '1998-08-20',
    JoinDate: '2023-10-05',
    Status: 'Active',
    CreatedBy: 'HR',
    UpdatedBy: 'HR',
    CreatedAt: '2023-10-01T16:20:00',
    UpdatedAt: '2024-06-20T15:50:00'
  },
  {
    id: 25,
    Code: 'EMP-0025',
    Name: 'វិរៈ សុខុម',
    NameEn: 'Virak Sokhom',
    Description: 'IT Support Specialist providing technical assistance to all employees.',
    Position: 'IT Support Specialist',
    Department: 'IT',
    Email: 'virak.sokhom@company.com',
    Phone: '+855 17 112 233',
    Gender: 'Male',
    BirthDate: '1995-03-03',
    JoinDate: '2022-02-28',
    Status: 'Active',
    CreatedBy: 'IT',
    UpdatedBy: 'IT',
    CreatedAt: '2022-02-20T10:10:00',
    UpdatedAt: '2024-06-02T08:25:00'
  },
  {
    id: 26,
    Code: 'EMP-0026',
    Name: 'សុធា រតនៈ',
    NameEn: 'Sothea Ratanak',
    Description: 'Translator and Localization Specialist for product and marketing materials.',
    Position: 'Localization Specialist',
    Department: 'Product',
    Email: 'sothea.ratanak@company.com',
    Phone: '+855 12 445 566',
    Gender: 'Female',
    BirthDate: '1997-07-07',
    JoinDate: '2023-11-15',
    Status: 'Active',
    CreatedBy: 'Product',
    UpdatedBy: 'Product',
    CreatedAt: '2023-11-10T13:45:00',
    UpdatedAt: '2024-06-13T11:55:00'
  },
  {
    id: 27,
    Code: 'EMP-0027',
    Name: 'ម៉ាលី សុវណ្ណា',
    NameEn: 'Maly Sovanna',
    Description: 'Recruitment Manager handling end-to-end hiring process.',
    Position: 'Recruitment Manager',
    Department: 'Human Resources',
    Email: 'maly.sovanna@company.com',
    Phone: '+855 15 778 899',
    Gender: 'Female',
    BirthDate: '1994-10-10',
    JoinDate: '2021-09-20',
    Status: 'Active',
    CreatedBy: 'HR',
    UpdatedBy: 'HR',
    CreatedAt: '2021-09-15T09:40:00',
    UpdatedAt: '2024-06-20T14:10:00'
  },
  {
    id: 28,
    Code: 'EMP-0028',
    Name: 'ផាន់ ធីតា',
    NameEn: 'Phan Thita',
    Description: 'ERP System Administrator and Trainer.',
    Position: 'ERP Administrator',
    Department: 'Finance',
    Email: 'phan.thita@company.com',
    Phone: '+855 11 223 344',
    Gender: 'Female',
    BirthDate: '1996-05-05',
    JoinDate: '2022-10-10',
    Status: 'Active',
    CreatedBy: 'CTO',
    UpdatedBy: 'CTO',
    CreatedAt: '2022-10-05T17:15:00',
    UpdatedAt: '2024-06-18T10:50:00'
  },
  {
    id: 29,
    Code: 'EMP-0029',
    Name: 'សុខា រស្មី',
    NameEn: 'Sokha Rosmei',
    Description: 'Administrative Assistant supporting multiple departments.',
    Position: 'Administrative Assistant',
    Department: 'Operations',
    Email: 'sokha.rosmei@company.com',
    Phone: '+855 17 556 677',
    Gender: 'Female',
    BirthDate: '1999-01-12',
    JoinDate: '2024-01-05',
    Status: 'Active',
    CreatedBy: 'Admin',
    UpdatedBy: 'Admin',
    CreatedAt: '2024-01-01T08:50:00',
    UpdatedAt: '2024-06-19T07:30:00'
  },
  {
    id: 30,
    Code: 'EMP-0030',
    Name: 'វណ្ណា សុភា',
    NameEn: 'Vanna Sophea',
    Description: 'Digital Transformation Consultant and Project Lead.',
    Position: 'Digital Transformation Lead',
    Department: 'Strategy',
    Email: 'vanna.sophea@company.com',
    Phone: '+855 12 667 788',
    Gender: 'Female',
    BirthDate: '1995-09-09',
    JoinDate: '2022-12-01',
    Status: 'Active',
    CreatedBy: 'CEO',
    UpdatedBy: 'CEO',
    CreatedAt: '2022-11-25T14:25:00',
    UpdatedAt: '2024-06-20T16:00:00'
  },
  {
    id: 31,
    Code: 'EMP-0031',
    Name: 'រ៉ាត់ សុវណ្ណ',
    NameEn: 'Rath Sovann',
    Description: 'Security System Specialist managing physical security infrastructure.',
    Position: 'Security Specialist',
    Department: 'Operations',
    Email: 'rath.sovann@company.com',
    Phone: '+855 15 990 011',
    Gender: 'Male',
    BirthDate: '1993-06-18',
    JoinDate: '2021-04-12',
    Status: 'Active',
    CreatedBy: 'Operations',
    UpdatedBy: 'Operations',
    CreatedAt: '2021-04-05T11:30:00',
    UpdatedAt: '2024-06-21T08:15:00'
  },
  {
    id: 32,
    Code: 'EMP-0032',
    Name: 'សុធារ៉ា រតនា',
    NameEn: 'Sotheara Ratana',
    Description: 'Social Media Manager running campaigns across multiple platforms.',
    Position: 'Social Media Manager',
    Department: 'Marketing',
    Email: 'sotheara.ratana@company.com',
    Phone: '+855 11 334 455',
    Gender: 'Female',
    BirthDate: '1997-11-23',
    JoinDate: '2023-05-15',
    Status: 'Active',
    CreatedBy: 'Marketing',
    UpdatedBy: 'Marketing',
    CreatedAt: '2023-05-10T10:05:00',
    UpdatedAt: '2024-06-17T13:45:00'
  },
  {
    id: 33,
    Code: 'EMP-0033',
    Name: 'គឹម វិរៈ',
    NameEn: 'Kim Virak',
    Description: 'Tax and Compliance Officer.',
    Position: 'Tax & Compliance Officer',
    Department: 'Finance',
    Email: 'kim.virak@company.com',
    Phone: '+855 17 667 788',
    Gender: 'Male',
    BirthDate: '1992-12-30',
    JoinDate: '2020-08-01',
    Status: 'Active',
    CreatedBy: 'Finance',
    UpdatedBy: 'Finance',
    CreatedAt: '2020-07-25T09:20:00',
    UpdatedAt: '2024-06-15T14:30:00'
  },
  {
    id: 34,
    Code: 'EMP-0034',
    Name: 'ស្រីម៉ុម សុខុម',
    NameEn: 'Sreymom Sokhom',
    Description: 'Mobile Device Management and IT Asset Specialist.',
    Position: 'IT Asset Specialist',
    Department: 'IT',
    Email: 'sreymom.sokhom@company.com',
    Phone: '+855 12 889 900',
    Gender: 'Female',
    BirthDate: '1996-03-08',
    JoinDate: '2023-02-01',
    Status: 'Active',
    CreatedBy: 'IT',
    UpdatedBy: 'IT',
    CreatedAt: '2023-01-25T15:10:00',
    UpdatedAt: '2024-06-19T09:55:00'
  },
  {
    id: 35,
    Code: 'EMP-0035',
    Name: 'ធឿន រស្មី',
    NameEn: 'Thoeun Rosmei',
    Description: 'Junior Frontend Developer eager to learn and grow. Strong foundation in HTML, CSS, JavaScript, and Vue.js. Recently completed intensive training program.',
    Position: 'Junior Frontend Developer',
    Department: 'Engineering',
    Email: 'thoeun.rosmei@company.com',
    Phone: '+855 11 345 678',
    Gender: 'Female',
    BirthDate: '2000-06-30',
    JoinDate: '2024-02-20',
    Status: 'Active',
    CreatedBy: 'HR',
    UpdatedBy: 'Engineering',
    CreatedAt: '2024-02-15T12:40:00',
    UpdatedAt: '2024-06-20T11:20:00'
  }
])
const columnsLocal = [
  { key: 'Code',        label: t('code'),           sortable: true, width: 110 },
  { key: 'Name',        label: t('name'),           sortable: true },
  { key: 'NameEn',      label: t('name_en'),        sortable: true },
  { key: 'Position',    label: t('position'),       sortable: true },
  { key: 'Department',  label: t('department'),     sortable: true },
  { key: 'Email',       label: t('email'),          sortable: true },
  { key: 'Phone',       label: t('phone'),          sortable: true },
  { key: 'Gender',      label: t('gender'),         sortable: true, width: 100 },
  { key: 'JoinDate',    label: t('join_date'),      sortable: true },
  { key: 'BirthDate',   label: t('birth_date'),     sortable: true },
  { key: 'Description', label: t('description'),    isClamp: true, width: 100 },
  { key: 'Status',      label: t('status'),         sortable: true },
  { key: 'CreatedBy',   label: t('created_by'),     sortable: true },
  { key: 'UpdatedBy',   label: t('updated_by'),     sortable: true },
  { key: 'CreatedAt',   label: t('created_at'),     sortable: true },
  { key: 'UpdatedAt',   label: t('updated_at'),     sortable: true },
]
</script>
