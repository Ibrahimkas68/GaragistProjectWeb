import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Booking, Driver } from "@shared/schema";
import { Eye, Edit, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { useWebSocket } from "@/hooks/use-websocket";

interface BookingsTableProps {
  garageId: number;
  statusFilter?: string[];
}

export default function BookingsTable({ garageId, statusFilter }: BookingsTableProps) {
  const [selectedBookings, setSelectedBookings] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Load bookings
  const { data: bookings, isLoading, refetch } = useQuery<Booking[]>({
    queryKey: [`/api/bookings?garageId=${garageId}`],
  });

  // Load drivers for customer info
  const { data: drivers } = useQuery<Driver[]>({
    queryKey: ['/api/drivers'],
  });

  // Setup WebSocket for real-time updates
  useWebSocket('booking-updates', () => {
    refetch();
  });

  // Filter bookings by status if needed
  const filteredBookings = bookings && statusFilter?.length
    ? bookings.filter(booking => statusFilter.includes(booking.status))
    : bookings;

  // Pagination
  const totalPages = filteredBookings 
    ? Math.ceil(filteredBookings.length / pageSize) 
    : 0;
  
  const paginatedBookings = filteredBookings
    ? filteredBookings.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : [];

  // Find driver by ID
  const getDriverById = (driverId: number) => {
    return drivers?.find(driver => driver.id === driverId);
  };

  // Toggle select all bookings
  const toggleSelectAll = () => {
    if (selectedBookings.length === paginatedBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(paginatedBookings.map(booking => booking.id));
    }
  };

  // Toggle select a booking
  const toggleSelect = (id: number) => {
    if (selectedBookings.includes(id)) {
      setSelectedBookings(selectedBookings.filter(bookingId => bookingId !== id));
    } else {
      setSelectedBookings([...selectedBookings, id]);
    }
  };

  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New':
        return <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">New</Badge>;
      case 'Confirmed':
        return <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">Confirmed</Badge>;
      case 'InProgress':
        return <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">In Progress</Badge>;
      case 'Completed':
        return <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400">Completed</Badge>;
      case 'Cancelled':
        return <Badge variant="outline" className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">Cancelled</Badge>;
      case 'NoShow':
        return <Badge variant="outline" className="bg-gray-100 dark:bg-gray-700/30 text-gray-800 dark:text-gray-400">No Show</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <div className="flex items-center">
                  <Checkbox 
                    id="select-all" 
                    checked={selectedBookings.length === paginatedBookings.length && paginatedBookings.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </div>
              </TableHead>
              <TableHead>Booking</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  Loading bookings...
                </TableCell>
              </TableRow>
            ) : paginatedBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  No bookings found
                </TableCell>
              </TableRow>
            ) : (
              paginatedBookings.map((booking) => {
                const driver = getDriverById(booking.driverId);
                
                return (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedBookings.includes(booking.id)} 
                        onCheckedChange={() => toggleSelect(booking.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {booking.bookingNumber}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {driver?.name || "Unknown"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {driver ? `${driver.vehicleMake} ${driver.vehicleModel} (${driver.vehicleYear})` : "Unknown vehicle"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {/* In a real app, we'd parse servicesBooked and show actual service names */}
                      <div className="text-sm">Service Details</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Multiple services
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(booking.status)}
                    </TableCell>
                    <TableCell>
                      {formatDate(new Date(booking.date))}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>
            {' '}-{' '}
            <span className="font-medium">
              {Math.min(currentPage * pageSize, filteredBookings?.length || 0)}
            </span>
            {' '}of{' '}
            <span className="font-medium">{filteredBookings?.length || 0}</span> bookings
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
              // Simple pagination logic for demo
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className={pageNum === currentPage 
                    ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                    : ""
                  }
                >
                  {pageNum}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
