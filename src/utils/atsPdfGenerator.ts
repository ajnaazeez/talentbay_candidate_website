import jsPDF from 'jspdf';
import type {
  AiCvModel,
  AiCvExperience,
  AiCvProject,
  AiCvEducation,
  AiCvCertification,
} from '@/types/aiCv';

const PAGE_WIDTH = 595.28; // A4 pt width
const PAGE_HEIGHT = 841.89; // A4 pt height
const MARGIN_LEFT = 36;
const MARGIN_RIGHT = 36;
const MARGIN_TOP = 36;
const MARGIN_BOTTOM = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const MAX_Y = PAGE_HEIGHT - MARGIN_BOTTOM;

/**
 * Generates a strictly ATS-compliant single-column vector PDF matching the TalentBay Flutter ATS specification.
 * Uses standard Helvetica font hierarchy, clean standard headings, selectable text, and automatic page breaks.
 */
export function generateAtsPdf(cv: AiCvModel): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  let currentY = MARGIN_TOP;

  // Helper to ensure page break if needed
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > MAX_Y) {
      doc.addPage();
      currentY = MARGIN_TOP;
    }
  };

  // Helper to draw a section header
  const drawSectionHeader = (title: string) => {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42); // slate-900 / black
    doc.text(title.toUpperCase(), MARGIN_LEFT, currentY);
    currentY += 4;

    // Divider line
    doc.setDrawColor(180, 185, 195);
    doc.setLineWidth(0.75);
    doc.line(MARGIN_LEFT, currentY, PAGE_WIDTH - MARGIN_RIGHT, currentY);
    currentY += 10;
  };

  // Helper for bullet marker
  const drawBullet = (x: number, y: number) => {
    doc.setFillColor(30, 41, 59);
    doc.circle(x, y - 2.5, 1.3, 'F');
  };

  // 1. Header (Full Name, Target Job Role, Contact Details)
  const fullName = (cv.fullName || 'CANDIDATE NAME').toUpperCase();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(fullName, PAGE_WIDTH / 2, currentY, { align: 'center' });
  currentY += 16;

  if (cv.targetJobRole?.trim()) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(cv.targetJobRole.trim().toUpperCase(), PAGE_WIDTH / 2, currentY, { align: 'center' });
    currentY += 14;
  }

  const contactParts: string[] = [];
  if (cv.email?.trim()) contactParts.push(cv.email.trim());
  if (cv.phone?.trim()) contactParts.push(cv.phone.trim());
  if (cv.location?.trim()) contactParts.push(cv.location.trim());

  if (contactParts.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(contactParts.join('  |  '), PAGE_WIDTH / 2, currentY, { align: 'center' });
    currentY += 10;
  }

  // Header bottom border
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(1);
  doc.line(MARGIN_LEFT, currentY, PAGE_WIDTH - MARGIN_RIGHT, currentY);
  currentY += 14;

  // 2. Professional Summary
  if (cv.summary?.trim()) {
    drawSectionHeader('PROFESSIONAL SUMMARY');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);

    const summaryLines = doc.splitTextToSize(cv.summary.trim(), CONTENT_WIDTH);
    summaryLines.forEach((line: string) => {
      checkPageBreak(13);
      doc.text(line, MARGIN_LEFT, currentY);
      currentY += 13;
    });
    currentY += 8;
  }

  // 3. Technical Skills
  if (cv.skillCategories && cv.skillCategories.length > 0) {
    drawSectionHeader('TECHNICAL SKILLS');

    cv.skillCategories.forEach((cat) => {
      if (!cat.skills || cat.skills.length === 0) return;
      checkPageBreak(14);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);

      const categoryLabel = `${cat.category}: `;
      const catWidth = doc.getTextWidth(categoryLabel);

      doc.text(categoryLabel, MARGIN_LEFT, currentY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);

      const skillsText = cat.skills.join(', ');
      const availableWidth = CONTENT_WIDTH - catWidth;
      const skillLines = doc.splitTextToSize(skillsText, availableWidth);

      if (skillLines.length > 0) {
        // First line right after the label
        doc.text(skillLines[0], MARGIN_LEFT + catWidth, currentY);
        currentY += 13;

        // Subsequent lines indented
        for (let i = 1; i < skillLines.length; i++) {
          checkPageBreak(13);
          doc.text(skillLines[i], MARGIN_LEFT + 14, currentY);
          currentY += 13;
        }
      } else {
        currentY += 13;
      }
    });
    currentY += 6;
  }

  // 4. Work Experience
  if (cv.workExperience && cv.workExperience.length > 0) {
    drawSectionHeader('WORK EXPERIENCE');

    cv.workExperience.forEach((exp: AiCvExperience) => {
      checkPageBreak(30);

      // Job Title (Left) and Date Range (Right)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(exp.jobTitle, MARGIN_LEFT, currentY);

      const dateRange = [exp.startDate, exp.isCurrent ? 'Present' : exp.endDate].filter(Boolean).join(' - ');
      if (dateRange) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(dateRange, PAGE_WIDTH - MARGIN_RIGHT, currentY, { align: 'right' });
      }
      currentY += 12;

      // Company and Employment Type
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      const companyDesc =
        exp.employmentType && exp.employmentType !== 'Full-time'
          ? `${exp.companyName} (${exp.employmentType})`
          : exp.companyName;
      doc.text(companyDesc, MARGIN_LEFT, currentY);
      currentY += 11;

      // Bullet Points
      if (exp.bulletPoints && exp.bulletPoints.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);

        exp.bulletPoints.forEach((bullet) => {
          if (!bullet.trim()) return;
          const bulletLines = doc.splitTextToSize(bullet.trim(), CONTENT_WIDTH - 16);
          checkPageBreak(bulletLines.length * 12 + 2);

          drawBullet(MARGIN_LEFT + 6, currentY);
          bulletLines.forEach((bLine: string) => {
            doc.text(bLine, MARGIN_LEFT + 16, currentY);
            currentY += 12;
          });
          currentY += 1;
        });
      }
      currentY += 6;
    });
    currentY += 4;
  }

  // 5. Internship Experience (if separate)
  if (cv.internships && cv.internships.length > 0) {
    drawSectionHeader('INTERNSHIP EXPERIENCE');

    cv.internships.forEach((intern: AiCvExperience) => {
      checkPageBreak(30);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(intern.jobTitle, MARGIN_LEFT, currentY);

      const dateRange = [intern.startDate, intern.isCurrent ? 'Present' : intern.endDate].filter(Boolean).join(' - ');
      if (dateRange) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(dateRange, PAGE_WIDTH - MARGIN_RIGHT, currentY, { align: 'right' });
      }
      currentY += 12;

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      doc.text(intern.companyName, MARGIN_LEFT, currentY);
      currentY += 11;

      if (intern.bulletPoints && intern.bulletPoints.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);

        intern.bulletPoints.forEach((bullet) => {
          if (!bullet.trim()) return;
          const bulletLines = doc.splitTextToSize(bullet.trim(), CONTENT_WIDTH - 16);
          checkPageBreak(bulletLines.length * 12 + 2);

          drawBullet(MARGIN_LEFT + 6, currentY);
          bulletLines.forEach((bLine: string) => {
            doc.text(bLine, MARGIN_LEFT + 16, currentY);
            currentY += 12;
          });
          currentY += 1;
        });
      }
      currentY += 6;
    });
    currentY += 4;
  }

  // 6. Projects
  if (cv.projects && cv.projects.length > 0) {
    drawSectionHeader('PROJECTS');

    cv.projects.forEach((proj: AiCvProject) => {
      checkPageBreak(28);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(proj.title, MARGIN_LEFT, currentY);

      if (proj.role?.trim()) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(proj.role.trim(), PAGE_WIDTH - MARGIN_RIGHT, currentY, { align: 'right' });
      }
      currentY += 12;

      if (proj.technologies && proj.technologies.length > 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Technologies: ${proj.technologies.join(', ')}`, MARGIN_LEFT, currentY);
        currentY += 11;
      }

      if (proj.bulletPoints && proj.bulletPoints.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);

        proj.bulletPoints.forEach((bullet) => {
          if (!bullet.trim()) return;
          const bulletLines = doc.splitTextToSize(bullet.trim(), CONTENT_WIDTH - 16);
          checkPageBreak(bulletLines.length * 12 + 2);

          drawBullet(MARGIN_LEFT + 6, currentY);
          bulletLines.forEach((bLine: string) => {
            doc.text(bLine, MARGIN_LEFT + 16, currentY);
            currentY += 12;
          });
          currentY += 1;
        });
      }
      currentY += 6;
    });
    currentY += 4;
  }

  // 7. Education
  if (cv.education && cv.education.length > 0) {
    drawSectionHeader('EDUCATION');

    cv.education.forEach((edu: AiCvEducation) => {
      checkPageBreak(24);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      const degreeText = edu.fieldOfStudy ? `${edu.degree} in ${edu.fieldOfStudy}` : edu.degree;
      doc.text(degreeText, MARGIN_LEFT, currentY);

      const yearStr =
        edu.startYear && edu.endYear
          ? `${edu.startYear} - ${edu.endYear}`
          : edu.endYear
          ? `${edu.endYear}`
          : '';
      if (yearStr) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(71, 85, 105);
        doc.text(yearStr, PAGE_WIDTH - MARGIN_RIGHT, currentY, { align: 'right' });
      }
      currentY += 12;

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      doc.text(edu.institution, MARGIN_LEFT, currentY);

      if (edu.grade?.trim()) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(`Grade: ${edu.grade.trim()}`, PAGE_WIDTH - MARGIN_RIGHT, currentY, { align: 'right' });
      }
      currentY += 14;
    });
    currentY += 4;
  }

  // 8. Certifications
  if (cv.certifications && cv.certifications.length > 0) {
    drawSectionHeader('CERTIFICATIONS');

    cv.certifications.forEach((cert: AiCvCertification) => {
      checkPageBreak(14);

      drawBullet(MARGIN_LEFT + 6, currentY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(cert.name, MARGIN_LEFT + 16, currentY);

      const nameWidth = doc.getTextWidth(cert.name);
      if (cert.organization) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(` - ${cert.organization}`, MARGIN_LEFT + 16 + nameWidth, currentY);
      }

      if (cert.issueDate?.trim()) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(cert.issueDate.trim(), PAGE_WIDTH - MARGIN_RIGHT, currentY, { align: 'right' });
      }
      currentY += 13;
    });
    currentY += 6;
  }

  // 9. Honors & Achievements
  if (cv.achievements && cv.achievements.length > 0) {
    drawSectionHeader('HONORS & ACHIEVEMENTS');

    cv.achievements.forEach((ach) => {
      if (!ach.trim()) return;
      const achLines = doc.splitTextToSize(ach.trim(), CONTENT_WIDTH - 16);
      checkPageBreak(achLines.length * 12 + 2);

      drawBullet(MARGIN_LEFT + 6, currentY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);

      achLines.forEach((aLine: string) => {
        doc.text(aLine, MARGIN_LEFT + 16, currentY);
        currentY += 12;
      });
      currentY += 2;
    });
    currentY += 6;
  }

  // 10. Languages
  if (cv.languages && cv.languages.length > 0) {
    drawSectionHeader('LANGUAGES');
    checkPageBreak(14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);

    const langStr = cv.languages
      .map((l) => (l.proficiency ? `${l.name} (${l.proficiency})` : l.name))
      .join('   |   ');
    doc.text(langStr, MARGIN_LEFT, currentY);
    currentY += 14;
  }

  // Final Pass: Add Page Numbers Footer to All Pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Page ${i} of ${totalPages}`, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - 20, {
      align: 'right',
    });
  }

  return doc;
}

/**
 * Generates and triggers download of the ATS resume.
 */
export function downloadAtsPdf(cv: AiCvModel, customFilename?: string): void {
  const doc = generateAtsPdf(cv);
  const safeName = (cv.fullName || 'Candidate').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const filename = customFilename || `TalentBay_ATS_Resume_${safeName}.pdf`;
  doc.save(filename);
}

/**
 * Creates a Blob URL for in-browser PDF preview iframe.
 * Remember to call URL.revokeObjectURL(url) when unmounting.
 */
export function getPdfBlobUrl(cv: AiCvModel): string {
  const doc = generateAtsPdf(cv);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}
