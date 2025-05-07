import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ProductGrid from "@/components/services/ProductGrid";

export default function Products() {
  // Use garage ID 1 for demo purposes - in a real app, this would come from the user's context
  const garageId = 1;

  return (
    <>
      <Helmet>
        <title>Products - RilyGo G&AE</title>
        <meta name="description" content="Manage your product inventory with RilyGo G&AE - add, edit, and track stock levels." />
      </Helmet>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Products Management</CardTitle>
            <CardDescription>
              View and manage your product inventory
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <ProductGrid garageId={garageId} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
