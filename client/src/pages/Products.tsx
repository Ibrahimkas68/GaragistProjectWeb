import { useRef } from "react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ProductGrid, { ProductGridHandles } from "@/components/services/ProductGrid";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Products() {
  // Use garage ID 1 for demo purposes - in a real app, this would come from the user's context
  const garageId = 1;
  const productGridRef = useRef<ProductGridHandles>(null);

  const handleAddProduct = () => {
    productGridRef.current?.handleAddProduct();
  };

  return (
    <>
      <Helmet>
        <title>Products - RilyGo G&AE</title>
        <meta name="description" content="Manage your product inventory with RilyGo G&AE - add, edit, and track stock levels." />
      </Helmet>

      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Products</h1>
          <Button onClick={handleAddProduct}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Products Management</CardTitle>
            <CardDescription>
              View and manage your product inventory
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <ProductGrid ref={productGridRef} garageId={garageId} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
