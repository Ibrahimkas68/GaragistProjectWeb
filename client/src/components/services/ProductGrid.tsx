import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Product, insertProductSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus, Edit, PowerOff, Package } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatCurrency } from "@/lib/utils";
import { useWebSocket } from "@/hooks/use-websocket";

interface ProductGridProps {
  garageId: number;
}

export default function ProductGrid({ garageId }: ProductGridProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Load products
  const { data: products, isLoading, refetch } = useQuery<Product[]>({
    queryKey: [`/api/products?garageId=${garageId}`],
  });

  // Form validation schema (extended from insertProductSchema)
  const formSchema = insertProductSchema.extend({
    price: z.coerce.number().min(1, "Price must be at least 1"),
    stock: z.coerce.number().min(0, "Stock cannot be negative"),
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
      stock: 0,
      category: "Parts",
      imageUrl: "",
      isActive: true,
      garageId,
    },
  });

  // Mutations for creating and updating products
  const createProductMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create product');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products?garageId=${garageId}`] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Product created successfully",
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

  const updateProductMutation = useMutation({
    mutationFn: async (data: FormValues & { id: number }) => {
      const { id, ...productData } = data;
      const response = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update product');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products?garageId=${garageId}`] });
      setDialogOpen(false);
      setEditingProduct(null);
      form.reset();
      toast({
        title: "Success",
        description: "Product updated successfully",
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

  // Toggle product active status
  const toggleActiveMutation = useMutation({
    mutationFn: async (product: Product) => {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update product status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products?garageId=${garageId}`] });
      toast({
        title: "Success",
        description: "Product status updated",
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
  useWebSocket('product-updates', () => {
    refetch();
  });

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    if (editingProduct) {
      updateProductMutation.mutate({ ...data, id: editingProduct.id });
    } else {
      createProductMutation.mutate(data);
    }
  };

  // Handle open dialog for creating a new product
  const handleAddProduct = () => {
    form.reset({
      name: "",
      description: "",
      price: 0,
      stock: 0,
      category: "Parts",
      imageUrl: "",
      isActive: true,
      garageId,
    });
    setEditingProduct(null);
    setDialogOpen(true);
  };

  // Handle open dialog for editing a product
  const handleEditProduct = (product: Product) => {
    form.reset({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      imageUrl: product.imageUrl || "",
      isActive: product.isActive,
      garageId: product.garageId,
    });
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleToggleActive = (product: Product) => {
    toggleActiveMutation.mutate(product);
  };

  // Render product card
  const renderProductCard = (product: Product) => (
    <Card key={product.id} className="overflow-hidden flex flex-col">
      <div className="h-40 relative">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <Package className="h-12 w-12 text-gray-400 dark:text-gray-500" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge 
            variant="outline" 
            className={
              product.isActive 
                ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-400" 
                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400"
            }
          >
            {product.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            {product.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
            {product.description}
          </p>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {formatCurrency(product.price)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Stock: {product.stock}
            </span>
          </div>
        </div>
        <div className="mt-2 flex space-x-2">
          <Button
            variant="outline"
            className="flex-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
            onClick={() => handleEditProduct(product)}
          >
            <Edit className="mr-1 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            onClick={() => handleToggleActive(product)}
            disabled={toggleActiveMutation.isPending}
          >
            <PowerOff className="mr-1 h-4 w-4" />
            {product.isActive ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

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
        ) : products?.length === 0 ? (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No products found</p>
            <Button onClick={handleAddProduct}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Product
            </Button>
          </div>
        ) : (
          products?.map(renderProductCard)
        )}
      </div>

      {/* Product form dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct 
                ? "Update the product details below." 
                : "Fill in the product details below to create a new product."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="name">Product Name</Label>
                <Input 
                  id="name" 
                  placeholder="Engine Oil (5W-30)"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="High-quality synthetic engine oil for most vehicles."
                  {...form.register("description")}
                />
                {form.formState.errors.description && (
                  <p className="text-red-500 text-sm">{form.formState.errors.description.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    placeholder="24.99"
                    {...form.register("price")}
                  />
                  {form.formState.errors.price && (
                    <p className="text-red-500 text-sm">{form.formState.errors.price.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="stock">Stock</Label>
                  <Input 
                    id="stock" 
                    type="number" 
                    placeholder="50"
                    {...form.register("stock")}
                  />
                  {form.formState.errors.stock && (
                    <p className="text-red-500 text-sm">{form.formState.errors.stock.message}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="category">Category</Label>
                <Input 
                  id="category" 
                  placeholder="Oils, Filters, Parts, etc."
                  {...form.register("category")}
                />
                {form.formState.errors.category && (
                  <p className="text-red-500 text-sm">{form.formState.errors.category.message}</p>
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
                  <p className="text-red-500 text-sm">{form.formState.errors.imageUrl.message}</p>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
              >
                {createProductMutation.isPending || updateProductMutation.isPending 
                  ? "Saving..." 
                  : editingProduct ? "Update Product" : "Create Product"
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
