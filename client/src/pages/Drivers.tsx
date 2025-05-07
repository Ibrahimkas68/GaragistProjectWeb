import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  MoreHorizontal, 
  Plus, 
  Search,
  Edit,
  Trash,
  UserPlus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Driver, insertDriverSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Drivers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<{ field: keyof Driver; direction: "asc" | "desc" }>({
    field: "name",
    direction: "asc",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // Load drivers
  const { data: drivers, isLoading } = useQuery<Driver[]>({
    queryKey: ['/api/drivers'],
  });

  // Form validation schema (extended from insertDriverSchema)
  const formSchema = insertDriverSchema.extend({
    avatar: z.string().optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  // Setup form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      vehicleMake: "",
      vehicleModel: "",
      vehicleYear: "",
      avatar: "",
    },
  });

  // Mutations for creating and updating drivers
  const createDriverMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create driver');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drivers'] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Driver created successfully",
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

  const updateDriverMutation = useMutation({
    mutationFn: async (data: FormValues & { id: number }) => {
      const { id, ...driverData } = data;
      const response = await fetch(`/api/drivers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(driverData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update driver');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drivers'] });
      setDialogOpen(false);
      setEditingDriver(null);
      form.reset();
      toast({
        title: "Success",
        description: "Driver updated successfully",
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

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    if (editingDriver) {
      updateDriverMutation.mutate({ ...data, id: editingDriver.id });
    } else {
      createDriverMutation.mutate(data);
    }
  };

  // Handle sorting
  const handleSort = (field: keyof Driver) => {
    setSortBy((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Sort and filter drivers
  const sortedAndFilteredDrivers = drivers
    ? [...drivers]
        .filter((driver) =>
          driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          driver.phone.includes(searchQuery) ||
          `${driver.vehicleMake} ${driver.vehicleModel}`.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
          const fieldA = a[sortBy.field];
          const fieldB = b[sortBy.field];
          
          if (fieldA < fieldB) return sortBy.direction === "asc" ? -1 : 1;
          if (fieldA > fieldB) return sortBy.direction === "asc" ? 1 : -1;
          return 0;
        })
    : [];

  // Handle open dialog for creating a new driver
  const handleAddDriver = () => {
    form.reset({
      name: "",
      email: "",
      phone: "",
      vehicleMake: "",
      vehicleModel: "",
      vehicleYear: "",
      avatar: "",
    });
    setEditingDriver(null);
    setDialogOpen(true);
  };

  // Handle open dialog for editing a driver
  const handleEditDriver = (driver: Driver) => {
    form.reset({
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      vehicleMake: driver.vehicleMake,
      vehicleModel: driver.vehicleModel,
      vehicleYear: driver.vehicleYear,
      avatar: driver.avatar || "",
    });
    setEditingDriver(driver);
    setDialogOpen(true);
  };

  // Get driver initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <>
      <Helmet>
        <title>Drivers Management - RilyGo G&AE</title>
        <meta name="description" content="Manage your customer drivers with RilyGo G&AE - view, add, and edit driver information and vehicle details." />
      </Helmet>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <div>
                <CardTitle>Drivers Management</CardTitle>
                <CardDescription>
                  Manage your customer drivers and their vehicles
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleAddDriver}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Driver
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search drivers..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" className="ml-2">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">ID</TableHead>
                    <TableHead className="min-w-[150px]">
                      <button
                        className="flex items-center"
                        onClick={() => handleSort("name")}
                      >
                        Driver
                        {sortBy.field === "name" && (
                          sortBy.direction === "asc" ? 
                            <ChevronUp className="ml-1 h-4 w-4" /> : 
                            <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="min-w-[150px]">Contact</TableHead>
                    <TableHead className="min-w-[200px]">Vehicle</TableHead>
                    <TableHead className="min-w-[120px]">
                      <button
                        className="flex items-center"
                        onClick={() => handleSort("lastActive")}
                      >
                        Last Active
                        {sortBy.field === "lastActive" && (
                          sortBy.direction === "asc" ? 
                            <ChevronUp className="ml-1 h-4 w-4" /> : 
                            <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        Loading drivers...
                      </TableCell>
                    </TableRow>
                  ) : sortedAndFilteredDrivers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        {searchQuery 
                          ? "No drivers found matching your search." 
                          : "No drivers found. Add your first driver."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedAndFilteredDrivers.map((driver) => (
                      <TableRow key={driver.id}>
                        <TableCell>{driver.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar>
                              <AvatarImage src={driver.avatar || undefined} alt={driver.name} />
                              <AvatarFallback>{getInitials(driver.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{driver.name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{driver.email}</div>
                          <div className="text-xs text-muted-foreground">{driver.phone}</div>
                        </TableCell>
                        <TableCell>
                          {`${driver.vehicleMake} ${driver.vehicleModel} (${driver.vehicleYear})`}
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(driver.lastActive), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditDriver(driver)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Driver form dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>
                {editingDriver ? "Edit Driver" : "Add New Driver"}
              </DialogTitle>
              <DialogDescription>
                {editingDriver
                  ? "Update the driver details below."
                  : "Fill in the driver details below to create a new driver."}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="name">Driver Name</Label>
                  <Input
                    id="name"
                    placeholder="John Smith"
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      placeholder="john@example.com"
                      {...form.register("email")}
                    />
                    {form.formState.errors.email && (
                      <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="555-123-4567"
                      {...form.register("phone")}
                    />
                    {form.formState.errors.phone && (
                      <p className="text-red-500 text-sm">{form.formState.errors.phone.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="vehicleMake">Vehicle Make</Label>
                    <Input
                      id="vehicleMake"
                      placeholder="Honda"
                      {...form.register("vehicleMake")}
                    />
                    {form.formState.errors.vehicleMake && (
                      <p className="text-red-500 text-sm">{form.formState.errors.vehicleMake.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="vehicleModel">Vehicle Model</Label>
                    <Input
                      id="vehicleModel"
                      placeholder="Civic"
                      {...form.register("vehicleModel")}
                    />
                    {form.formState.errors.vehicleModel && (
                      <p className="text-red-500 text-sm">{form.formState.errors.vehicleModel.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="vehicleYear">Year</Label>
                    <Input
                      id="vehicleYear"
                      placeholder="2020"
                      {...form.register("vehicleYear")}
                    />
                    {form.formState.errors.vehicleYear && (
                      <p className="text-red-500 text-sm">{form.formState.errors.vehicleYear.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="avatar">Avatar URL (optional)</Label>
                  <Input
                    id="avatar"
                    placeholder="https://example.com/avatar.jpg"
                    {...form.register("avatar")}
                  />
                  {form.formState.errors.avatar && (
                    <p className="text-red-500 text-sm">{form.formState.errors.avatar.message}</p>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createDriverMutation.isPending || updateDriverMutation.isPending}
                >
                  {createDriverMutation.isPending || updateDriverMutation.isPending
                    ? "Saving..."
                    : editingDriver ? "Update Driver" : "Create Driver"
                  }
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
