import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, PowerOff, Clock } from "lucide-react";
import { Service } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ServiceCardProps {
  service: Service;
  onEdit: (service: Service) => void;
}

export default function ServiceCard({ service, onEdit }: ServiceCardProps) {
  const queryClient = useQueryClient();
  const [isHovered, setIsHovered] = useState(false);

  // Mutation for toggling service active status
  const toggleActiveMutation = useMutation({
    mutationFn: async () => {
      await fetch(`/api/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !service.isActive }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/services?garageId=${service.garageId}`] });
    },
  });

  const handleToggleActive = () => {
    toggleActiveMutation.mutate();
  };

  return (
    <Card 
      className="overflow-hidden flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="h-40 relative">
        {service.imageUrl ? (
          <img 
            src={service.imageUrl} 
            alt={service.name} 
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-gray-400 dark:text-gray-500">No image</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge 
            variant="outline" 
            className={
              service.isActive 
                ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-400" 
                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400"
            }
          >
            {service.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            {service.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
            {service.description}
          </p>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {formatCurrency(service.price)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <Clock className="h-3 w-3 mr-1" /> {service.duration} min
            </span>
          </div>
        </div>
        <div className="mt-2 flex space-x-2">
          <Button
            variant="outline"
            className="flex-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
            onClick={() => onEdit(service)}
          >
            <Edit className="mr-1 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            onClick={handleToggleActive}
            disabled={toggleActiveMutation.isPending}
          >
            <PowerOff className="mr-1 h-4 w-4" />
            {service.isActive ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
