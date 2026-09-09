import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, SkipForward } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const STEPS = [
  { number: 1, label: 'Fiverr Profile', path: '/onboarding/step/1' },
  { number: 2, label: 'Ideal Clients (ICPs)', path: '/onboarding/step/2' },
  { number: 3, label: 'Confirm & Complete', path: '/onboarding/step/3' },
];

export const OnboardingLayout: React.FC = () => {
  const { updateOnboardingState, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine current step from URL
  const currentStep = parseInt(location.pathname.split('/step/')[1] || '1', 10);

  const handleSkip = async () => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      await fetch('/api/v1/user/onboarding', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ skipped: true }),
      });
      
      updateOnboardingState({ onboardingSkipped: true });
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to skip onboarding:', err);
      // Still navigate even if API fails
      updateOnboardingState({ onboardingSkipped: true });
      navigate('/dashboard');
    }
  };

  return (
    <div className="max-w-6xl xl:max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#222325]">
          Set Up Your Growth Profile
          <span className="text-[#1dbf73]">.</span>
        </h1>
        <p className="text-sm text-[#74767e] mt-1">
          Complete these 3 steps to unlock personalized recommendations
        </p>
      </div>

      {/* Step Progress Indicator */}
      <div className="bg-white border border-[#dadbdd] rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;

            return (
              <React.Fragment key={step.number}>
                {/* Step circle + label */}
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-[#1dbf73] text-white'
                        : isCurrent
                        ? 'bg-[#1dbf73] text-white ring-4 ring-[#1dbf73]/20'
                        : 'bg-[#f5f5f5] text-[#74767e] border border-[#dadbdd]'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={`text-xs font-semibold hidden sm:inline ${
                      isCurrent
                        ? 'text-[#222325]'
                        : isCompleted
                        ? 'text-[#1dbf73]'
                        : 'text-[#74767e]'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector line */}
                {index < STEPS.length - 1 && (
                  <div className="flex-1 mx-3">
                    <div
                      className={`h-0.5 rounded-full transition-all ${
                        currentStep > step.number + 1
                          ? 'bg-[#1dbf73]'
                          : currentStep > step.number
                          ? 'bg-[#1dbf73]/50'
                          : 'bg-[#e4e5e7]'
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content (rendered by nested route) */}
      <div className="bg-white border border-[#dadbdd] rounded-xl shadow-xs overflow-hidden">
        <Outlet />
      </div>

      {/* Skip Button */}
      <div className="flex justify-center">
        <button
          onClick={handleSkip}
          className="flex items-center gap-1.5 text-xs text-[#74767e] hover:text-[#222325] font-medium transition-colors cursor-pointer py-2 px-4 rounded-lg hover:bg-white hover:border-[#dadbdd] border border-transparent"
        >
          <SkipForward className="w-3.5 h-3.5" />
          <span>Skip for now — I'll do this later</span>
        </button>
      </div>
    </div>
  );
};
