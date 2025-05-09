import { useState, forwardRef, useImperativeHandle } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Service, insertServiceSchema } from "@shared/schema";
import ServiceCard from "./ServiceCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useWebSocket } from "@/hooks/use-websocket";

interface ServiceGridProps {
  garageId: number;
}

// Interface for the forwarded ref
export interface ServiceGridHandles {
  handleAddService: () => void;
}

const ServiceGrid = forwardRef<ServiceGridHandles, ServiceGridProps>(({ garageId }, ref) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Load services
  const { data: services, isLoading, refetch } = useQuery<Service[]>({
    queryKey: [`/api/services?garageId=${garageId}`],
  });

  // Form validation schema (extended from insertServiceSchema)
  const formSchema = insertServiceSchema.extend({
    price: z.coerce.number().min(1, "Price must be at least 1"),
    duration: z.coerce.number().min(1, "Duration must be at least 1 minute"),
    garageId: z.number(),
  });

  type FormValues = z.infer<typeof formSchema>;

  // Setup form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      duration: 30,
      category: "Maintenance",
      imageUrl: "",
      isActive: true,
      garageId,
    },
  });

  // Mutations for creating and updating services
  const createServiceMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create service');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/services?garageId=${garageId}`] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Service created successfully",
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

  const updateServiceMutation = useMutation({
    mutationFn: async (data: FormValues & { id: number }) => {
      const { id, ...serviceData } = data;
      const response = await fetch(`/api/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update service');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/services?garageId=${garageId}`] });
      setDialogOpen(false);
      setEditingService(null);
      form.reset();
      toast({
        title: "Success",
        description: "Service updated successfully",
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

  // Setup WebSocket for real-time updates
  useWebSocket('service-updates', () => {
    refetch();
  });

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    if (editingService) {
      updateServiceMutation.mutate({ ...data, id: editingService.id });
    } else {
      createServiceMutation.mutate(data);
    }
  };

  // Handle open dialog for creating a new service
  const handleAddService = () => {
    form.reset({
      name: "",
      description: "",
      price: 0,
      duration: 30,
      category: "Maintenance",
      imageUrl: "",
      isActive: true,
      garageId,
    });
    setEditingService(null);
    setDialogOpen(true);
  };

  // Expose method to parent via ref
  useImperativeHandle(ref, () => ({
    handleAddService,
  }));

  // Handle open dialog for editing a service
  const handleEditService = (service: Service) => {
    form.reset({
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      category: service.category,
      imageUrl: service.imageUrl || "",
      isActive: service.isActive,
      garageId: service.garageId,
    });
    setEditingService(service);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          // Loading placeholders
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg h-80 animate-pulse">
              <div className="h-40 bg-gray-200 dark:bg-gray-700"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-8 mt-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))
        ) : services?.length === 0 ? (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No services found</p>
            <Button onClick={handleAddService}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Service
            </Button>
          </div>
        ) : (
          services?.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={handleEditService}
            />
          ))
        )}
      </div>

      {/* Service form dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Edit Service" : "Add New Service"}
            </DialogTitle>
            <DialogDescription>
              {editingService 
                ? "Update the service details below." 
                : "Fill in the service details below to create a new service."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="name">Service Name</Label>
                <Input 
                  id="name" 
                  placeholder="Oil Change"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-red-500 text-sm">{form.formState.errors.name.message as string}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Standard oil change with filter replacement..."
                  {...form.register("description")}
                />
                {form.formState.errors.description && (
                  <p className="text-red-500 text-sm">{form.formState.errors.description.message as string}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    placeholder="49.99"
                    {...form.register("price")}
                  />
                  {form.formState.errors.price && (
                    <p className="text-red-500 text-sm">{form.formState.errors.price.message as string}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input 
                    id="duration" 
                    type="number" 
                    placeholder="45"
                    {...form.register("duration")}
                  />
                  {form.formState.errors.duration && (
                    <p className="text-red-500 text-sm">{form.formState.errors.duration.message as string}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="category">Category</Label>
                <Input 
                  id="category" 
                  placeholder="Maintenance, Repairs, etc."
                  {...form.register("category")}
                />
                {form.formState.errors.category && (
                  <p className="text-red-500 text-sm">{form.formState.errors.category.message as string}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input 
                  id="imageUrl" 
                  placeholder="https://example.com/image.jpg"
                  {...form.register("imageUrl")}
                />
                {form.formState.errors.imageUrl && (
                  <p className="text-red-500 text-sm">{form.formState.errors.imageUrl.message as string}</p>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
              >
                {createServiceMutation.isPending || updateServiceMutation.isPending 
                  ? "Saving..." 
                  : editingService ? "Update Service" : "Create Service"
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default ServiceGrid;