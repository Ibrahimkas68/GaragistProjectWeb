import { Helmet } from "react-helmet";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Garage } from "@shared/schema";
import { 
  Building, 
  User, 
  Bell, 
  Globe, 
  Shield, 
  CreditCard, 
  Map, 
  Phone, 
  Mail, 
  Save 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Use garage ID 1 for demo purposes - in a real app, this would come from the user's context
  const garageId = 1;
  
  // Get garage data
  const { data: garage, isLoading } = useQuery<Garage>({
    queryKey: [`/api/garages/${garageId}`],
  });

  // State for form inputs
  const [formData, setFormData] = useState<Partial<Garage>>({
    name: "",
    address: "",
    lat: "",
    lng: "",
    status: "Open",
    email: "",
    phone: "",
    avatar: "",
  });

  // Update form data when garage data is loaded
  useState(() => {
    if (garage) {
      setFormData(garage);
    }
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Mutation for updating garage settings
  const updateGarageMutation = useMutation({
    mutationFn: async (data: Partial<Garage>) => {
      const response = await fetch(`/api/garages/${garageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update garage settings');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/garages/${garageId}`] });
      toast({
        title: "Settings Saved",
        description: "Your garage settings have been updated successfully.",
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

  // Handle save settings
  const handleSaveSettings = () => {
    updateGarageMutation.mutate(formData);
  };

  return (
    <>
      <Helmet>
        <title>Settings - RilyGo G&AE</title>
        <meta name="description" content="Configure your garage settings in RilyGo G&AE - update profile, preferences, and account details." />
      </Helmet>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Manage your garage profile and preferences
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="profile" className="space-y-4">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:w-[600px]">
                <TabsTrigger value="profile">
                  <Building className="h-4 w-4 mr-2" />
                  Garage Profile
                </TabsTrigger>
                <TabsTrigger value="account">
                  <User className="h-4 w-4 mr-2" />
                  Account
                </TabsTrigger>
                <TabsTrigger value="notifications">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="security">
                  <Shield className="h-4 w-4 mr-2" />
                  Security
                </TabsTrigger>
              </TabsList>
              
              {/* Profile Settings */}
              <TabsContent value="profile" className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center py-10">
                    <p>Loading profile settings...</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-4 mb-6">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={garage?.avatar} />
                        <AvatarFallback>{garage?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-semibold">{garage?.name}</h3>
                        <p className="text-sm text-muted-foreground">{garage?.email}</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          Change Avatar
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Garage Name</Label>
                          <Input 
                            id="name" 
                            name="name" 
                            value={formData.name} 
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input 
                            id="email" 
                            name="email" 
                            type="email" 
                            value={formData.email} 
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input 
                            id="phone" 
                            name="phone" 
                            value={formData.phone} 
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="status">Status</Label>
                          <select 
                            id="status" 
                            name="status" 
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" 
                            value={formData.status} 
                            onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                          >
                            <option value="Open">Open</option>
                            <option value="Busy">Busy</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea 
                          id="address" 
                          name="address" 
                          rows={2} 
                          value={formData.address} 
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="lat">Latitude</Label>
                          <Input 
                            id="lat" 
                            name="lat" 
                            value={formData.lat} 
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lng">Longitude</Label>
                          <Input 
                            id="lng" 
                            name="lng" 
                            value={formData.lng} 
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
              
              {/* Account Settings */}
              <TabsContent value="account">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Account Information</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage your account details and subscription.
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">Subscription Plan</h4>
                        <p className="text-sm text-muted-foreground">
                          You are currently on the Professional plan.
                        </p>
                      </div>
                      <Button variant="outline">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Manage Subscription
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">Account Owner</h4>
                        <p className="text-sm text-muted-foreground">
                          John Smith (john@example.com)
                        </p>
                      </div>
                      <Button variant="outline">Transfer Ownership</Button>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-medium text-destructive">Danger Zone</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Permanently delete your account and all associated data.
                      </p>
                      <Button variant="destructive">Delete Account</Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Notifications Settings */}
              <TabsContent value="notifications">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Notification Preferences</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose how and when you want to be notified.
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">New Bookings</h4>
                        <p className="text-sm text-muted-foreground">
                          Get notified when a new booking is created.
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="new-bookings" defaultChecked />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Booking Status Changes</h4>
                        <p className="text-sm text-muted-foreground">
                          Get notified when a booking status changes.
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="booking-status" defaultChecked />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Reviews</h4>
                        <p className="text-sm text-muted-foreground">
                          Get notified when a customer leaves a review.
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="reviews" defaultChecked />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Marketing Updates</h4>
                        <p className="text-sm text-muted-foreground">
                          Receive updates about new features and promotions.
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="marketing" />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Security Settings */}
              <TabsContent value="security">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Security Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage your account security and privacy settings.
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">Change Password</h4>
                        <p className="text-sm text-muted-foreground">
                          Update your account password.
                        </p>
                      </div>
                      <Button variant="outline">Change Password</Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">Two-Factor Authentication</h4>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account.
                        </p>
                      </div>
                      <Button variant="outline">Enable 2FA</Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">API Access</h4>
                        <p className="text-sm text-muted-foreground">
                          Manage API tokens for third-party applications.
                        </p>
                      </div>
                      <Button variant="outline">Manage Tokens</Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Login Sessions</h4>
                        <p className="text-sm text-muted-foreground">
                          View and manage active login sessions.
                        </p>
                      </div>
                      <Button variant="outline">View Sessions</Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="border-t pt-6 flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Button 
              onClick={handleSaveSettings}
              disabled={updateGarageMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {updateGarageMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
