import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuantityControlProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export default function QuantityControl({
  quantity,
  onIncrease,
  onDecrease,
  size = 'md',
  disabled = false,
}: QuantityControlProps) {
  const iconSize = size === 'sm' ? 'size-3.5' : 'size-4';
  const btnSize = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';

  if (quantity <= 0) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <Button
          size="icon"
          variant="default"
          className={`${btnSize} rounded-full shadow-md`}
          onClick={onIncrease}
          disabled={disabled}
          aria-label="加一份"
        >
          <Plus className={iconSize} />
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="icon"
        variant="secondary"
        className={`${btnSize} rounded-full`}
        onClick={onDecrease}
        disabled={disabled}
        aria-label="减一份"
      >
        <Minus className={iconSize} />
      </Button>
      <motion.span
        key={quantity}
        initial={{ scale: 1.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className={`font-semibold tabular-nums min-w-[1.5rem] text-center ${
          size === 'sm' ? 'text-sm' : 'text-base'
        }`}
      >
        {quantity}
      </motion.span>
      <Button
        size="icon"
        variant="default"
        className={`${btnSize} rounded-full`}
        onClick={onIncrease}
        disabled={disabled}
        aria-label="加一份"
      >
        <Plus className={iconSize} />
      </Button>
    </div>
  );
}
