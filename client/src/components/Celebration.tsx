import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Calendar, Zap } from "lucide-react";

interface CelebrationProps {
  type: 'daily' | 'streak' | 'monthly' | 'yearly';
  message: string;
  onComplete?: () => void;
}

export function Celebration({ type, message, onComplete }: CelebrationProps) {
  useEffect(() => {
    // Trigger confetti effect
    confetti({
      particleCount: type === 'yearly' ? 150 : 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4F46E5', '#10B981', '#F59E0B']
    });

    // Clean up after animation
    const timer = setTimeout(() => {
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [type, onComplete]);

  const icons = {
    daily: <Star className="h-6 w-6 text-yellow-500" />,
    streak: <Zap className="h-6 w-6 text-purple-500" />,
    monthly: <Calendar className="h-6 w-6 text-green-500" />,
    yearly: <Trophy className="h-6 w-6 text-orange-500" />
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -20 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <div className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
          <Badge variant="outline" className="h-12 w-12 rounded-full flex items-center justify-center">
            {icons[type]}
          </Badge>
          <div>
            <h4 className="font-semibold text-sm">Achievement Unlocked!</h4>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
