import { useState, useEffect } from "react";
import type { OnboardingData } from "@/components/onboarding/OnboardingModal";

const ONBOARDING_KEY = "reklamai_onboarding_complete";

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompleted = localStorage.getItem(ONBOARDING_KEY);
    if (!hasCompleted) {
      // Small delay for smoother UX
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const completeOnboarding = (data: OnboardingData) => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setOnboardingData(data);
    setShowOnboarding(false);
  };

  const skipOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    setShowOnboarding(true);
  };

  return {
    showOnboarding,
    setShowOnboarding,
    onboardingData,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
  };
}
