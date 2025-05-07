import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SummaryProps {
  garageId: number;
}

interface SummaryData {
  bookings: number;
  revenue: number;
  pendingActions: number;
}

export default function DashboardSummary({ garageId }: SummaryProps) {
  const { data, isLoading } = useQuery<SummaryData>({
    queryKey: [`/api/analytics/today-summary?garageId=${garageId}`],
  });

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold mb-4">Today's Summary</h2>
        <div className="space-y-4">
          {isLoading ? (
            // Loading placeholders
            <>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg animate-pulse h-16"></div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg animate-pulse h-16"></div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg animate-pulse h-16"></div>
            </>
          ) : (
            // Actual data
            <>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Bookings</span>
                  <span className="text-xl font-bold text-blue-700 dark:text-blue-400">{data?.bookings || 0}</span>
                </div>
                <div className="mt-1 text-xs text-blue-600 dark:text-blue-500">
                  <span className="inline-flex items-center">
                    <ArrowUp className="mr-1 h-3 w-3" />
                    8% from yesterday
                  </span>
                </div>
              </div>
              
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">Revenue</span>
                  <span className="text-xl font-bold text-green-700 dark:text-green-400">
                    {formatCurrency(data?.revenue || 0)}
                  </span>
                </div>
                <div className="mt-1 text-xs text-green-600 dark:text-green-500">
                  <span className="inline-flex items-center">
                    <ArrowUp className="mr-1 h-3 w-3" />
                    12% from yesterday
                  </span>
                </div>
              </div>
              
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Pending Actions</span>
                  <span className="text-xl font-bold text-amber-700 dark:text-amber-400">{data?.pendingActions || 0}</span>
                </div>
                <div className="mt-1 text-xs text-amber-600 dark:text-amber-500">
                  <span className="inline-flex items-center">
                    <Clock className="mr-1 h-3 w-3" />
                    {data && data.pendingActions > 0 
                      ? `${Math.min(data.pendingActions, 3)} need urgent attention` 
                      : 'No urgent actions'
                    }
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
