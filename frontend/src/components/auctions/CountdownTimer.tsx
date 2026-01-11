'use client';

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
    endTime: Date;
    onExpire?: () => void;
}

export default function CountdownTimer({ endTime, onExpire }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState('');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const end = new Date(endTime).getTime();
            const difference = end - now;

            if (difference <= 0) {
                setIsExpired(true);
                setTimeLeft('Ended');
                onExpire?.();
                return;
            }

            const hours = Math.floor(difference / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(interval);
    }, [endTime, onExpire]);

    return (
        <span className={`font-mono ${isExpired ? 'text-red-400' : 'text-zinc-300'}`}>
            {timeLeft}
        </span>
    );
}
