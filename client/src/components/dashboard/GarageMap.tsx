import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Lock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Garage } from "@shared/schema";
import { useWebSocket } from "@/hooks/use-websocket";

interface GarageMapProps {
  garageId: number;
}

export default function GarageMap({ garageId }: GarageMapProps) {
  const queryClient = useQueryClient();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  // Get garage data
  const { data: garage, isLoading } = useQuery<Garage>({
    queryKey: [`/api/garages/${garageId}`],
  });

  // Create mutation for updating garage status
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      await fetch(`/api/garages/${garageId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/garages/${garageId}`] });
    },
  });

  // Setup WebSocket for real-time status updates
  const { lastMessage } = useWebSocket('garage-updates');

  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data);
        if (data.type === 'status-change' && data.garage.id === garageId) {
          queryClient.invalidateQueries({ queryKey: [`/api/garages/${garageId}`] });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [lastMessage, garageId, queryClient]);

  // Load Google Maps API (simulate loading in this demo)
  useEffect(() => {
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Handle status button click
  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate(status);
  };

  return (
    <Card className="lg:col-span-2">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Garage Status</h2>
          <div className="flex space-x-2">
            <Button
              variant={garage?.status === 'Open' ? 'default' : 'outline'}
              size="sm"
              className={garage?.status === 'Open' 
                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-100 hover:text-primary-700' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}
              onClick={() => handleStatusChange('Open')}
              disabled={updateStatusMutation.isPending}
            >
              <MapPin className="mr-1 h-4 w-4" />
              Open
            </Button>
            <Button
              variant={garage?.status === 'Busy' ? 'default' : 'outline'}
              size="sm"
              className={garage?.status === 'Busy'
                ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 hover:text-amber-700'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}
              onClick={() => handleStatusChange('Busy')}
              disabled={updateStatusMutation.isPending}
            >
              <Clock className="mr-1 h-4 w-4" />
              Busy
            </Button>
            <Button
              variant={garage?.status === 'Closed' ? 'default' : 'outline'}
              size="sm"
              className={garage?.status === 'Closed'
                ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 hover:text-red-700'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}
              onClick={() => handleStatusChange('Closed')}
              disabled={updateStatusMutation.isPending}
            >
              <Lock className="mr-1 h-4 w-4" />
              Closed
            </Button>
          </div>
        </div>
        
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Loading map...</p>
            </div>
          ) : mapError ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">
                Error loading map. Please check your connection.
              </p>
            </div>
          ) : !mapLoaded ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Loading map...</p>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400 text-center">
                <MapPin className="h-10 w-10 text-primary mx-auto mb-2" />
                <span className="block">
                  {garage?.name} - {garage?.address}
                </span>
                <span className="text-sm block mt-2">
                  {garage?.status === 'Open' && (
                    <span className="text-green-600 dark:text-green-400">Currently Open</span>
                  )}
                  {garage?.status === 'Busy' && (
                    <span className="text-amber-600 dark:text-amber-400">Currently Busy</span>
                  )}
                  {garage?.status === 'Closed' && (
                    <span className="text-red-600 dark:text-red-400">Currently Closed</span>
                  )}
                </span>
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
