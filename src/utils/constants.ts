/**
 * TalentBay Candidate Web - Global Application Constants & Routes
 */

export const ROUTES = {
  // Public / Auth Routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  TERMS: '/terms',
  PRIVACY: '/privacy',

  // Protected Candidate Routes
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  PROFILE_EDIT: '/profile/edit',
  RESUME_BUILDER: '/profile/resume-builder',

  // Jobs
  JOBS: '/jobs',
  JOB_DETAILS: '/jobs/:jobId',
  SAVED_JOBS: '/saved-jobs',
  APPLICATIONS: '/applications',

  // Companies
  COMPANIES: '/companies',
  COMPANY_DETAILS: '/companies/:companyId',

  // Assessment & Career Readiness
  ASSESSMENTS: '/assessments',
  ASSESSMENT_TAKE: '/assessments/:skill',
  CAREER_READINESS: '/career-readiness',

  // Messaging & Notifications
  CHAT: '/chat',
  CHAT_ROOM: '/chat/:chatId',
  NOTIFICATIONS: '/notifications',

  // Subscription & Workspace
  SUBSCRIPTION: '/subscription',
  SETTINGS: '/settings',
  SUPPORT: '/support',
  ABOUT: '/about',
} as const;

export const COLLECTIONS = {
  USERS: 'users',
  CANDIDATES: 'candidates',
  RECRUITERS: 'recruiters',
  COMPANIES: 'companies',
  JOBS: 'jobs',
  JOB_APPLICATIONS: 'job_applications',
  ASSESSMENT_RESULTS: 'assessmentResults',
  CHATS: 'chats',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications',
} as const;

export const STORAGE_PATHS = {
  RESUMES: 'resumes',
  PROFILE_PHOTOS: 'profile_photos',
  COMPANY_LOGOS: 'company_logos',
} as const;

export const PAYMENT_CONFIG = {
  RAZORPAY_KEY_ID: 'rzp_live_TdPCKnpedQNEW6',
  CURRENCY: 'INR',
  COMPANY_NAME: 'Talent Bay',

  TRIAL_PLAN: {
    id: '7_days_trial',
    title: '7 Days Trial',
    amount: '100', // ₹1.00
    displayAmount: '1',
    durationDays: 7,
    description: '7 Days Premium Trial',
    linkId: 'plink_TIz8oHaumAgxDk',
    offer: 'TRIAL',
  },

  SUBSCRIPTION_PLANS: [
    {
      id: '1_month',
      title: '1 Month',
      amount: '39900', // ₹399.00
      displayAmount: '399',
      durationDays: 30,
      description: 'Monthly Premium Subscription (30 Days)',
      linkId: 'plink_TJQRrEidk1jb0c',
      offer: null,
    },
    {
      id: '3_months',
      title: '3 Months',
      amount: '59900', // ₹599.00
      displayAmount: '599',
      durationDays: 90,
      description: 'Quarterly Premium Subscription (90 Days)',
      linkId: 'plink_TJQSujCLADJB1O',
      offer: '5% OFF',
    },
    {
      id: '6_months',
      title: '6 Months',
      amount: '99900', // ₹999.00
      displayAmount: '999',
      durationDays: 180,
      description: 'Half-Yearly Premium Subscription (180 Days)',
      linkId: 'plink_TJQTRnkjPsKld5',
      offer: '10% OFF',
    },
  ],
} as const;
