/**
 * Demo employees for RTableTankDemo (local tab).
 * Deterministic: same output on every load. Every row has a unique `Id` (selected-pk).
 */

export interface DemoEmployee {
  Id: number
  Code: string
  Name: string
  NameEn: string
  Description: string
  Position: string
  Department: string
  Email: string
  Phone: string
  Gender: 'Male' | 'Female'
  BirthDate: string
  JoinDate: string
  Status: 'Active' | 'Away' | 'Suspended'
  Avatar: string
  CreatedBy: string
  UpdatedBy: string
  CreatedAt: string
  UpdatedAt: string
  Salary: string
}

const KM_FIRST = ['សុខា', 'ដារា', 'ស្រីលក្ខណ៍', 'វណ្ណៈ', 'ចន្ថា', 'ពិសី', 'រិទ្ធី', 'ម៉ាលីស', 'បុប្ផា', 'កុសល']
const KM_LAST = ['ចាន់', 'សុខ', 'លឹម', 'ហេង', 'ផាន់', 'កែវ', 'លី', 'មាស']
const EN_FIRST = ['Sokha', 'Dara', 'Sreyleak', 'Vannak', 'Chantha', 'Pisey', 'Rithy', 'Malis', 'Bopha', 'Kosal']
const EN_LAST = ['Chan', 'Sok', 'Lim', 'Heng', 'Phan', 'Keo', 'Ly', 'Meas']
const DEPARTMENTS = ['Engineering', 'Design', 'Marketing', 'Sales', 'Finance', 'Human Resources', 'IT', 'Operations']
const POSITIONS = ['Software Engineer', 'UI/UX Designer', 'Marketing Specialist', 'Sales Executive', 'Accountant', 'HR Officer', 'System Administrator', 'Project Manager']
const STATUSES: DemoEmployee['Status'][] = ['Active', 'Active', 'Active', 'Away', 'Suspended']
const DESCRIPTIONS = [
  'Builds and maintains internal tooling with a focus on reliability and observability.',
  'Leads the weekly planning sync and mentors junior teammates across the department.',
  'Specialises in accessibility and design systems used by multiple product teams.',
  'Handles escalations from enterprise customers and writes the team support playbooks.',
  'Owns month-end close, vendor payments and the budget model for the quarter.',
]

const pad = (n: number, size = 2) => String(n).padStart(size, '0')
const isoDate = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`

function createEmployee(id: number): DemoEmployee {
  const i = id - 1
  const male = i % 2 === 0
  const joinYear = 2019 + (i % 6)
  const joinMonth = 1 + (i % 12)
  const joinDay = 1 + ((i * 7) % 28)
  const dept = DEPARTMENTS[i % DEPARTMENTS.length]
  const enFirst = EN_FIRST[i % EN_FIRST.length]
  const enLast = EN_LAST[(i * 3) % EN_LAST.length]

  return {
    Id: id,
    Code: `EMP-${pad(id, 4)}`,
    Name: `${KM_LAST[(i * 3) % KM_LAST.length]} ${KM_FIRST[i % KM_FIRST.length]}`,
    NameEn: `${enFirst} ${enLast}`,
    Description: DESCRIPTIONS[i % DESCRIPTIONS.length],
    Position: POSITIONS[i % POSITIONS.length],
    Department: dept,
    Email: `${enFirst}.${enLast}${id}@company.com`.toLowerCase(),
    Phone: `+855 ${10 + (i % 80)} ${100 + ((i * 37) % 900)} ${100 + ((i * 91) % 900)}`,
    Gender: male ? 'Male' : 'Female',
    BirthDate: isoDate(1988 + (i % 12), 1 + ((i * 5) % 12), 1 + ((i * 11) % 28)),
    JoinDate: isoDate(joinYear, joinMonth, joinDay),
    Status: STATUSES[i % STATUSES.length],
    Avatar: `https://randomuser.me/api/portraits/${male ? 'men' : 'women'}/${i % 90}.jpg`,
    CreatedBy: i % 3 === 0 ? 'Admin' : 'HR',
    UpdatedBy: dept,
    CreatedAt: `${isoDate(joinYear, joinMonth, joinDay)}T08:30:00`,
    UpdatedAt: `${isoDate(2026, 1 + (i % 11), 1 + (i % 28))}T14:25:00`,
    Salary: `$${(1200 + ((i * 137) % 2400)).toLocaleString('en-US')}`,
  }
}

export const employees: DemoEmployee[] = Array.from({ length: 100 }, (_, i) => createEmployee(i + 1))
