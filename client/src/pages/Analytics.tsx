import { useState } from "react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Download } from "lucide-react";
import AnalyticsCharts from "@/components/analytics/AnalyticsCharts";
import CustomerRatings from "@/components/analytics/CustomerRatings";
import RecentActivity from "@/components/analytics/RecentActivity";
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/ui/select";

export default function Analytics() {
  // Use garage ID 1 for demo purposes - in a real app, this would come from the user's context
  const garageId = 1;
  
  // State for date range
  const [dateRange, setDateRange] = useState("30days");

  return (
    <>
      <Helmet>
        <title>Analytics - RilyGo G&AE</title>
        <meta name="description" content="View detailed performance analytics for your garage with RilyGo G&AE - bookings, revenue, customer ratings, and more." />
      </Helmet>

      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <div>
                <CardTitle>Analytics Overview</CardTitle>
                <CardDescription>
                  Track your garage's performance metrics and trends
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-44">
                    <Calendar className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="90days">Last 90 Days</SelectItem>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                    <SelectItem value="lastMonth">Last Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Analytics Charts */}
            <AnalyticsCharts garageId={garageId} />
            
            {/* Customer Ratings and Recent Activity in a grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CustomerRatings />
              <RecentActivity />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
