import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarClock, 
  User, 
  Car, 
  Wrench,
  ArrowRight,
  Filter,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Booking, Driver } from "@shared/schema";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useWebSocket } from "@/hooks/use-websocket";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getInitials } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

interface BookingKanbanProps {
  garageId: number;
}

// Status column definitions
const statusColumns = [
  { id: "New", name: "Unassigned Jobs", color: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800" },
  { id: "Confirmed", name: "Assigned Jobs", color: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800" },
  { id: "Completed", name: "Finished Jobs", color: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" },
];

export default function BookingKanban({ garageId }: BookingKanbanProps) {
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  
  // Filter options
  const [filterBy, setFilterBy] = useState("today");
  
  // Load bookings and drivers
  const { data: bookings, isLoading, refetch } = useQuery<Booking[]>({
    queryKey: [`/api/bookings?garageId=${garageId}`],
  });
  
  const { data: drivers } = useQuery<Driver[]>({
    queryKey: ['/api/drivers'],
  });

  // Setup WebSocket for real-time updates
  useWebSocket('booking-updates', () => {
    refetch();
  });

  // Mutation for updating booking status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      await fetch(`/api/bookings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bookings?garageId=${garageId}`] });
      setSelectedBooking(null);
    },
  });

  // Group bookings by status
  const bookingsByStatus = statusColumns.reduce((acc, column) => {
    let filteredBookings = bookings?.filter(booking => {
      // First filter by status
      if (column.id === "New") {
        return booking.status === "New" && !['Cancelled', 'NoShow'].includes(booking.status);
      } else if (column.id === "Confirmed") {
        return (booking.status === "Confirmed" || booking.status === "InProgress") && 
               !['Cancelled', 'NoShow'].includes(booking.status);
      } else if (column.id === "Completed") {
        return booking.status === "Completed" && !['Cancelled', 'NoShow'].includes(booking.status);
      }
      return false;
    }) || [];
    
    // Then filter by date if required
    if (filterBy === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filteredBookings = filteredBookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        bookingDate.setHours(0, 0, 0, 0);
        return bookingDate.getTime() === today.getTime();
      });
    } else if (filterBy === "thisWeek") {
      const today = new Date();
      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - today.getDay());
      firstDayOfWeek.setHours(0, 0, 0, 0);
      
      const lastDayOfWeek = new Date(firstDayOfWeek);
      lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
      lastDayOfWeek.setHours(23, 59, 59, 999);
      
      filteredBookings = filteredBookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        return bookingDate >= firstDayOfWeek && bookingDate <= lastDayOfWeek;
      });
    } else if (filterBy === "thisMonth") {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      lastDayOfMonth.setHours(23, 59, 59, 999);
      
      filteredBookings = filteredBookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        return bookingDate >= firstDayOfMonth && bookingDate <= lastDayOfMonth;
      });
    }
    
    acc[column.id] = filteredBookings;
    return acc;
  }, {} as Record<string, Booking[]>);

  // Find driver by ID
  const getDriverById = (driverId: number) => {
    return drivers?.find(driver => driver.id === driverId);
  };

  // For toast notifications
  const { toast } = useToast();

  // Move a booking to the next status
  const moveToNextStatus = (booking: Booking) => {
    let nextStatus;
    if (booking.status === "New") {
      nextStatus = "Confirmed";
    } else if (booking.status === "Confirmed") {
      nextStatus = "InProgress";
    } else if (booking.status === "InProgress") {
      nextStatus = "Completed";
    }
    
    if (nextStatus) {
      // Show appropriate toast based on the status change
      updateStatusMutation.mutate(
        { id: booking.id, status: nextStatus },
        {
          onSuccess: () => {
            const driver = getDriverById(booking.driverId);
            const driverName = driver?.name || "Unassigned";
            
            if (nextStatus === "Confirmed") {
              toast({
                title: "Job Confirmed",
                description: `Job #${booking.bookingNumber} has been assigned successfully.`,
                action: (
                  <ToastAction altText="View" onClick={() => openBookingDetails(booking)}>
                    View
                  </ToastAction>
                ),
              });
            } else if (nextStatus === "InProgress") {
              toast({
                title: "Service Started",
                description: `Service for job #${booking.bookingNumber} has begun.`,
                action: (
                  <ToastAction altText="View" onClick={() => openBookingDetails(booking)}>
                    View
                  </ToastAction>
                ),
              });
            } else if (nextStatus === "Completed") {
              toast({
                title: "Job Completed",
                description: `Job #${booking.bookingNumber} has been marked as complete.`,
                action: (
                  <ToastAction altText="View" onClick={() => openBookingDetails(booking)}>
                    View
                  </ToastAction>
                ),
              });
            }
          }
        }
      );
    }
  };
  
  // Open booking details
  const openBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    const driver = getDriverById(booking.driverId);
    setSelectedDriver(driver || null);
  };

  // Generate service type display text
  const getServiceType = (booking: Booking) => {
    const types = ['Oil Change', 'Brake Repair', 'Tire Rotation', 'Engine Repair',
                  'Transmission Service', 'Battery Replacement', 'AC Service', 'Wheel Alignment'];
    // For demo, we'll just pick a consistent service type based on booking ID
    return types[booking.id % types.length];
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant={filterBy === "today" ? "default" : "outline"}
            onClick={() => setFilterBy("today")}
            size="sm"
          >
            Today
          </Button>
          <Button
            variant={filterBy === "thisWeek" ? "default" : "outline"}
            onClick={() => setFilterBy("thisWeek")}
            size="sm"
          >
            This Week
          </Button>
          <Button
            variant={filterBy === "thisMonth" ? "default" : "outline"}
            onClick={() => setFilterBy("thisMonth")}
            size="sm"
          >
            This Month
          </Button>
        </div>
        
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>
    
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {statusColumns.map((column) => (
          <div key={column.id} className={`flex flex-col rounded-md border ${column.color}`}>
            <div className="p-4 border-b">
              <h3 className="text-md font-medium flex items-center justify-between">
                {column.name}
                <Badge variant="outline" className="ml-2">
                  {isLoading ? "..." : bookingsByStatus[column.id].length}
                </Badge>
              </h3>
            </div>
            
            <div className="flex-1 p-3 overflow-y-auto max-h-[70vh]">
              {isLoading ? (
                <div className="space-y-3">
                  <Card className="animate-pulse bg-gray-200 dark:bg-gray-700 h-28"></Card>
                  <Card className="animate-pulse bg-gray-200 dark:bg-gray-700 h-28"></Card>
                </div>
              ) : bookingsByStatus[column.id].length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-6 text-sm">
                  No jobs
                </div>
              ) : (
                <div className="space-y-3">
                  {bookingsByStatus[column.id].map((booking) => {
                    const driver = getDriverById(booking.driverId);
                    const serviceType = getServiceType(booking);
                    
                    return (
                      <Card 
                        key={booking.id} 
                        className="border hover:border-primary cursor-pointer transition-colors"
                        onClick={() => openBookingDetails(booking)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm text-primary">{booking.bookingNumber}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Job Scheduled
                              </p>
                            </div>
                            
                            {column.id === "Confirmed" && driver && (
                              <Avatar className="h-8 w-8">
                                {driver.avatar ? (
                                  <AvatarImage src={driver.avatar} />
                                ) : (
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {getInitials(driver.name)}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                            )}
                          </div>
                          
                          <div className="mt-3 space-y-2">
                            <div className="flex justify-between">
                              <div className="flex items-center text-sm">
                                <CalendarClock className="h-4 w-4 mr-2 text-gray-500" />
                                {formatDate(new Date(booking.date), "h:mm a, d MMM")}
                              </div>
                              
                              <Badge 
                                variant="outline" 
                                className="text-xs"
                              >
                                {serviceType}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center text-sm">
                              <User className="h-4 w-4 mr-2 text-gray-500" />
                              {driver?.name || "Unassigned"}
                            </div>
                            
                            {driver && (
                              <div className="flex items-center text-sm">
                                <Car className="h-4 w-4 mr-2 text-gray-500" />
                                {driver.vehicleMake} {driver.vehicleModel}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Job Details</span>
              <Badge variant="outline">{selectedBooking?.bookingNumber}</Badge>
            </DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Personal Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">First Name</p>
                    <p className="text-sm">{selectedDriver?.name.split(' ')[0] || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Last Name</p>
                    <p className="text-sm">{selectedDriver?.name.split(' ').slice(1).join(' ') || "N/A"}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Address Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Street Address</p>
                    <p className="text-sm">{selectedDriver?.address || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Building Number</p>
                    <p className="text-sm">-</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Apartment Number</p>
                    <p className="text-sm">-</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Zip Code</p>
                    <p className="text-sm">{selectedDriver?.zip || "N/A"}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Job Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Job Type</p>
                    <p className="text-sm">{getServiceType(selectedBooking)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Job Title</p>
                    <p className="text-sm">{selectedBooking.status === "New" ? "Unassigned" : "Service Job"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Job Notes</p>
                  <p className="text-sm">
                    {selectedBooking.notes || "Vehicle needs maintenance service. Customer reported issues with performance."}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-gray-500">Scheduled Time</p>
                <p className="text-sm">{formatDate(new Date(selectedBooking.date), "PPpp")}</p>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex flex-col sm:flex-row justify-between gap-3 sm:justify-between">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => setSelectedBooking(null)} className="w-full sm:w-auto">
                Cancel
              </Button>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              {selectedBooking && selectedBooking.status !== "Completed" && (
                <>
                  {selectedBooking.status === "New" && (
                    <Button 
                      variant="default"
                      onClick={() => moveToNextStatus(selectedBooking)}
                      disabled={updateStatusMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      {updateStatusMutation.isPending ? "Confirming..." : "Confirm Booking"}
                    </Button>
                  )}
                  
                  {selectedBooking.status === "Confirmed" && (
                    <Button 
                      variant="default"
                      onClick={() => moveToNextStatus(selectedBooking)}
                      disabled={updateStatusMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      {updateStatusMutation.isPending ? "Starting..." : "Begin Service"}
                    </Button>
                  )}
                  
                  {selectedBooking.status === "InProgress" && (
                    <Button 
                      variant="default"
                      onClick={() => moveToNextStatus(selectedBooking)}
                      disabled={updateStatusMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      {updateStatusMutation.isPending ? "Completing..." : "Mark as Complete"}
                    </Button>
                  )}
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
