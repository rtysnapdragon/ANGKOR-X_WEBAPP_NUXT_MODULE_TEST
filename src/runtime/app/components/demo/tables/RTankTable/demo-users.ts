/**
 * Demo user data shared by the page (local tab) and the Nitro mock API (API tab).
 * Deterministic: the same seed always yields the same users.
 */

export interface DemoUser {
  id: number
  name: string
  email: string
  phone: string
  department: string
  role: string
  status: 'Active' | 'Away' | 'Suspended'
  salary: number
  joinedAt: string
  bio: string
}

export const DEPARTMENTS = ['Engineering', 'Design', 'Marketing', 'Sales', 'Support', 'Finance'] as const

const FIRST = ['Sokha', 'Dara', 'Sreyleak', 'Vannak', 'Chantha', 'Pisey', 'Rithy', 'Malis', 'Bopha', 'Kosal', 'Sophea', 'Vichea', 'Nary', 'Samnang', 'Lina', 'Theary', 'Piseth', 'Sovann', 'Kalyan', 'Maly']
const LAST = ['Chan', 'Sok', 'Lim', 'Heng', 'Phan', 'Keo', 'Ly', 'Meas', 'Ouk', 'Pich', 'Seng', 'Tep', 'Yim', 'Chea', 'Han']
const ROLES = ['Developer', 'Team Lead', 'Designer', 'Analyst', 'Manager', 'Specialist', 'Intern']
const STATUSES: DemoUser['status'][] = ['Active', 'Active', 'Active', 'Away', 'Suspended']
const BIOS = [
  'Builds and maintains internal tooling, with a focus on reliability, observability and keeping the on-call rotation quiet.',
  'Leads the weekly planning sync, mentors two junior teammates and owns the quarterly roadmap review with stakeholders.',
  'Specialises in accessibility and design systems; previously shipped a component library used by eight product teams.',
  'Handles escalations from enterprise customers, writes the support playbooks and trains new hires during onboarding.',
  'Runs campaign analytics and attribution reporting, and partners with sales on pipeline forecasting every month.',
  'Owns month-end close, vendor payments and the budget model; automates reconciliations wherever a spreadsheet hurts.',
]

function rng(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

export function createUser(id: number, seed = id): DemoUser {
  const next = rng(seed * 7919 + 13)
  const pick = <T>(list: readonly T[]) => list[Math.floor(next() * list.length)]
  const first = pick(FIRST)
  const last = pick(LAST)
  const joined = new Date(Date.UTC(2021, 0, 1) + Math.floor(next() * 1800) * 86_400_000)

  return {
    id,
    name: `${first} ${last}`,
    email: `${first}.${last}${id}@example.com`.toLowerCase(),
    phone: `+855 ${Math.floor(10 + next() * 89)} ${Math.floor(100 + next() * 899)} ${Math.floor(100 + next() * 899)}`,
    department: pick(DEPARTMENTS),
    role: pick(ROLES),
    status: pick(STATUSES),
    salary: Math.round(3500 + next() * 8500),
    joinedAt: joined.toISOString().slice(0, 10),
    bio: pick(BIOS),
  }
}

export function createUsers(count: number, seed = 1, startId = 1): DemoUser[] {
  return Array.from({ length: count }, (_, i) => createUser(startId + i, seed * 1000 + i))
}

/* ----------------------------- server-side query ---------------------------- */

export interface UserQuery {
  Pages?: number
  Records?: number
  Search?: string
  OrderBy?: string
  OrderDir?: 'ASC' | 'DESC'
  department?: string
}

const SORTABLE = new Set<keyof DemoUser>(['id', 'name', 'email', 'phone', 'department', 'role', 'status', 'salary', 'joinedAt'])
let cache: DemoUser[] | undefined

export function queryUsers(query: UserQuery) {
  cache ??= createUsers(240, 7)
  let rows = cache

  if (query.department) rows = rows.filter((u) => u.department === query.department)

  const search = (query.Search ?? '').trim().toLowerCase()
  if (search) {
    rows = rows.filter((u) =>
      [u.name, u.email, u.department, u.role, u.status].some((value) => value.toLowerCase().includes(search)),
    )
  }

  const key = query.OrderBy as keyof DemoUser | undefined
  if (key && SORTABLE.has(key)) {
    const dir = query.OrderDir === 'DESC' ? -1 : 1
    rows = [...rows].sort((a, b) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0) * dir)
  }

  const total = rows.length
  const ids = rows.map((u) => u.id)
  const records = query.Records && query.Records > 0 ? query.Records : total
  const start = ((query.Pages && query.Pages > 0 ? query.Pages : 1) - 1) * records

  return { total, ids, rows: rows.slice(start, start + records) }
}
