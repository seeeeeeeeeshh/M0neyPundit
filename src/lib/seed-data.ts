// Seed data for M0neyPundit

export interface Deal {
  id: string;
  title: string;
  description: string;
  discount: string;
  category: 'food' | 'tech' | 'events' | 'transport';
  location: string;
  expiryDate: string;
  isPopular: boolean;
}

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  type: 'sell' | 'buy' | 'borrow' | 'rent';
  category: string;
  price: number;
  condition: string;
  seller: string;
  location: string;
  image: string;
}

export interface SideHustle {
  id: string;
  title: string;
  description: string;
  hourlyRate: number;
  type: 'part-time' | 'freelance' | 'tutoring' | 'gig';
  location: string;
  schedule: string;
  skills: string[];
  urgency: 'high' | 'medium' | 'low';
}

export interface SpendingCategory {
  category: string;
  amount: number;
  limit: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export const deals: Deal[] = [
  {
    id: 'd1',
    title: '50% Off Noodles at Food Court B1',
    description: 'Show your student ID for 50% off all noodle dishes during lunch hours (11am-2pm)',
    discount: '50%',
    category: 'food',
    location: 'Block B, Food Court B1',
    expiryDate: '2026-07-15',
    isPopular: true,
  },
  {
    id: 'd2',
    title: 'Free Coffee Wednesdays',
    description: 'Buy 1 get 1 free on all beverages every Wednesday at Campus Café',
    discount: 'BOGO',
    category: 'food',
    location: 'Campus Café, Level 1',
    expiryDate: '2026-08-01',
    isPopular: true,
  },
  {
    id: 'd3',
    title: '20% Off All Tech Accessories',
    description: 'Student discount on chargers, cables, mouse, keyboards and more',
    discount: '20%',
    category: 'tech',
    location: 'Campus Bookstore',
    expiryDate: '2026-07-30',
    isPopular: false,
  },
  {
    id: 'd4',
    title: 'Free Pizza Friday',
    description: 'First 100 students get free pizza slice at the student lounge',
    discount: 'Free',
    category: 'food',
    location: 'Student Lounge, Level 3',
    expiryDate: '2026-06-30',
    isPopular: true,
  },
  {
    id: 'd5',
    title: '$5 Transport Voucher',
    description: 'Get $5 off your monthly transport pass with student verification',
    discount: '$5',
    category: 'transport',
    location: 'Transport Hub, Level 1',
    expiryDate: '2026-09-01',
    isPopular: false,
  },
  {
    id: 'd6',
    title: 'Free Entry: Tech Talk Series',
    description: 'Join industry professionals for free networking and career talks',
    discount: 'Free',
    category: 'events',
    location: 'Auditorium A',
    expiryDate: '2026-07-20',
    isPopular: true,
  },
  {
    id: 'd7',
    title: '30% Off Printing Services',
    description: 'Discount on all printing and photocopying services at the library',
    discount: '30%',
    category: 'tech',
    location: 'Library, 2nd Floor',
    expiryDate: '2026-08-15',
    isPopular: false,
  },
  {
    id: 'd8',
    title: 'Cheap Lunch: Rice Plate $2.50',
    description: 'Special student lunch rice plate with 2 veggies and meat at Location A',
    discount: '$2.50',
    category: 'food',
    location: 'Food Stall A12, Block A',
    expiryDate: '2026-07-10',
    isPopular: true,
  },
];

export const marketplaceItems: MarketplaceItem[] = [
  {
    id: 'm1',
    title: 'Texas Instruments Calculator (Required)',
    description: 'TI-84 Plus calculator in excellent condition. Required for Math 101.',
    type: 'sell',
    category: 'Calculator',
    price: 25,
    condition: 'Like New',
    seller: 'John D.',
    location: 'Engineering Block',
    image: '🔢',
  },
  {
    id: 'm2',
    title: 'Programming Textbook - CS101',
    description: 'Introduction to Programming using Python. Some highlights but good condition.',
    type: 'sell',
    category: 'Textbook',
    price: 15,
    condition: 'Good',
    seller: 'Sarah L.',
    location: 'Library',
    image: '📚',
  },
  {
    id: 'm3',
    title: 'Borrow: Lab Coat (Size M)',
    description: 'Need a lab coat for Chemistry practical next week. Will return in perfect condition!',
    type: 'borrow',
    category: 'Lab Equipment',
    price: 0,
    condition: 'N/A',
    seller: 'Mike T.',
    location: 'Science Block',
    image: '🥼',
  },
  {
    id: 'm4',
    title: 'USB-C Charger - $5',
    description: 'Extra charger, selling cheap. Works perfectly.',
    type: 'sell',
    category: 'Electronics',
    price: 5,
    condition: 'Good',
    seller: 'Amy W.',
    location: 'Student Center',
    image: '🔌',
  },
  {
    id: 'm5',
    title: 'Wanted: Graphic Calculator',
    description: 'Looking to borrow or buy a graphic calculator for the semester.',
    type: 'buy',
    category: 'Calculator',
    price: 30,
    condition: 'Any',
    seller: 'David K.',
    location: 'Math Dept',
    image: '🔢',
  },
  {
    id: 'm6',
    title: 'Rent: Monitor for Projects',
    description: 'Have an extra 24-inch monitor available for rent. $3/week.',
    type: 'rent',
    category: 'Electronics',
    price: 3,
    condition: 'Excellent',
    seller: 'Lisa C.',
    location: 'CS Building',
    image: '🖥️',
  },
];

export const sideHustles: SideHustle[] = [
  {
    id: 's1',
    title: 'Math Tutoring - Freshman Level',
    description: 'Help freshmen understand calculus and algebra. Flexible schedule, work at your convenience.',
    hourlyRate: 25,
    type: 'tutoring',
    location: 'Math Department',
    schedule: 'Evenings & Weekends',
    skills: ['Mathematics', 'Communication'],
    urgency: 'high',
  },
  {
    id: 's2',
    title: 'Campus Delivery Driver',
    description: 'Deliver food and packages around campus. Earn while you exercise your schedule.',
    hourlyRate: 15,
    type: 'part-time',
    location: 'Campus-wide',
    schedule: 'Flexible',
    skills: ['Driving', 'Time Management'],
    urgency: 'medium',
  },
  {
    id: 's3',
    title: 'Freelance Logo Design',
    description: 'Design logos and branding materials for student organizations and local businesses.',
    hourlyRate: 40,
    type: 'freelance',
    location: 'Remote',
    schedule: 'Project-based',
    skills: ['Design', 'Adobe Suite', 'Branding'],
    urgency: 'low',
  },
  {
    id: 's4',
    title: 'Event Staff - Weekend Conference',
    description: 'Help organize and manage the annual tech conference. Great networking opportunity!',
    hourlyRate: 18,
    type: 'gig',
    location: 'Main Auditorium',
    schedule: 'Weekends',
    skills: ['Communication', 'Organization'],
    urgency: 'high',
  },
  {
    id: 's5',
    title: 'Programming Workshop Assistant',
    description: 'Assist in teaching introductory programming workshops. Perfect for CS students.',
    hourlyRate: 30,
    type: 'tutoring',
    location: 'CS Building',
    schedule: 'Wednesday & Friday 3pm-5pm',
    skills: ['Programming', 'Python', 'Teaching'],
    urgency: 'medium',
  },
  {
    id: 's6',
    title: 'Social Media Manager for Café',
    description: 'Manage social media accounts for a popular campus café. Creative and fun!',
    hourlyRate: 20,
    type: 'freelance',
    location: 'Campus Café',
    schedule: '2-3 hours/day',
    skills: ['Social Media', 'Content Creation', 'Photography'],
    urgency: 'low',
  },
];

export const spendingData: SpendingCategory[] = [
  { category: 'Food & Drinks', amount: 85, limit: 150, percentage: 57, trend: 'up' },
  { category: 'Transport', amount: 30, limit: 50, percentage: 60, trend: 'stable' },
  { category: 'Study Materials', amount: 45, limit: 40, percentage: 112, trend: 'up' },
  { category: 'Entertainment', amount: 60, limit: 80, percentage: 75, trend: 'down' },
  { category: 'Personal Care', amount: 20, limit: 50, percentage: 40, trend: 'stable' },
];

export const userProfile = {
  name: 'Alex Student',
  major: 'Computer Science',
  year: 2,
  monthlyBudget: 400,
  remainingBudget: 87,
  daysUntilPayday: 12,
  gpa: 3.7,
  skills: ['Python', 'JavaScript', 'Design', 'Communication'],
  availability: 'Evenings & Weekends',
};