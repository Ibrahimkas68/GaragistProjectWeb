import { useEffect } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import GarageMap from "@/components/dashboard/GarageMap";
import DashboardSummary from "@/components/dashboard/DashboardSummary";
import BookingsTable from "@/components/bookings/BookingsTable";
import HeroMetrics from "@/components/dashboard/HeroMetrics";
import EarningsChart from "@/components/dashboard/EarningsChart";
import GarageStatusToggle from "@/components/dashboard/GarageStatusToggle";
import { Button } from "@/components/ui/button";
import { CalendarPlus, Filter, ArrowRight } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { useWebSocket } from "@/hooks/use-websocket";
import { Link } from "wouter";

export default function Dashboard() {
  // Use garage ID 1 for demo purposes - in a real app, this would come from the user's context
  const garageId = 1;

  // Set up WebSocket connection for dashboard
  const { sendMessage } = useWebSocket('dashboard-updates');

  // Subscribe to WebSocket channels on component mount
  useEffect(() => {
    sendMessage({
      type: 'subscribe',
      channels: ['booking-updates', 'garage-updates', 'service-updates']
    });
  }, [sendMessage]);

  // Get today's bookings for the dashboard
  const { data: todaysBookings, refetch: refetchBookings } = useQuery({
    queryKey: [`/api/bookings/today?garageId=${garageId}`],
  });

  return (
    <>
      <Helmet>
        <title>Dashboard - RilyGo G&AE</title>
        <meta name="description" content="RilyGo G&AE dashboard showing garage status, today's summary, and booking management." />
      </Helmet>

      <div className="space-y-6">
        {/* Garage Status Toggle */}
        <GarageStatusToggle garageId={garageId} />
        
        {/* Hero Metrics */}
        <HeroMetrics garageId={garageId} />
        
        {/* Earnings Chart */}
        <EarningsChart garageId={garageId} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Garage Map Component */}
          <Card>
            <CardHeader>
              <CardTitle>Garage Location</CardTitle>
            </CardHeader>
            <CardContent className="p-0 aspect-video">
              <GarageMap garageId={garageId} />
            </CardContent>
          </Card>
          
          {/* Dashboard Summary Component */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <DashboardSummary garageId={garageId} />
            </CardContent>
          </Card>
        </div>
        
        {/* Bookings Section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <div>
                <CardTitle>Today's Bookings</CardTitle>
                <CardDescription>
                  Manage your bookings and service appointments for today
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button>
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  New Booking
                </Button>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <BookingsTable 
              garageId={garageId} 
              statusFilter={["New", "Confirmed", "InProgress"]}
            />
          </CardContent>
          <CardFooter className="py-3 px-6 border-t flex justify-end">
            <Link href="/bookings">
              <Button variant="outline" className="gap-1">
                View All Bookings
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
