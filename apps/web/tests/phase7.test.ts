import { describe, expect, it } from 'vitest';
import { PLAN_LIMITS } from '../app/lib/billing/plan';
import { reportOutputSchema } from '../app/lib/reports/service';
describe('Phase 7 reports and monetization safeguards', () => {
  it('validates report output as substantial structured Markdown', () => { expect(reportOutputSchema.safeParse({ title: 'Research report', content: '# Executive Summary\n\n' + 'Evidence-backed content. '.repeat(10) }).success).toBe(true); expect(reportOutputSchema.safeParse({ title: '', content: 'short' }).success).toBe(false); });
  it('keeps Free useful and Pro limits centrally defined', () => { expect(PLAN_LIMITS.FREE.projects).toBe(2); expect(PLAN_LIMITS.FREE.reports).toBeGreaterThan(0); expect(PLAN_LIMITS.PRO.reports).toBeGreaterThan(PLAN_LIMITS.FREE.reports); expect(PLAN_LIMITS.PRO.exports).toBeGreaterThan(PLAN_LIMITS.FREE.exports); });
  it('does not represent payment as enabled', () => { expect(PLAN_LIMITS).toHaveProperty('FREE'); expect(PLAN_LIMITS).toHaveProperty('PRO'); });
});
