import { useState } from "react";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Wrench, Package } from "lucide-react";
import ServiceGrid from "@/components/services/ServiceGrid";
import ProductGrid from "@/components/services/ProductGrid";

export default function Services() {
  // Use garage ID 1 for demo purposes - in a real app, this would come from the user's context
  const garageId = 1;
  
  // State for active tab
  const [activeTab, setActiveTab] = useState<"services" | "products">("services");

  return (
    <>
      <Helmet>
        <title>Services & Products - RilyGo G&AE</title>
        <meta name="description" content="Manage your services and products catalog with RilyGo G&AE - add, edit, and organize your offerings." />
      </Helmet>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <div>
                <CardTitle>Services & Products</CardTitle>
                <CardDescription>
                  Manage your service catalog and product inventory
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                {activeTab === "services" ? (
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Service
                  </Button>
                ) : (
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs 
              defaultValue="services" 
              className="space-y-4"
              onValueChange={(val) => setActiveTab(val as "services" | "products")}
            >
              <TabsList>
                <TabsTrigger value="services">
                  <Wrench className="h-4 w-4 mr-2" />
                  Services
                </TabsTrigger>
                <TabsTrigger value="products">
                  <Package className="h-4 w-4 mr-2" />
                  Products
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="services" className="space-y-4 pt-4">
                <ServiceGrid garageId={garageId} />
              </TabsContent>
              
              <TabsContent value="products" className="space-y-4 pt-4">
                <ProductGrid garageId={garageId} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
