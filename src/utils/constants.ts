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
  INVITATIONS: '/invitations',

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

  FREE_TRIAL: {
    id: 'free_trial_7d',
    title: '7-Day Free Trial',
    price: 0,
    amount: '0',
    amountPaise: 0,
    displayAmount: '0',
    durationDays: 7,
    description: '7 Days of full Premium access completely free. No payment details required.',
    features: [
      'Apply directly for all verified job openings',
      'Chat directly & securely with employers',
      'Take AI-powered skill assessments & earn badges',
      'Generate ATS-optimized resumes with Gemini AI',
      'Personalized Career Readiness & skill roadmap',
    ],
  },

  SUBSCRIPTION_PLANS: [
    {
      id: '1_month',
      title: '1 Month',
      name: '1 Month',
      price: 399,
      amount: '39900', // ₹399.00
      amountPaise: 39900,
      displayAmount: '399',
      durationDays: 30,
      description: 'Monthly Premium Subscription (30 Days)',
      features: [
        'Direct 1-click applications to unlimited jobs',
        'Direct recruiter chat & interview messaging',
        'Unlimited AI skill assessments & badges',
        'ATS-friendly AI resume generation & download',
        'Personalized career gap analysis & guidance',
      ],
      linkId: 'plink_TJQRrEidk1jb0c',
      offer: null,
      isPopular: false,
    },
    {
      id: '3_months',
      title: '3 Months',
      name: '3 Months',
      price: 569,
      amount: '56900', // ₹569.00
      amountPaise: 56900,
      displayAmount: '569',
      durationDays: 90,
      description: 'Quarterly Premium Subscription (90 Days)',
      features: [
        'All 1-Month Premium features included',
        'Extended 90-day recruiter visibility',
        'Priority applicant badge on recruiter portals',
        'Continuous AI readiness tracking & updates',
        'Significant savings over monthly billing',
      ],
      linkId: 'plink_TJQSujCLADJB1O',
      offer: 'RECOMMENDED',
      isPopular: true,
    },
    {
      id: '6_months',
      title: '6 Months',
      name: '6 Months',
      price: 1079,
      amount: '107900', // ₹1079.00
      amountPaise: 107900,
      displayAmount: '1079',
      durationDays: 180,
      description: 'Half-Yearly Premium Subscription (180 Days)',
      features: [
        'All Quarterly Premium features included',
        'Full 6 months of uninterrupted access',
        'Maximum hiring opportunity window',
        'Early access to newly posted verified vacancies',
        'Best value overall per month',
      ],
      linkId: 'plink_TJQTRnkjPsKld5',
      offer: 'BEST VALUE',
      isPopular: false,
    },
  ],
} as const;
