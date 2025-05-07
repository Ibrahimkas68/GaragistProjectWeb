import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarClock, 
  User, 
  Car, 
  CreditCard,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Booking, Driver } from "@shared/schema";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useWebSocket } from "@/hooks/use-websocket";

interface BookingKanbanProps {
  garageId: number;
}

// Status column definitions
const statusColumns = [
  { id: "New", name: "New" },
  { id: "Confirmed", name: "Confirmed" },
  { id: "InProgress", name: "In Progress" },
  { id: "Completed", name: "Completed" },
];

export default function BookingKanban({ garageId }: BookingKanbanProps) {
  const queryClient = useQueryClient();
  
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
    },
  });

  // Group bookings by status
  const bookingsByStatus = statusColumns.reduce((acc, column) => {
    acc[column.id] = bookings?.filter(booking => 
      booking.status === column.id && 
      !['Cancelled', 'NoShow'].includes(booking.status)
    ) || [];
    return acc;
  }, {} as Record<string, Booking[]>);

  // Find driver by ID
  const getDriverById = (driverId: number) => {
    return drivers?.find(driver => driver.id === driverId);
  };

  // Move a booking to the next status
  const moveToNextStatus = (booking: Booking) => {
    const currentStatusIndex = statusColumns.findIndex(col => col.id === booking.status);
    if (currentStatusIndex < statusColumns.length - 1) {
      const nextStatus = statusColumns[currentStatusIndex + 1].id;
      updateStatusMutation.mutate({ id: booking.id, status: nextStatus });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statusColumns.map((column) => (
        <div key={column.id} className="flex flex-col">
          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-t-md">
            <h3 className="text-sm font-medium flex items-center justify-between">
              {column.name}
              <Badge variant="outline" className="ml-2">
                {isLoading ? "..." : bookingsByStatus[column.id].length}
              </Badge>
            </h3>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800/50 flex-1 p-2 rounded-b-md overflow-y-auto max-h-[600px]">
            {isLoading ? (
              <Card className="mb-2 animate-pulse bg-gray-200 dark:bg-gray-700 h-32"></Card>
            ) : bookingsByStatus[column.id].length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
                No bookings
              </div>
            ) : (
              bookingsByStatus[column.id].map((booking) => {
                const driver = getDriverById(booking.driverId);
                
                return (
                  <Card key={booking.id} className="mb-2 border-l-4 border-l-primary">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">{booking.bookingNumber}</h4>
                        <Badge variant="outline" className="text-xs">
                          {formatCurrency(booking.totalPrice)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center text-gray-600 dark:text-gray-300">
                          <CalendarClock className="h-3 w-3 mr-1" />
                          {formatDate(new Date(booking.date))}
                        </div>
                        
                        <div className="flex items-center text-gray-600 dark:text-gray-300">
                          <User className="h-3 w-3 mr-1" />
                          {driver?.name || "Unknown"}
                        </div>
                        
                        <div className="flex items-center text-gray-600 dark:text-gray-300">
                          <Car className="h-3 w-3 mr-1" />
                          {driver 
                            ? `${driver.vehicleMake} ${driver.vehicleModel} (${driver.vehicleYear})`
                            : "Unknown vehicle"
                          }
                        </div>
                      </div>
                      
                      {column.id !== statusColumns[statusColumns.length - 1].id && (
                        <div className="mt-2 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-2 text-primary"
                            onClick={() => moveToNextStatus(booking)}
                            disabled={updateStatusMutation.isPending}
                          >
                            <span>Move to {statusColumns.find(col => 
                              col.id === statusColumns[
                                statusColumns.findIndex(c => c.id === booking.status) + 1
                              ]?.id
                            )?.name}</span>
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
