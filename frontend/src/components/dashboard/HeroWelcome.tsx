import React from 'react';
import Greeting from './Greeting';
import DailyQuote from './DailyQuote';
import TodayFocus from './TodayFocus';

interface HeroWelcomeProps {
  stats?: {
    todayRenewalsCount: number;
    tomorrowRenewalsCount: number;
  } | null;
}

export const HeroWelcome: React.FC<HeroWelcomeProps> = ({ stats }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 lg:p-10 border border-slate-800/30 shadow-xl mb-6 animate-gradient transition-colors duration-200">
      {/* Self-contained styling for CSS keyframe animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes gradient-anim {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float-anim {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
          100% { transform: translateY(0px); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-left-fade {
          from { opacity: 0; transform: translateX(-24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fade-in-only {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-gradient {
          background: linear-gradient(-45deg, #090e1a, #131c33, #0b0f19, #0e121a);
          background-size: 300% 300%;
          animation: gradient-anim 18s ease-in-out infinite;
        }
        .animate-float {
          animation: float-anim 5s ease-in-out infinite;
        }
        .anim-greeting {
          animation: fade-up 800ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-photo {
          animation: slide-left-fade 800ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-fade {
          animation: fade-in-only 900ms ease-out forwards;
        }
      `}} />

      <div className="flex flex-col md:flex-row items-center md:items-stretch gap-8 md:gap-12 relative z-10">
        {/* Left Side: Portrait Photo (Slide Left + Fade on load, subtle Float infinite) */}
        <div className="flex-shrink-0 flex items-center justify-center anim-photo">
          <img 
            src="http://localhost:5000/hero-image/Liejo%20S%20Hero.png" 
            alt="Liejo's Portrait" 
            className="max-h-[240px] md:max-h-[300px] lg:max-h-[340px] w-auto object-contain rounded-2xl animate-float shadow-2xl"
            loading="eager"
          />
        </div>

        {/* Right Side: Details (Greeting, Quote, Focus) */}
        <div className="flex-1 flex flex-col justify-between space-y-6 text-center md:text-left">
          {/* Greeting: Fade Up */}
          <div className="anim-greeting">
            <Greeting />
          </div>

          {/* Quote: Fade */}
          <div className="anim-fade">
            <DailyQuote />
          </div>

          {/* Focus: Fade */}
          <div className="anim-fade">
            <TodayFocus stats={stats} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(HeroWelcome);
