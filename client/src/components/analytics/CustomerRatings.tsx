import { Card, CardContent } from "@/components/ui/card";
import { Star, StarHalf } from "lucide-react";

// This is a mock component as the API for customer ratings is not implemented
// In a real application, this would fetch data from an API endpoint
export default function CustomerRatings() {
  // Mock rating data - in a real app this would come from API
  const ratingData = {
    average: 4.8,
    total: 128,
    distribution: [
      { stars: 5, percentage: 80 },
      { stars: 4, percentage: 15 },
      { stars: 3, percentage: 5 },
      { stars: 2, percentage: 0 },
      { stars: 1, percentage: 0 },
    ]
  };

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
          Customer Ratings
        </h3>
        
        <div className="flex items-center mb-4">
          <div className="text-3xl font-bold text-gray-900 dark:text-white mr-4">
            {ratingData.average}
          </div>
          <div>
            <div className="flex text-yellow-400">
              {[1, 2, 3, 4].map((i) => (
                <Star key={i} className="fill-current h-4 w-4" />
              ))}
              <StarHalf className="fill-current h-4 w-4" />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Based on {ratingData.total} reviews
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          {ratingData.distribution.map((item) => (
            <div key={item.stars} className="flex items-center">
              <span className="text-xs w-6 text-gray-500 dark:text-gray-400">
                {item.stars}★
              </span>
              <div className="flex-1 h-2 mx-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full" 
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
