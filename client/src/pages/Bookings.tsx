import { useState } from "react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarPlus, Filter, Download, Table, Columns, Plus } from "lucide-react";
import BookingsTable from "@/components/bookings/BookingsTable";
import BookingKanban from "@/components/bookings/BookingKanban";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

export default function Bookings() {
  // Use garage ID 1 for demo purposes - in a real app, this would come from the user's context
  const garageId = 1;
  
  // State for status filter
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("kanban");
  
  // Get current date for display
  const currentDate = new Date();
  const formattedDate = format(currentDate, "EEEE, d MMM");

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
        <title>Job Management - RilyGo G&AE</title>
        <meta name="description" content="Manage your service jobs with RilyGo G&AE - view, assign, and track service jobs in real-time." />
      </Helmet>

      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-semibold">{formattedDate}</h1>
          </div>
          <div className="flex space-x-2">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Job
            </Button>
            
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <Card className="bg-card border-0 shadow-sm">
          <CardContent className="p-0">
            <Tabs defaultValue="kanban" value={viewMode} className="w-full" onValueChange={(val) => setViewMode(val as "table" | "kanban")}>
              <div className="flex justify-between items-center border-b px-6 py-2">
                <TabsList className="bg-transparent">
                  <TabsTrigger value="kanban" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                    <Columns className="h-4 w-4 mr-2" />
                    Kanban Board
                  </TabsTrigger>
                  <TabsTrigger value="table" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                    <Table className="h-4 w-4 mr-2" />
                    Table View
                  </TabsTrigger>
                </TabsList>
                
                {viewMode === "table" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
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
                )}
              </div>
              
              <TabsContent value="table" className="mt-0">
                <BookingsTable garageId={garageId} statusFilter={statusFilter} />
              </TabsContent>
              
              <TabsContent value="kanban" className="mt-0 p-6">
                <BookingKanban garageId={garageId} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
