import { useState } from "react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarPlus, Filter, Download, Table, Columns } from "lucide-react";
import BookingsTable from "@/components/bookings/BookingsTable";
import BookingKanban from "@/components/bookings/BookingKanban";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function Bookings() {
  // Use garage ID 1 for demo purposes - in a real app, this would come from the user's context
  const garageId = 1;
  
  // State for status filter
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  // Toggle status in filter
  const toggleStatus = (status: string) => {
    if (statusFilter.includes(status)) {
      setStatusFilter(statusFilter.filter(s => s !== status));
    } else {
      setStatusFilter([...statusFilter, status]);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter([]);
  };

  return (
    <>
      <Helmet>
        <title>Booking Management - RilyGo G&AE</title>
        <meta name="description" content="Manage your bookings with RilyGo G&AE - view, filter, and update booking statuses." />
      </Helmet>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <div>
                <CardTitle>Booking Management</CardTitle>
                <CardDescription>
                  Manage bookings and service appointments
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button>
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  New Booking
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuCheckboxItem 
                      checked={statusFilter.includes("New")} 
                      onCheckedChange={() => toggleStatus("New")}
                    >
                      New
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem 
                      checked={statusFilter.includes("Confirmed")} 
                      onCheckedChange={() => toggleStatus("Confirmed")}
                    >
                      Confirmed
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem 
                      checked={statusFilter.includes("InProgress")} 
                      onCheckedChange={() => toggleStatus("InProgress")}
                    >
                      In Progress
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem 
                      checked={statusFilter.includes("Completed")} 
                      onCheckedChange={() => toggleStatus("Completed")}
                    >
                      Completed
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem 
                      checked={statusFilter.includes("Cancelled")} 
                      onCheckedChange={() => toggleStatus("Cancelled")}
                    >
                      Cancelled
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem 
                      checked={statusFilter.includes("NoShow")} 
                      onCheckedChange={() => toggleStatus("NoShow")}
                    >
                      No Show
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start text-sm"
                        onClick={clearFilters}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="table" className="space-y-4" onValueChange={(val) => setViewMode(val as "table" | "kanban")}>
              <TabsList>
                <TabsTrigger value="table">
                  <Table className="h-4 w-4 mr-2" />
                  Table View
                </TabsTrigger>
                <TabsTrigger value="kanban">
                  <Columns className="h-4 w-4 mr-2" />
                  Kanban Board
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="table" className="space-y-4">
                <BookingsTable garageId={garageId} statusFilter={statusFilter} />
              </TabsContent>
              
              <TabsContent value="kanban">
                <BookingKanban garageId={garageId} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
