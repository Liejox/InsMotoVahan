import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';

export const Greeting: React.FC = () => {
  const { user } = useAuthStore();
  const [greeting, setGreeting] = useState('');
  const [timeState, setTimeState] = useState({
    day: '',
    date: '',
    time: ''
  });

  useEffect(() => {
    const updateTimeAndGreeting = () => {
      const now = new Date();
      const hour = now.getHours();
      
      // Update greeting
      if (hour >= 5 && hour < 12) {
        setGreeting('Good Morning ☀️');
      } else if (hour >= 12 && hour < 17) {
        setGreeting('Good Afternoon 🌤️');
      } else if (hour >= 17 && hour < 21) {
        setGreeting('Good Evening 🌇');
      } else {
        setGreeting('Good Night 🌙');
      }

      // Update time in Asia/Kolkata timezone
      const dayStr = now.toLocaleDateString('en-IN', {
        weekday: 'long',
        timeZone: 'Asia/Kolkata',
      });
      
      const dateStr = now.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      });
      
      const timeStr = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      }).toUpperCase() + ' IST';

      setTimeState({
        day: dayStr,
        date: dateStr,
        time: timeStr
      });
    };

    updateTimeAndGreeting();
    const interval = setInterval(updateTimeAndGreeting, 1000);
    return () => clearInterval(interval);
  }, []);

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Liejo';

  return (
    <div className="space-y-3">
      {/* Greeting Title */}
      <div className="space-y-1">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
          {greeting}
        </h1>
        <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-slate-300">
          Welcome back, {firstName}!
        </h2>
      </div>

      {/* Date & Time block (subtle, professional, H4-size feel) */}
      <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 text-slate-400 text-sm md:text-base font-semibold">
        <span className="text-brand-400">{timeState.day}</span>
        <span className="text-slate-600 dark:text-slate-700">•</span>
        <span>{timeState.date}</span>
        <span className="text-slate-600 dark:text-slate-700">•</span>
        <span className="text-slate-200 tracking-wider font-mono">{timeState.time}</span>
      </div>
    </div>
  );
};

export default React.memo(Greeting);
