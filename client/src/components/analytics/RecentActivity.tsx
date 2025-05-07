import { Card, CardContent } from "@/components/ui/card";
import { 
  CalendarCheck, 
  CheckCircle, 
  Star, 
  UserPlus, 
  ShoppingCart,
  AlertTriangle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Activity type definition
type Activity = {
  id: number;
  type: 'booking' | 'service' | 'review' | 'customer' | 'product' | 'alert';
  title: string;
  description: string;
  timestamp: Date;
};

// This is a mock component as the API for recent activity is not implemented
// In a real application, this would fetch data from an API endpoint
export default function RecentActivity() {
  // Mock activity data - in a real app this would come from API
  const activities: Activity[] = [
    {
      id: 1,
      type: 'booking',
      title: 'New booking created',
      description: 'Michael Brown booked a Tire Rotation for today at 2:00 PM',
      timestamp: new Date(new Date().getTime() - 10 * 60000) // 10 minutes ago
    },
    {
      id: 2,
      type: 'service',
      title: 'Service completed',
      description: 'Oil Change for Sarah Johnson completed',
      timestamp: new Date(new Date().getTime() - 45 * 60000) // 45 minutes ago
    },
    {
      id: 3,
      type: 'review',
      title: 'New review received',
      description: 'John Smith left a 5-star review for Oil Change service',
      timestamp: new Date(new Date().getTime() - 120 * 60000) // 2 hours ago
    },
    {
      id: 4,
      type: 'alert',
      title: 'Low inventory alert',
      description: 'Engine Oil (5W-30) is running low (5 items left)',
      timestamp: new Date(new Date().getTime() - 180 * 60000) // 3 hours ago
    }
  ];

  // Function to get the appropriate icon for each activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return (
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <CalendarCheck className="h-4 w-4" />
          </div>
        );
      case 'service':
        return (
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
          </div>
        );
      case 'review':
        return (
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
            <Star className="h-4 w-4" />
          </div>
        );
      case 'customer':
        return (
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <UserPlus className="h-4 w-4" />
          </div>
        );
      case 'product':
        return (
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <ShoppingCart className="h-4 w-4" />
          </div>
        );
      case 'alert':
        return (
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
            <AlertTriangle className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400">
            <CalendarCheck className="h-4 w-4" />
          </div>
        );
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start">
              {getActivityIcon(activity.type)}
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
          
          {activities.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              No recent activity
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
