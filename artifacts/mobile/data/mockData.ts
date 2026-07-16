export interface Transaction {
  id: string;
  type: 'contribution' | 'loan' | 'expense' | 'repayment' | 'income';
  title: string;
  description: string;
  amount: number;
  currency: string;
  currencySymbol: string;
  date: string;
  memberId: string;
  memberName: string;
  memberInitials: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface Member {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  role: 'admin' | 'treasurer' | 'secretary' | 'member';
  status: 'active' | 'inactive' | 'pending';
  contributionStatus: 'up_to_date' | 'behind' | 'ahead';
  totalContributions: number;
  joinedDate: string;
  avatarColor: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  totalMembers: number;
  status: 'upcoming' | 'completed' | 'cancelled';
}

export interface Loan {
  id: string;
  memberId: string;
  memberName: string;
  memberInitials: string;
  amount: number;
  balance: number;
  currency: string;
  currencySymbol: string;
  interestRate: number;
  disbursedDate: string;
  dueDate: string;
  status: 'active' | 'overdue' | 'settled';
  progress: number;
}

export const TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    type: 'contribution',
    title: 'Monthly Contribution',
    description: 'July 2026 contribution',
    amount: 5000,
    currency: 'KES',
    currencySymbol: 'KSh',
    date: '2026-07-15',
    memberId: '1',
    memberName: 'Sarah Wanjiku',
    memberInitials: 'SW',
    status: 'completed',
  },
  {
    id: 't2',
    type: 'loan',
    title: 'Loan Disbursement',
    description: 'Emergency loan — James Mwangi',
    amount: -45000,
    currency: 'KES',
    currencySymbol: 'KSh',
    date: '2026-07-14',
    memberId: '3',
    memberName: 'James Mwangi',
    memberInitials: 'JM',
    status: 'completed',
  },
  {
    id: 't3',
    type: 'repayment',
    title: 'Loan Repayment',
    description: 'Monthly instalment — Grace Otieno',
    amount: 8500,
    currency: 'KES',
    currencySymbol: 'KSh',
    date: '2026-07-13',
    memberId: '4',
    memberName: 'Grace Otieno',
    memberInitials: 'GO',
    status: 'completed',
  },
  {
    id: 't4',
    type: 'contribution',
    title: 'Monthly Contribution',
    description: 'July 2026 contribution',
    amount: 5000,
    currency: 'KES',
    currencySymbol: 'KSh',
    date: '2026-07-12',
    memberId: '5',
    memberName: 'David Kimani',
    memberInitials: 'DK',
    status: 'completed',
  },
  {
    id: 't5',
    type: 'expense',
    title: 'Meeting Venue',
    description: 'Q2 Annual General Meeting',
    amount: -12000,
    currency: 'KES',
    currencySymbol: 'KSh',
    date: '2026-07-10',
    memberId: '2',
    memberName: 'Mary Njoroge',
    memberInitials: 'MN',
    status: 'completed',
  },
  {
    id: 't6',
    type: 'contribution',
    title: 'Monthly Contribution',
    description: 'July 2026 contribution',
    amount: 5000,
    currency: 'KES',
    currencySymbol: 'KSh',
    date: '2026-07-09',
    memberId: '6',
    memberName: 'Peter Ochieng',
    memberInitials: 'PO',
    status: 'completed',
  },
  {
    id: 't7',
    type: 'loan',
    title: 'Loan Application',
    description: 'School fees loan — Alice Muthoni',
    amount: -30000,
    currency: 'KES',
    currencySymbol: 'KSh',
    date: '2026-07-08',
    memberId: '7',
    memberName: 'Alice Muthoni',
    memberInitials: 'AM',
    status: 'pending',
  },
  {
    id: 't8',
    type: 'income',
    title: 'Investment Returns',
    description: 'Q2 dividend income',
    amount: 18500,
    currency: 'KES',
    currencySymbol: 'KSh',
    date: '2026-07-05',
    memberId: '1',
    memberName: 'Admin',
    memberInitials: 'AD',
    status: 'completed',
  },
];

export const MEMBERS: Member[] = [
  {
    id: '1',
    name: 'Sarah Wanjiku',
    initials: 'SW',
    email: 'sarah@example.com',
    phone: '+254 712 345 678',
    role: 'admin',
    status: 'active',
    contributionStatus: 'up_to_date',
    totalContributions: 60000,
    joinedDate: '2024-01-15',
    avatarColor: '#1B3A6B',
  },
  {
    id: '2',
    name: 'Mary Njoroge',
    initials: 'MN',
    email: 'mary@example.com',
    phone: '+254 723 456 789',
    role: 'treasurer',
    status: 'active',
    contributionStatus: 'up_to_date',
    totalContributions: 60000,
    joinedDate: '2024-01-15',
    avatarColor: '#059669',
  },
  {
    id: '3',
    name: 'James Mwangi',
    initials: 'JM',
    email: 'james@example.com',
    phone: '+254 734 567 890',
    role: 'member',
    status: 'active',
    contributionStatus: 'behind',
    totalContributions: 45000,
    joinedDate: '2024-02-10',
    avatarColor: '#EF4444',
  },
  {
    id: '4',
    name: 'Grace Otieno',
    initials: 'GO',
    email: 'grace@example.com',
    phone: '+254 745 678 901',
    role: 'secretary',
    status: 'active',
    contributionStatus: 'up_to_date',
    totalContributions: 55000,
    joinedDate: '2024-01-20',
    avatarColor: '#6366F1',
  },
  {
    id: '5',
    name: 'David Kimani',
    initials: 'DK',
    email: 'david@example.com',
    phone: '+254 756 789 012',
    role: 'member',
    status: 'active',
    contributionStatus: 'up_to_date',
    totalContributions: 60000,
    joinedDate: '2024-01-15',
    avatarColor: '#F59E0B',
  },
  {
    id: '6',
    name: 'Peter Ochieng',
    initials: 'PO',
    email: 'peter@example.com',
    phone: '+254 767 890 123',
    role: 'member',
    status: 'active',
    contributionStatus: 'ahead',
    totalContributions: 70000,
    joinedDate: '2024-01-15',
    avatarColor: '#2563EB',
  },
  {
    id: '7',
    name: 'Alice Muthoni',
    initials: 'AM',
    email: 'alice@example.com',
    phone: '+254 778 901 234',
    role: 'member',
    status: 'active',
    contributionStatus: 'behind',
    totalContributions: 40000,
    joinedDate: '2024-03-05',
    avatarColor: '#EC4899',
  },
  {
    id: '8',
    name: 'Robert Waweru',
    initials: 'RW',
    email: 'robert@example.com',
    phone: '+254 789 012 345',
    role: 'member',
    status: 'inactive',
    contributionStatus: 'behind',
    totalContributions: 20000,
    joinedDate: '2024-04-01',
    avatarColor: '#64748B',
  },
  {
    id: '9',
    name: 'Lucy Kamau',
    initials: 'LK',
    email: 'lucy@example.com',
    phone: '+254 790 123 456',
    role: 'member',
    status: 'pending',
    contributionStatus: 'up_to_date',
    totalContributions: 5000,
    joinedDate: '2026-07-01',
    avatarColor: '#0891B2',
  },
];

export const MEETINGS: Meeting[] = [
  {
    id: 'm1',
    title: 'Monthly General Meeting',
    date: '2026-07-26',
    time: '2:00 PM',
    location: 'Nairobi Serena Hotel, Boardroom A',
    attendees: 0,
    totalMembers: 24,
    status: 'upcoming',
  },
  {
    id: 'm2',
    title: 'Investment Committee Review',
    date: '2026-08-02',
    time: '10:00 AM',
    location: 'Virtual — Zoom',
    attendees: 0,
    totalMembers: 8,
    status: 'upcoming',
  },
];

export const LOANS: Loan[] = [
  {
    id: 'l1',
    memberId: '3',
    memberName: 'James Mwangi',
    memberInitials: 'JM',
    amount: 45000,
    balance: 38250,
    currency: 'KES',
    currencySymbol: 'KSh',
    interestRate: 10,
    disbursedDate: '2026-07-14',
    dueDate: '2026-10-14',
    status: 'active',
    progress: 0.15,
  },
  {
    id: 'l2',
    memberId: '7',
    memberName: 'Alice Muthoni',
    memberInitials: 'AM',
    amount: 30000,
    balance: 30000,
    currency: 'KES',
    currencySymbol: 'KSh',
    interestRate: 10,
    disbursedDate: '2026-07-08',
    dueDate: '2026-10-08',
    status: 'active',
    progress: 0,
  },
  {
    id: 'l3',
    memberId: '4',
    memberName: 'Grace Otieno',
    memberInitials: 'GO',
    amount: 60000,
    balance: 17000,
    currency: 'KES',
    currencySymbol: 'KSh',
    interestRate: 10,
    disbursedDate: '2026-04-01',
    dueDate: '2026-09-01',
    status: 'active',
    progress: 0.72,
  },
];

export const MONTHLY_CONTRIBUTIONS = [
  { month: 'Feb', amount: 110000 },
  { month: 'Mar', amount: 125000 },
  { month: 'Apr', amount: 118000 },
  { month: 'May', amount: 132000 },
  { month: 'Jun', amount: 140000 },
  { month: 'Jul', amount: 88000 },
];

export function formatCurrency(amount: number, symbol: string, currency: string): string {
  const abs = Math.abs(amount);
  let formatted: string;
  if (abs >= 1_000_000) {
    formatted = `${symbol} ${(abs / 1_000_000).toFixed(2)}M`;
  } else if (abs >= 1_000) {
    formatted = `${symbol} ${abs.toLocaleString('en-KE')}`;
  } else {
    formatted = `${symbol} ${abs.toFixed(2)}`;
  }
  return amount < 0 ? `-${formatted}` : formatted;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
