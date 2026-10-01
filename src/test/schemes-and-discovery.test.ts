import { describe, it, expect } from 'vitest';
import { ALL_GOVERNMENT_SCHEMES, SCHEME_CATEGORIES } from '../data/schemesData';
import {
  PMMVY_SCHEME_INFO,
  MANDATORY_DOCUMENTS,
  VERIFIED_HELPLINES,
  OFFICIAL_PORTALS,
} from '../data/pmmvyData';

describe('Government Schemes Knowledge Engine & Discovery', () => {
  describe('SCHEME_CATEGORIES validation', () => {
    it('defines 6 primary welfare categories with Tamil and English names', () => {
      expect(SCHEME_CATEGORIES.length).toBe(6);
      const expectedIds = ['women', 'education', 'employment', 'entrepreneurship', 'farmers', 'social_security'];
      const actualIds = SCHEME_CATEGORIES.map((c) => c.id);
      expect(actualIds).toEqual(expectedIds);

      SCHEME_CATEGORIES.forEach((cat) => {
        expect(cat.nameTa).toBeTruthy();
        expect(cat.nameEn).toBeTruthy();
        expect(cat.icon).toBeTruthy();
        expect(cat.descTa).toBeTruthy();
      });
    });
  });

  describe('ALL_GOVERNMENT_SCHEMES data integrity', () => {
    it('contains comprehensive list of central and Tamil Nadu schemes', () => {
      expect(ALL_GOVERNMENT_SCHEMES.length).toBeGreaterThanOrEqual(10);
    });

    it('ensures each scheme has required metadata, benefits, documents, and official portals', () => {
      ALL_GOVERNMENT_SCHEMES.forEach((scheme) => {
        expect(scheme.id).toBeTruthy();
        expect(scheme.nameTa).toBeTruthy();
        expect(scheme.nameEn).toBeTruthy();
        expect(scheme.category).toBeTruthy();
        expect(scheme.simpleExplanationTa).toBeTruthy();
        expect(scheme.benefitsTa).toBeTruthy();
        expect(scheme.basicEligibilityTa.length).toBeGreaterThan(0);
        expect(scheme.requiredDocumentsTa.length).toBeGreaterThan(0);
        expect(scheme.howToApplyTa).toBeTruthy();
        expect(scheme.officialSource).toMatch(/^https:\/\//);
        expect(scheme.sourceName).toBeTruthy();
      });
    });

    it('contains key benchmark schemes: PMMVY, Pudhumai Penn, and CMCHIS', () => {
      const pmmvy = ALL_GOVERNMENT_SCHEMES.find((s) => s.id === 'pmmvy');
      expect(pmmvy).toBeDefined();
      expect(pmmvy?.benefitsTa).toContain('5,000');
      expect(pmmvy?.benefitsTa).toContain('6,000');

      const pudhumaiPenn = ALL_GOVERNMENT_SCHEMES.find((s) => s.id === 'pudhumai_penn');
      expect(pudhumaiPenn).toBeDefined();
      expect(pudhumaiPenn?.benefitsTa).toContain('1,000');

      const cmchis = ALL_GOVERNMENT_SCHEMES.find((s) => s.id === 'cmchis');
      expect(cmchis).toBeDefined();
      expect(cmchis?.benefitsTa).toContain('5 லட்சம்');
    });

    it('all official sources are legitimate government or designated official domains', () => {
      const validDomainPatterns = [
        /\.gov\.in/,
        /\.nic\.in/,
        /\.tn\.gov\.in/,
        /\.org\.in/,
        /mudra\.org\.in/,
        /pmkvyofficial\.org/,
        /standupmitra\.in/,
        /cmchistn\.com/,
      ];

      ALL_GOVERNMENT_SCHEMES.forEach((scheme) => {
        const matchesValidDomain = validDomainPatterns.some((pattern) =>
          pattern.test(scheme.officialSource)
        );
        expect(matchesValidDomain).toBe(true);
      });
    });
  });

  describe('PMMVY Detailed Scheme Guidance', () => {
    it('details 1st child benefit of ₹5,000 across 2 installments', () => {
      const firstChild = PMMVY_SCHEME_INFO.find((s) => s.id === 'first_child');
      expect(firstChild).toBeDefined();
      expect(firstChild?.amountTa).toContain('5,000');
      expect(firstChild?.keyPoints[0]).toContain('3,000');
      expect(firstChild?.keyPoints[1]).toContain('2,000');
    });

    it('details 2nd girl child benefit of ₹6,000 in single installment', () => {
      const secondChild = PMMVY_SCHEME_INFO.find((s) => s.id === 'second_girl_child');
      expect(secondChild).toBeDefined();
      expect(secondChild?.amountTa).toContain('6,000');
    });

    it('includes Tamil Nadu MRMBS integration with total ₹18,000 benefits', () => {
      const tnMrmbs = PMMVY_SCHEME_INFO.find((s) => s.id === 'tn_mrmbs');
      expect(tnMrmbs).toBeDefined();
      expect(tnMrmbs?.amountTa).toContain('18,000');
    });

    it('provides mandatory document requirements', () => {
      expect(MANDATORY_DOCUMENTS.length).toBeGreaterThanOrEqual(4);
      const docNames = MANDATORY_DOCUMENTS.map((d) => d.nameTa).join(' ');
      expect(docNames).toContain('ஆதார்');
      expect(docNames).toContain('வங்கி');
    });

    it('provides official helplines and portals', () => {
      expect(VERIFIED_HELPLINES.length).toBeGreaterThanOrEqual(3);
      expect(OFFICIAL_PORTALS.length).toBeGreaterThanOrEqual(2);
      expect(OFFICIAL_PORTALS[0].url).toContain('pmmvy');
    });
  });

  describe('Scheme Discovery Filtering', () => {
    it('filters schemes accurately by category', () => {
      const womenSchemes = ALL_GOVERNMENT_SCHEMES.filter((s) => s.category === 'women');
      expect(womenSchemes.length).toBeGreaterThanOrEqual(3);
      womenSchemes.forEach((s) => expect(s.category).toBe('women'));

      const farmerSchemes = ALL_GOVERNMENT_SCHEMES.filter((s) => s.category === 'farmers');
      expect(farmerSchemes.length).toBeGreaterThanOrEqual(2);
      farmerSchemes.forEach((s) => expect(s.category).toBe('farmers'));
    });

    it('finds schemes by search query in Tamil or English', () => {
      const query = 'புதுமை';
      const results = ALL_GOVERNMENT_SCHEMES.filter(
        (s) => s.nameTa.includes(query) || s.simpleExplanationTa.includes(query)
      );
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].id).toBe('pudhumai_penn');
    });
  });
});
