import {
  collection,
  doc,
  getDoc,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/utils/constants';
import type { Company, Job } from '@/types';
import { jobService } from './jobService';

function parseCompanyDoc(id: string, data: Record<string, any>): Company {
  const profile = data.profile || {};
  const contact = data.contact || {};
  const verification = data.verification || {};
  const stats = data.stats || {};
  const business = data.business || {};

  return {
    id,
    profile: {
      companyName: profile.companyName || data.companyName || 'TalentBay Partner',
      tagline: profile.tagline || data.tagline,
      about: profile.about || profile.description || data.about || data.description || '',
      logoUrl: profile.logoUrl || data.logoUrl || data.companyLogoUrl,
      coverImageUrl: profile.coverImageUrl || data.coverImageUrl,
      industry: profile.industry || business.industry || data.industry || 'Technology',
      companyType: profile.companyType || business.type || data.companyType,
      companySize: profile.companySize || business.size || data.companySize || '10-50 employees',
      website: profile.website || contact.website || data.website || data.websiteUrl,
      foundedYear: profile.foundedYear || business.foundedYear || data.foundedYear,
    },
    contact: {
      city: contact.city || data.city,
      state: contact.state || data.state,
      country: contact.country || data.country,
      addressLine: contact.addressLine || data.addressLine,
      email: contact.email || data.email,
      phone: contact.phone || data.phone,
      website: contact.website || data.website,
    },
    verification: {
      isVerified: Boolean(verification.isVerified || data.isVerified),
      status: verification.status || (data.isVerified ? 'verified' : 'unverified'),
    },
    stats: {
      totalJobs: stats.totalJobs || data.totalJobs || 0,
      activeJobs: stats.activeJobs || data.activeJobs || 0,
      totalApplicants: stats.totalApplicants || data.totalApplicants || 0,
    },
    social: data.social || {},
    companyName: profile.companyName || data.companyName || 'TalentBay Partner',
    logoUrl: profile.logoUrl || data.logoUrl || data.companyLogoUrl,
    about: profile.about || profile.description || data.about || data.description,
    industry: profile.industry || business.industry || data.industry,
    website: profile.website || contact.website || data.website,
    isVerified: Boolean(verification.isVerified || data.isVerified),
  };
}

export const companyService = {
  /**
   * Fetches all registered and verified companies.
   */
  async getCompanies(): Promise<Company[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.COMPANIES));
      const companies: Company[] = [];

      for (const d of snap.docs) {
        companies.push(parseCompanyDoc(d.id, d.data()));
      }

      return companies;
    } catch (err) {
      console.error('[companyService] Error fetching companies:', err);
      return [];
    }
  },

  /**
   * Fetches a single company by ID.
   */
  async getCompanyById(companyId: string): Promise<Company | null> {
    if (!companyId) return null;
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.COMPANIES, companyId));
      if (!snap.exists()) return null;
      return parseCompanyDoc(snap.id, snap.data());
    } catch (err) {
      console.error(`[companyService] Error fetching company ${companyId}:`, err);
      return null;
    }
  },

  /**
   * Fetches all active job openings for a given company.
   */
  async getCompanyActiveJobs(companyId: string): Promise<Job[]> {
    if (!companyId) return [];
    try {
      const allJobs = await jobService.getJobs();
      return allJobs.filter((j) => j.companyId === companyId && j.status === 'active');
    } catch (err) {
      console.error(`[companyService] Error fetching jobs for company ${companyId}:`, err);
      return [];
    }
  },
};
