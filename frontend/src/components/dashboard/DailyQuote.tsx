import React from 'react';
import { getQuoteForToday } from '../../data/dailyQuotes';

export const DailyQuote: React.FC = () => {
  const quote = getQuoteForToday();

  return (
    <div className="border-l-2 border-brand-500/30 pl-4 py-0.5 transition-colors duration-200">
      <p className="text-sm md:text-base text-slate-400 dark:text-slate-300 font-medium italic line-clamp-2 leading-relaxed">
        "{quote}"
      </p>
    </div>
  );
};

export default React.memo(DailyQuote);
