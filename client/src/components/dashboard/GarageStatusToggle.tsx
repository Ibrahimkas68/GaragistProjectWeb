import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Building2, 
  Clock, 
  Check, 
  AlertCircle,
  CalendarClock, 
  Edit 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Garage } from "@shared/schema";

interface GarageStatusToggleProps {
  garageId: number;
}

export default function GarageStatusToggle({ garageId }: GarageStatusToggleProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showHoursDialog, setShowHoursDialog] = useState(false);

  // Business hours - in a real app this would be fetched from API
  const businessHours = [
    { day: "Monday", open: "08:00", close: "18:00" },
    { day: "Tuesday", open: "08:00", close: "18:00" },
    { day: "Wednesday", open: "08:00", close: "18:00" },
    { day: "Thursday", open: "08:00", close: "18:00" },
    { day: "Friday", open: "08:00", close: "18:00" },
    { day: "Saturday", open: "09:00", close: "16:00" },
    { day: "Sunday", open: "Closed", close: "Closed" },
  ];

  // Fetch garage data
  const { data: garage, isLoading } = useQuery<Garage>({
    queryKey: [`/api/garages/${garageId}`],
  });

  // Mutation to update garage status
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await fetch(`/api/garages/${garageId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update garage status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/garages/${garageId}`] });
      toast({
        title: "Status Updated",
        description: "Garage status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate(status);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Open":
        return <Check className="h-4 w-4 text-green-500" />;
      case "Busy":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case "Closed":
        return <Clock className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "Busy":
        return "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400";
      case "Closed":
        return "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  // Get current day and determine if we're within business hours
  const currentDate = new Date();
  const currentDay = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
  const currentHour = currentDate.getHours();
  const currentHourStr = currentHour.toString().padStart(2, '0') + ":00";
  
  const todayHours = businessHours.find(h => h.day === currentDay);
  const isWithinBusinessHours = todayHours && 
    todayHours.open !== "Closed" && 
    currentHourStr >= todayHours.open && 
    currentHourStr < todayHours.close;

  return (
    <Card className={`${getStatusColor(garage?.status || "Closed")} border-0 shadow-sm`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            <h3 className="font-medium">Garage Status</h3>
          </div>
          <div className="flex items-center space-x-2">
            {!isLoading && (
              <Select 
                value={garage?.status} 
                onValueChange={handleStatusChange}
                disabled={updateStatusMutation.isPending}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Open
                    </div>
                  </SelectItem>
                  <SelectItem value="Busy">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
                      Busy
                    </div>
                  </SelectItem>
                  <SelectItem value="Closed">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-red-500 mr-2" />
                      Closed
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
            
            <Dialog open={showHoursDialog} onOpenChange={setShowHoursDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Hours
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Business Hours</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {businessHours.map((hours, index) => (
                    <div key={index} className="grid grid-cols-3 items-center gap-4">
                      <Label className="text-right">{hours.day}</Label>
                      <div className="col-span-2 flex items-center gap-2">
                        {hours.open === "Closed" ? (
                          <span className="text-gray-500">Closed</span>
                        ) : (
                          <>
                            <Select defaultValue={hours.open}>
                              <SelectTrigger className="w-[85px]">
                                <SelectValue placeholder="Opening" />
                              </SelectTrigger>
                              <SelectContent>
                                {["08:00", "09:00", "10:00", "Closed"].map(time => (
                                  <SelectItem key={time} value={time}>{time}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span>to</span>
                            <Select defaultValue={hours.close}>
                              <SelectTrigger className="w-[85px]">
                                <SelectValue placeholder="Closing" />
                              </SelectTrigger>
                              <SelectContent>
                                {["17:00", "18:00", "19:00", "20:00", "Closed"].map(time => (
                                  <SelectItem key={time} value={time}>{time}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowHoursDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => {
                    toast({
                      title: "Hours Updated",
                      description: "Business hours have been updated successfully.",
                    });
                    setShowHoursDialog(false);
                  }}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="mt-2 flex items-center text-sm">
          <CalendarClock className="h-4 w-4 mr-2" />
          <span>
            {isWithinBusinessHours ? (
              <>Currently within business hours</>
            ) : todayHours?.open === "Closed" ? (
              <>Closed today</>
            ) : (
              <>
                Today's hours: {todayHours?.open} - {todayHours?.close}
              </>
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}