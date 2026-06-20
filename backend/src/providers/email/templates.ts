import type { EmailProvider, EmailTemplateData } from './types';

type EmailTemplateFn = (data: EmailTemplateData) => { subject: string; html: string; text: string };

const templates: Record<string, EmailTemplateFn> = {
  'welcome-student': (data) => ({
    subject: `Welcome to HireLens AI, ${data.name}!`,
    html: `<h1>Welcome to HireLens AI!</h1><p>Hi ${data.name},</p><p>Your account has been created as a Student. Start by uploading your resume to get personalized job matches.</p>`,
    text: `Welcome to HireLens AI! Hi ${data.name}, your account has been created as a Student.`,
  }),
  'welcome-recruiter': (data) => ({
    subject: `Welcome to HireLens AI, ${data.name}!`,
    html: `<h1>Welcome to HireLens AI!</h1><p>Hi ${data.name},</p><p>Your recruiter account is ready. Post your first job to start finding top candidates.</p>`,
    text: `Welcome to HireLens AI! Hi ${data.name}, your recruiter account is ready.`,
  }),
  'resume-analyzed': (data) => ({
    subject: 'Your resume has been analyzed',
    html: `<h1>Resume Analysis Complete</h1><p>Hi ${data.name},</p><p>Your resume "${data.resumeTitle}" has been analyzed. Skills extracted: ${data.skillsCount} skills found.</p>`,
    text: `Your resume "${data.resumeTitle}" has been analyzed. ${data.skillsCount} skills found.`,
  }),
  'application-submitted': (data) => ({
    subject: 'Application submitted successfully',
    html: `<h1>Application Submitted</h1><p>Hi ${data.name},</p><p>Your application for "${data.jobTitle}" has been submitted.</p>`,
    text: `Your application for "${data.jobTitle}" has been submitted.`,
  }),
  'new-applicant': (data) => ({
    subject: `New applicant for ${data.jobTitle}`,
    html: `<h1>New Applicant</h1><p>Hi ${data.name},</p><p>${data.applicantName} has applied for "${data.jobTitle}".</p>`,
    text: `${data.applicantName} has applied for "${data.jobTitle}".`,
  }),
  'job-posted': (data) => ({
    subject: 'Job posted successfully',
    html: `<h1>Job Posted</h1><p>Hi ${data.name},</p><p>Your job "${data.jobTitle}" is now live.</p>`,
    text: `Your job "${data.jobTitle}" is now live.`,
  }),
};

export function renderTemplate(templateId: string, data: EmailTemplateData): { subject: string; html: string; text: string } {
  const template = templates[templateId];
  if (!template) {
    throw new Error(`Email template not found: ${templateId}`);
  }
  return template(data);
}
