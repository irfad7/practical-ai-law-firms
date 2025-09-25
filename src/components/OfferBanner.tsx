import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface OfferBannerProps {
  onScheduleCall?: () => void;
}

const OfferBanner = ({ onScheduleCall }: OfferBannerProps) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    // Set end time to Friday, July 18th, 2025 at 11:59 PM PT
    // Using explicit UTC time: July 19th, 2025 at 06:59 AM UTC (PT is UTC-7)
    const endTime = new Date('2025-07-19T06:59:00Z');

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (time: number) => time.toString().padStart(2, '0');

  return (
    <div className="fixed top-0 w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-3 px-4 shadow-lg z-50">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-3 lg:gap-6 text-center">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">⚡</span>
            <span className="py-2 text-xl sm:text-2xl shadow-lg\">
              Get $1,000 OFF! Expires in
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white/30 backdrop-blur-sm rounded-xl px-4 py-2 font-mono text-xl sm:text-2xl font-bold shadow-lg border border-white/20">
              {timeLeft.days > 0 && `${timeLeft.days}d `}
              {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
            </div>
          </div>
        </div>
        {onScheduleCall && (
          <Button 
            onClick={onScheduleCall}
            variant="secondary"
            size="sm"
            className="bg-white text-green-600 hover:bg-gray-100 font-semibold whitespace-nowrap"
          >
            Schedule Strategy Call Now
          </Button>
        )}
      </div>
    </div>
  );
};

export default OfferBanner;