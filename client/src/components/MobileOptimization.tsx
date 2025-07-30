import React from 'react';
import { cn } from '@/lib/utils';

// Mobile-first responsive utilities
export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = React.useState(false);
  const [isTablet, setIsTablet] = React.useState(false);

  React.useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile, isTablet, isDesktop: !isMobile && !isTablet };
};

// Mobile-optimized card component
interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  compact?: boolean;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  className,
  onClick,
  compact = false,
}) => {
  const { isMobile } = useMobileDetection();

  return (
    <div
      className={cn(
        'bg-card border rounded-lg transition-colors',
        onClick && 'cursor-pointer hover:bg-accent/50 active:bg-accent',
        isMobile && !compact && 'p-4 mb-3',
        isMobile && compact && 'p-3 mb-2',
        !isMobile && 'p-6 mb-4',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// Mobile-optimized button with touch feedback
interface MobileButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
}

export const MobileButton: React.FC<MobileButtonProps> = ({
  children,
  variant = 'default',
  size = 'default',
  className,
  onClick,
  disabled = false,
  fullWidth = false,
}) => {
  const { isMobile } = useMobileDetection();

  const baseStyles = cn(
    'inline-flex items-center justify-center rounded-md font-medium transition-all',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    // Touch feedback for mobile
    isMobile && 'active:scale-[0.98] active:duration-75',
    fullWidth && 'w-full'
  );

  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline:
      'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  };

  const sizes = {
    sm: isMobile ? 'h-10 px-4 text-sm' : 'h-9 px-3 text-sm',
    default: isMobile ? 'h-12 px-6' : 'h-10 px-4 py-2',
    lg: isMobile ? 'h-14 px-8 text-lg' : 'h-11 px-8',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// Mobile-optimized navigation tabs
interface MobileTabsProps {
  tabs: Array<{ id: string; label: string; icon?: React.ReactNode }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const MobileTabs: React.FC<MobileTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className,
}) => {
  const { isMobile } = useMobileDetection();

  if (isMobile) {
    return (
      <div
        className={cn(
          'flex overflow-x-auto scrollbar-hide border-b bg-background',
          className
        )}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors min-w-max',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    );
  }

  // Desktop version with full width tabs
  return (
    <div className={cn('flex border-b bg-background', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors',
            activeTab === tab.id
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          )}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

// Mobile-optimized form field
interface MobileFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
}

export const MobileField: React.FC<MobileFieldProps> = ({
  label,
  children,
  error,
  required = false,
  className,
}) => {
  const { isMobile } = useMobileDetection();

  return (
    <div className={cn('space-y-2', isMobile && 'mb-4', className)}>
      <label
        className={cn(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          isMobile && 'text-base'
        )}
      >
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className={cn('text-sm text-destructive', isMobile && 'text-base')}>
          {error}
        </p>
      )}
    </div>
  );
};

// Mobile-optimized list item
interface MobileListItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  rightElement?: React.ReactNode;
  className?: string;
  dense?: boolean;
}

export const MobileListItem: React.FC<MobileListItemProps> = ({
  children,
  onClick,
  rightElement,
  className,
  dense = false,
}) => {
  const { isMobile } = useMobileDetection();

  return (
    <div
      className={cn(
        'flex items-center justify-between border-b last:border-b-0 transition-colors',
        onClick && 'cursor-pointer hover:bg-accent/50 active:bg-accent',
        isMobile && !dense && 'py-4 px-4',
        isMobile && dense && 'py-3 px-4',
        !isMobile && 'py-3 px-6',
        className
      )}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">{children}</div>
      {rightElement && <div className="flex-shrink-0 ml-4">{rightElement}</div>}
    </div>
  );
};

// Mobile-optimized input with proper touch targets
interface MobileInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: string;
  className?: string;
  disabled?: boolean;
}

export const MobileInput: React.FC<MobileInputProps> = ({
  placeholder,
  value,
  onChange,
  type = 'text',
  className,
  disabled = false,
}) => {
  const { isMobile } = useMobileDetection();

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className={cn(
        'flex w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        isMobile ? 'h-12 text-base' : 'h-10 py-2',
        className
      )}
    />
  );
};

// Swipe gesture hook for mobile
export const useSwipeGesture = (
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold = 50
) => {
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > threshold;
    const isRightSwipe = distance < -threshold;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
};

// Mobile-optimized modal/sheet
interface MobileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export const MobileSheet: React.FC<MobileSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
}) => {
  const { isMobile } = useMobileDetection();

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-md"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-auto">{children}</div>
        </div>
      </div>
    );
  }

  // Desktop modal
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-md">
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default {
  useMobileDetection,
  MobileCard,
  MobileButton,
  MobileTabs,
  MobileField,
  MobileListItem,
  MobileInput,
  useSwipeGesture,
  MobileSheet,
};
