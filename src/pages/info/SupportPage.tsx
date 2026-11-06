import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Headphones,
  Mail,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle2,
  ChevronLeft,
  Copy,
  Check,
  HelpCircle,
} from 'lucide-react';
import { APP_CONFIG } from '@/utils/constants';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const CANDIDATE_FAQS: FAQItem[] = [
  {
    category: 'Trial & Billing',
    question: 'How does the 7-day free trial work for candidates?',
    answer:
      'All new candidates automatically receive a 7-day free trial granting unrestricted access to job applications, direct recruiter messaging, AI CV builder, and skill assessments. No credit card or upfront payment is required.',
  },
  {
    category: 'Applications',
    question: 'How do recruiter invitations work?',
    answer:
      'When your verified skills and profile match an open position by 40% or more, recruiters can send you direct job invitations. You can review role expectations in the Invitations tab and choose to Accept (which applies automatically) or Decline.',
  },
  {
    category: 'AI Resume',
    question: 'How does the AI Resume Builder ensure ATS compatibility?',
    answer:
      'Our AI CV generator utilizes standard single-column layouts, clear semantic headings, and selectable text without nested graphical columns. This ensures parsing software (ATS) and human recruiters can effortlessly extract your work history.',
  },
  {
    category: 'Privacy & Security',
    question: 'Are my chat conversations with recruiters private?',
    answer:
      'Yes. TalentBay uses client-side AES-CTR cryptographic encryption for messages. Only you and the recruiter can decrypt and read message contents, safeguarding your confidential communications.',
  },
  {
    category: 'Trial & Billing',
    question: 'What should I do if my payment was deducted but subscription did not activate?',
    answer:
      'Navigate to Settings or Subscription and click "Recover Payment". Our backend reconciles with Razorpay using your payment ID to immediately restore your active subscription.',
  },
  {
    category: 'Account',
    question: 'How can I update my mobile number or permanently delete my account?',
    answer:
      'Visit Settings -> Account & Security to link a verified phone number via Cloud Functions. If you wish to delete your account, use the Danger Zone in Settings, which securely purges all data via our backend function.',
  },
];

export const SupportPage: React.FC = () => {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(APP_CONFIG.supportEmail);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2500);
    }
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    setIsSubmitted(true);
    setTimeout(() => {
      setTicketSubject('');
      setTicketMessage('');
      setIsSubmitted(false);
    }, 4000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-20 min-w-0">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Hero Banner */}
      <div className="bg-white dark:bg-[#222023] rounded-3xl p-6 sm:p-10 border border-[#E6DFD8] dark:border-[#494448] shadow-xs text-center relative overflow-hidden">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#B87355]/15 border border-[#B87355]/30 flex items-center justify-center text-[#B87355] mx-auto mb-5 shadow-xs">
          <Headphones className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-[#29272A] dark:text-white tracking-tight">
          CANDIDATE SUPPORT & HELP
        </h1>
        <p className="text-xs sm:text-sm text-[#736B70] dark:text-[#A49D9E] max-w-xl mx-auto mt-2 leading-relaxed">
          Need assistance with your job applications, free trial, AI resume, or verified credentials?
          Browse our frequently asked questions below or contact our support team.
        </p>

        {/* Support Email Pill */}
        <div className="pt-6 flex justify-center">
          <div
            onClick={handleCopyEmail}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#F5F1EA] dark:bg-[#1F1D20] border border-[#E6DFD8] dark:border-[#494448] cursor-pointer hover:border-[#B87355] transition shadow-xs group"
            title="Click to copy support email"
          >
            <Mail className="w-4 h-4 text-[#B87355]" />
            <span className="text-xs font-bold text-[#29272A] dark:text-[#F5F1EA]">
              {APP_CONFIG.supportEmail}
            </span>
            <span className="p-1 rounded-lg bg-white dark:bg-[#332F34] border border-[#E6DFD8] dark:border-[#494448] text-[#A49D9E] group-hover:text-[#B87355] transition">
              {copiedEmail ? <Check className="w-3.5 h-3.5 text-[#B87355]" /> : <Copy className="w-3.5 h-3.5" />}
            </span>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-white dark:bg-[#222023] rounded-3xl p-6 sm:p-8 border border-[#E6DFD8] dark:border-[#494448] shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#29272A] dark:text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#B87355]" />
            <span>Frequently Asked Questions</span>
          </h2>
          <span className="text-xs text-[#A49D9E] font-semibold">{CANDIDATE_FAQS.length} Articles</span>
        </div>

        <div className="space-y-3">
          {CANDIDATE_FAQS.map((faq, index) => {
            const isOpen = openFaqIndex === index;

            return (
              <div
                key={faq.question}
                className="border border-[#E6DFD8] dark:border-[#494448] rounded-2xl overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 bg-[#F5F1EA]/50 dark:bg-[#1F1D20]/40 hover:bg-[#F5F1EA] dark:hover:bg-[#332F34] transition"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#B87355] tracking-wider">
                      {faq.category}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-[#29272A] dark:text-white">
                      {faq.question}
                    </h3>
                  </div>
                  <div className="text-[#A49D9E] shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="p-4 sm:p-5 bg-white dark:bg-[#222023] border-t border-[#E6DFD8] dark:border-[#494448] text-xs text-[#736B70] dark:text-[#A49D9E] leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Support Inquiry Form */}
      <div className="bg-white dark:bg-[#222023] rounded-3xl p-6 sm:p-8 border border-[#E6DFD8] dark:border-[#494448] shadow-xs space-y-5">
        <div>
          <h2 className="text-sm font-bold text-[#29272A] dark:text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-[#B87355]" />
            <span>Send a Support Message</span>
          </h2>
          <p className="text-xs text-[#736B70] dark:text-[#A49D9E] mt-1">
            Can't find what you need? Send a direct support ticket to our candidate customer care team.
          </p>
        </div>

        {isSubmitted ? (
          <div className="p-6 rounded-2xl bg-[#B87355]/10 dark:bg-[#B87355]/20 border border-[#B87355]/30 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#B87355] mx-auto" />
            <h3 className="text-sm font-bold text-[#29272A] dark:text-white">
              Inquiry Dispatched Successfully!
            </h3>
            <p className="text-xs text-[#736B70] dark:text-[#A49D9E] max-w-sm mx-auto">
              Our support team has received your ticket and will respond via your registered email within 24 business hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitTicket} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#494448] dark:text-[#D4CDC7] block mb-1.5">
                Subject
              </label>
              <input
                type="text"
                required
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Brief summary of your inquiry..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#F5F1EA] dark:bg-[#1F1D20] border border-[#E6DFD8] dark:border-[#494448] rounded-xl text-[#29272A] dark:text-white placeholder:text-[#A49D9E] focus:outline-none focus:ring-2 focus:ring-[#B87355]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#494448] dark:text-[#D4CDC7] block mb-1.5">
                Detailed Message
              </label>
              <textarea
                required
                rows={4}
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                placeholder="Describe your issue or question in detail..."
                className="w-full p-3.5 text-xs sm:text-sm bg-[#F5F1EA] dark:bg-[#1F1D20] border border-[#E6DFD8] dark:border-[#494448] rounded-xl text-[#29272A] dark:text-white placeholder:text-[#A49D9E] focus:outline-none focus:ring-2 focus:ring-[#B87355]"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-white bg-[#B87355] hover:bg-[#A46347] active:bg-[#8D5239] rounded-xl transition shadow-xs inline-flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Ticket</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SupportPage;
