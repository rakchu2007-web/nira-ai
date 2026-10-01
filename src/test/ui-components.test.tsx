import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PrivacyBanner } from '../components/PrivacyBanner';
import { CategoryBar } from '../components/CategoryBar';
import { Header } from '../components/Header';
import { SchemeCard } from '../components/SchemeCard';
import { ALL_GOVERNMENT_SCHEMES } from '../data/schemesData';
import { AppSettings } from '../types';

const mockSettings: AppSettings = {
  fontSize: 'normal',
  highContrast: false,
  autoReadAloud: false,
  stepByStepMode: false,
};

describe('UI Components & Interaction', () => {
  describe('PrivacyBanner', () => {
    it('renders security pledge informing user that sensitive data is never asked', () => {
      render(<PrivacyBanner highContrast={false} />);
      expect(
        screen.getByText(/NIRA AI உங்கள் ஆதார் எண், வங்கி கணக்கு எண், OTP அல்லது கடவுச்சொல்லை ஒருபோதும் கேட்க மாட்டாது/i)
      ).toBeInTheDocument();
    });

    it('toggles expanded details when user clicks the info button', () => {
      render(<PrivacyBanner highContrast={false} />);
      const toggleButton = screen.getByRole('button', { name: /விவரம்/i });
      expect(toggleButton).toBeInTheDocument();

      // Click to open details
      fireEvent.click(toggleButton);
      expect(screen.getByText(/ஏன் இந்த விவரங்களை நாங்கள் சேகரிப்பதில்லை\?/i)).toBeInTheDocument();

      // Click again to close details
      fireEvent.click(toggleButton);
      expect(screen.queryByText(/ஏன் இந்த விவரங்களை நாங்கள் சேகரிப்பதில்லை\?/i)).not.toBeInTheDocument();
    });
  });

  describe('CategoryBar', () => {
    it('renders "அனைத்தும்" and all 6 scheme category tabs', () => {
      const onSelect = vi.fn();
      render(
        <CategoryBar selectedCategory="all" onSelectCategory={onSelect} highContrast={false} />
      );

      expect(screen.getByText('அனைத்தும்')).toBeInTheDocument();
      expect(screen.getByText(/பெண்களுக்கு/i)).toBeInTheDocument();
      expect(screen.getByText(/கல்வி/i)).toBeInTheDocument();
      expect(screen.getByText(/விவசாயம்/i)).toBeInTheDocument();
    });

    it('calls onSelectCategory with clicked category id', () => {
      const onSelect = vi.fn();
      render(
        <CategoryBar selectedCategory="all" onSelectCategory={onSelect} highContrast={false} />
      );

      const womenBtn = screen.getByRole('button', { name: /பெண்களுக்கு/i });
      fireEvent.click(womenBtn);
      expect(onSelect).toHaveBeenCalledWith('women');
    });
  });

  describe('Header', () => {
    it('renders NIRA branding and tab navigation', () => {
      const onUpdateSettings = vi.fn();
      const onStartAgain = vi.fn();
      const setActiveTab = vi.fn();

      render(
        <Header
          settings={mockSettings}
          onUpdateSettings={onUpdateSettings}
          onStartAgain={onStartAgain}
          activeTab="navigator"
          setActiveTab={setActiveTab}
        />
      );

      expect(screen.getByText('NIRA')).toBeInTheDocument();
      expect(screen.getByText(/அரசு திட்ட வழிகாட்டி/i)).toBeInTheDocument();
    });

    it('cycles font size when font size button is tapped', () => {
      const onUpdateSettings = vi.fn();
      render(
        <Header
          settings={mockSettings}
          onUpdateSettings={onUpdateSettings}
          onStartAgain={vi.fn()}
          activeTab="navigator"
          setActiveTab={vi.fn()}
        />
      );

      const fontButton = screen.getByRole('button', { name: /எழுத்து அளவை மாற்று/i });
      fireEvent.click(fontButton);
      expect(onUpdateSettings).toHaveBeenCalled();
    });
  });

  describe('SchemeCard', () => {
    it('renders scheme title, benefits, and Read Aloud button', () => {
      const scheme = ALL_GOVERNMENT_SCHEMES[0];
      const onReadAloud = vi.fn();
      const onStopSpeaking = vi.fn();

      render(
        <SchemeCard
          scheme={scheme}
          settings={mockSettings}
          onAskThozhi={vi.fn()}
          isSpeakingThis={false}
          onReadAloud={onReadAloud}
          onStopSpeaking={onStopSpeaking}
        />
      );

      expect(screen.getByText(scheme.nameTa)).toBeInTheDocument();
      expect(screen.getByText(scheme.benefitsTa)).toBeInTheDocument();

      const readAloudBtn = screen.getByRole('button', { name: /திட்டத்தை சத்தமாக வாசி/i });
      expect(readAloudBtn).toBeInTheDocument();
      fireEvent.click(readAloudBtn);
      expect(onReadAloud).toHaveBeenCalled();
    });
  });
});
