import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
    label: string;
  };
  iconColor?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  iconColor = 'text-primary',
}: StatsCardProps) {
  return (
    <Card className="material-shadow card-hover">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
          <div
            className={`w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center`}
          >
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center text-sm">
            <span
              className={trend.isPositive ? 'text-green-600' : 'text-red-500'}
            >
              {trend.isPositive ? '↗' : '↘'} {trend.value}
            </span>
            <span className="text-muted-foreground ml-2">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
