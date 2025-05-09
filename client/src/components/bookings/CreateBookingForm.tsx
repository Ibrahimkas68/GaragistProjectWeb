import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertBookingSchema, Driver, Service, Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Loader2, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CreateBookingFormProps {
  garageId: number;
  onSuccess: () => void;
}

// Form validation schema (extended from insertBookingSchema)
const formSchema = insertBookingSchema.omit({
  id: true,
  bookingNumber: true, // Generated on server
  garageId: true, // Will be provided by parent component
  totalPrice: true, // Calculated based on services 
  createdAt: true, // Set by server
}).extend({
  date: z.date(),
  driverId: z.number().positive("Please select a driver"),
  servicesSelected: z.array(z.object({
    id: z.number().positive(),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    name: z.string().optional(),
    price: z.number().optional(),
  })).min(1, "Please select at least one service"),
  productsSelected: z.array(z.object({
    id: z.number().positive(),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    name: z.string().optional(),
    price: z.number().optional(),
  })).optional(),
  serviceToAdd: z.string().optional(),
  productToAdd: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateBookingForm({ garageId, onSuccess }: CreateBookingFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Load drivers
  const { data: drivers, isLoading: isLoadingDrivers } = useQuery<Driver[]>({
    queryKey: ['/api/drivers'],
  });

  // Load services for the garage
  const { data: services, isLoading: isLoadingServices } = useQuery<Service[]>({
    queryKey: ['/api/services', garageId],
    queryFn: async () => {
      const response = await fetch(`/api/services?garageId=${garageId}`);
      if (!response.ok) {
        throw new Error('Failed to load services');
      }
      return response.json();
    }
  });

  // Load products for the garage
  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['/api/products', garageId],
    queryFn: async () => {
      const response = await fetch(`/api/products?garageId=${garageId}`);
      if (!response.ok) {
        throw new Error('Failed to load products');
      }
      return response.json();
    }
  });

  // Setup form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      driverId: 0,
      date: new Date(),
      status: "New",
      notes: "",
      servicesSelected: [],
      productsSelected: [],
      // Add these fields as they'll be used for selections
      serviceToAdd: "",
      productToAdd: "",
    },
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (formData: FormValues) => {
      // Transform form data to match API expectations
      const bookingData = {
        garageId,
        driverId: formData.driverId,
        date: formData.date,
        status: formData.status,
        notes: formData.notes,
        servicesBooked: formData.servicesSelected.map(s => ({
          id: s.id,
          quantity: s.quantity,
        })),
        productsBooked: formData.productsSelected?.map(p => ({
          id: p.id,
          quantity: p.quantity,
        })) || [],
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create booking');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/today'] });
      toast({
        title: 'Success',
        description: 'New job created successfully',
      });
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle service selection
  const addService = (serviceIdStr: string) => {
    const serviceId = parseInt(serviceIdStr);
    if (isNaN(serviceId)) return;
    
    const service = services?.find(s => s.id === serviceId);
    if (!service) return;

    const currentServices = form.getValues("servicesSelected") || [];
    const existingService = currentServices.find(s => s.id === service.id);
    
    if (existingService) {
      // Increment quantity if already selected
      const updatedServices = currentServices.map(s => 
        s.id === service.id 
          ? { ...s, quantity: s.quantity + 1 } 
          : s
      );
      form.setValue("servicesSelected", updatedServices);
    } else {
      // Add new service
      form.setValue("servicesSelected", [
        ...currentServices, 
        { 
          id: service.id, 
          quantity: 1,
          name: service.name,
          price: service.price
        }
      ]);
    }

    // Clear validation errors
    form.trigger("servicesSelected");
  };

  const removeService = (serviceId: number) => {
    const currentServices = form.getValues("servicesSelected") || [];
    form.setValue(
      "servicesSelected",
      currentServices.filter(s => s.id !== serviceId)
    );
    form.trigger("servicesSelected");
  };

  // Handle product selection
  const addProduct = (productIdStr: string) => {
    const productId = parseInt(productIdStr);
    if (isNaN(productId)) return;
    
    const product = products?.find(p => p.id === productId);
    if (!product) return;

    const currentProducts = form.getValues("productsSelected") || [];
    const existingProduct = currentProducts.find(p => p.id === product.id);
    
    if (existingProduct) {
      // Increment quantity if already selected
      const updatedProducts = currentProducts.map(p => 
        p.id === product.id 
          ? { ...p, quantity: p.quantity + 1 } 
          : p
      );
      form.setValue("productsSelected", updatedProducts);
    } else {
      // Add new product
      form.setValue("productsSelected", [
        ...currentProducts, 
        { 
          id: product.id, 
          quantity: 1,
          name: product.name,
          price: product.price
        }
      ]);
    }
  };

  const removeProduct = (productId: number) => {
    const currentProducts = form.getValues("productsSelected") || [];
    form.setValue(
      "productsSelected",
      currentProducts.filter(p => p.id !== productId)
    );
  };

  // Calculate total price
  const calculateTotal = () => {
    const selectedServices = form.getValues("servicesSelected") || [];
    const selectedProducts = form.getValues("productsSelected") || [];
    
    const servicesTotal = selectedServices.reduce((acc, curr) => {
      const service = services?.find(s => s.id === curr.id);
      return acc + (service?.price || 0) * curr.quantity;
    }, 0);
    
    const productsTotal = selectedProducts.reduce((acc, curr) => {
      const product = products?.find(p => p.id === curr.id);
      return acc + (product?.price || 0) * curr.quantity;
    }, 0);
    
    return servicesTotal + productsTotal;
  };

  // Format currency
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(cents / 100);
  };

  const onSubmit = (data: FormValues) => {
    createBookingMutation.mutate(data);
  };

  const isLoading = isLoadingDrivers || isLoadingServices || isLoadingProducts || createBookingMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="driver">Driver</Label>
          <Select
            disabled={isLoading}
            onValueChange={(value) => form.setValue("driverId", parseInt(value))}
            value={form.getValues("driverId")?.toString() || ""}
          >
            <SelectTrigger id="driver">
              <SelectValue placeholder="Select a driver" />
            </SelectTrigger>
            <SelectContent>
              {drivers?.map((driver) => (
                <SelectItem key={driver.id} value={driver.id.toString()}>
                  {driver.name} - {driver.vehicleMake} {driver.vehicleModel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.driverId && (
            <p className="text-red-500 text-sm mt-1">{form.formState.errors.driverId.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="date">Date & Time</Label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !form.getValues("date") && "text-muted-foreground"
                )}
                disabled={isLoading}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.getValues("date") ? (
                  format(form.getValues("date"), "PPP HH:mm")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={form.getValues("date")}
                onSelect={(date) => {
                  if (date) {
                    form.setValue("date", date);
                    setIsCalendarOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {form.formState.errors.date && (
            <p className="text-red-500 text-sm mt-1">{form.formState.errors.date.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select
          disabled={isLoading}
          onValueChange={(value) => form.setValue("status", value)}
          defaultValue="New"
        >
          <SelectTrigger id="status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Confirmed">Confirmed</SelectItem>
            <SelectItem value="InProgress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
            <SelectItem value="NoShow">No Show</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Services</Label>
        <div className="flex items-center space-x-2 mb-2">
          <Select 
            disabled={isLoading} 
            onValueChange={(value) => {
              form.setValue("serviceToAdd", value);
              addService(value);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Add a service" />
            </SelectTrigger>
            <SelectContent>
              {services?.map((service) => (
                <SelectItem key={service.id} value={service.id.toString()}>
                  {service.name} - {formatCurrency(service.price)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {(form.getValues("servicesSelected") || []).length > 0 ? (
          <div className="space-y-2">
            {(form.getValues("servicesSelected") || []).map((service) => {
              const serviceDetails = services?.find(s => s.id === service.id);
              const serviceName = serviceDetails?.name || "Service";
              const servicePrice = serviceDetails?.price || 0;
              return (
                <div key={service.id} className="flex items-center justify-between border p-2 rounded-md">
                  <div className="flex-1">
                    <div className="font-medium">{serviceName}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(servicePrice)} × {service.quantity}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      className="w-16"
                      min={1}
                      value={service.quantity}
                      onChange={(e) => {
                        const currentServices = form.getValues("servicesSelected") || [];
                        const updatedServices = currentServices.map(s => 
                          s.id === service.id 
                            ? { ...s, quantity: parseInt(e.target.value) || 1 } 
                            : s
                        );
                        form.setValue("servicesSelected", updatedServices);
                      }}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeService(service.id)}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 border rounded-md">
            <p className="text-muted-foreground">No services selected</p>
          </div>
        )}
        {form.formState.errors.servicesSelected && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.servicesSelected.message}</p>
        )}
      </div>

      <div>
        <Label>Products (Optional)</Label>
        <div className="flex items-center space-x-2 mb-2">
          <Select 
            disabled={isLoading} 
            onValueChange={(value) => {
              form.setValue("productToAdd", value);
              addProduct(value);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Add a product" />
            </SelectTrigger>
            <SelectContent>
              {products?.map((product) => (
                <SelectItem key={product.id} value={product.id.toString()}>
                  {product.name} - {formatCurrency(product.price)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {(form.getValues("productsSelected") || []).length > 0 ? (
          <div className="space-y-2">
            {(form.getValues("productsSelected") || []).map((product) => {
              const productDetails = products?.find(p => p.id === product.id);
              const productName = productDetails?.name || "Product";
              const productPrice = productDetails?.price || 0;
              return (
                <div key={product.id} className="flex items-center justify-between border p-2 rounded-md">
                  <div className="flex-1">
                    <div className="font-medium">{productName}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(productPrice)} × {product.quantity}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      className="w-16"
                      min={1}
                      value={product.quantity}
                      onChange={(e) => {
                        const currentProducts = form.getValues("productsSelected") || [];
                        const updatedProducts = currentProducts.map(p => 
                          p.id === product.id 
                            ? { ...p, quantity: parseInt(e.target.value) || 1 } 
                            : p
                        );
                        form.setValue("productsSelected", updatedProducts);
                      }}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeProduct(product.id)}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 border rounded-md">
            <p className="text-muted-foreground">No products selected</p>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Additional notes or instructions"
          className="resize-none"
          disabled={isLoading}
          {...form.register("notes")}
        />
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-lg font-semibold">
          Total: {formatCurrency(calculateTotal())}
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Job
        </Button>
      </div>
    </form>
  );
}