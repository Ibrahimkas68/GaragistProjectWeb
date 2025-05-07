import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BadgeDollarSign, 
  Calendar, 
  Car, 
  User, 
  TrendingUp, 
  TrendingDown,
  Clock
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface HeroMetricsProps {
  garageId: number;
}

interface MetricsData {
  totalRevenue: number;
  revenueChange: number;
  activeBookings: number;
  bookingsChange: number;
  carsInService: number;
  carsPendingDiagnostics: number;
  availableMechanics: number;
  totalMechanics: number;
}

export default function HeroMetrics({ garageId }: HeroMetricsProps) {
  // In a real application, this would fetch from an API endpoint
  const { data, isLoading } = useQuery<MetricsData>({
    queryKey: [`/api/analytics/hero-metrics?garageId=${garageId}`],
    // Fallback data for demonstration
    placeholderData: {
      totalRevenue: 78423,
      revenueChange: 15.2,
      activeBookings: 32,
      bookingsChange: 5.2,
      carsInService: 12,
      carsPendingDiagnostics: 3,
      availableMechanics: 4,
      totalMechanics: 6
    }
  });

  const TrendIcon = ({ value }: { value: number }) => {
    return value >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const formatPercentage = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}${value.toFixed(1)}%`;
  };

  const metrics = [
    {
      title: "Total Revenue",
      value: data?.totalRevenue || 0,
      change: data?.revenueChange || 0,
      icon: <BadgeDollarSign className="h-5 w-5 text-blue-500" />,
      format: (value: number) => formatCurrency(value),
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      textColor: "text-blue-700 dark:text-blue-400",
    },
    {
      title: "Active Bookings",
      value: data?.activeBookings || 0,
      change: data?.bookingsChange || 0,
      icon: <Calendar className="h-5 w-5 text-purple-500" />,
      format: (value: number) => value.toString(),
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      textColor: "text-purple-700 dark:text-purple-400",
    },
    {
      title: "Cars in Service",
      value: data?.carsInService || 0,
      subtext: `${data?.carsPendingDiagnostics || 0} pending diagnostics`,
      icon: <Car className="h-5 w-5 text-emerald-500" />,
      format: (value: number) => value.toString(),
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      textColor: "text-emerald-700 dark:text-emerald-400",
    },
    {
      title: "Available Mechanics",
      value: data?.availableMechanics || 0,
      subtext: `of ${data?.totalMechanics || 0} total`,
      icon: <User className="h-5 w-5 text-amber-500" />,
      format: (value: number) => value.toString(),
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      textColor: "text-amber-700 dark:text-amber-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {isLoading ? (
        // Loading placeholders
        [...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6 h-24"></CardContent>
          </Card>
        ))
      ) : (
        // Actual data
        metrics.map((metric, index) => (
          <Card key={index} className={`${metric.bgColor} border-0 shadow-sm`}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="rounded-full p-2 bg-white dark:bg-gray-800">
                  {metric.icon}
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${metric.textColor}`}>{metric.title}</p>
                  <h3 className={`text-2xl font-bold ${metric.textColor}`}>
                    {metric.format(metric.value)}
                  </h3>
                </div>
              </div>
              <div className="mt-2 flex justify-end">
                {metric.change !== undefined ? (
                  <div className="flex items-center text-xs">
                    <TrendIcon value={metric.change} />
                    <span className={metric.change >= 0 ? "text-green-500 ml-1" : "text-red-500 ml-1"}>
                      {formatPercentage(metric.change)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">vs. last month</span>
                  </div>
                ) : metric.subtext ? (
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="h-3 w-3 mr-1" />
                    {metric.subtext}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}