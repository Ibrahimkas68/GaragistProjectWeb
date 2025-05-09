import { useState } from "react";
import { useLocation } from "wouter";
import { Menu, Bell, Moon, Sun, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/hooks/use-theme";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(3);

  // Get page title based on current location
  const getPageTitle = () => {
    const path = location;
    if (path === "/") return "Dashboard";
    return path.substring(1).charAt(0).toUpperCase() + path.substring(2);
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="lg:hidden text-gray-500 dark:text-gray-400 mr-4"
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white hidden sm:block">
            {getPageTitle()}
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                aria-label="View notifications"
              >
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="px-4 py-3 font-medium border-b">
                Notifications ({notifications})
              </div>
              <div className="max-h-80 overflow-y-auto">
                <div className="p-4 border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <div className="flex justify-between mb-1">
                    <h5 className="font-medium text-sm">New Booking</h5>
                    <span className="text-xs text-gray-500">10 min ago</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Michael Brown has booked a service appointment</p>
                </div>
                <div className="p-4 border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <div className="flex justify-between mb-1">
                    <h5 className="font-medium text-sm">Low Inventory</h5>
                    <span className="text-xs text-gray-500">2 hours ago</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Engine Oil (5W-30) inventory is running low</p>
                </div>
                <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <div className="flex justify-between mb-1">
                    <h5 className="font-medium text-sm">Service Completed</h5>
                    <span className="text-xs text-gray-500">Yesterday</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Brake repair for Honda Civic has been completed</p>
                </div>
              </div>
              <div className="p-2 border-t text-center flex space-x-2">
                <Button variant="ghost" className="text-sm text-primary w-full">
                  View all
                </Button>
                <Button 
                  variant="ghost" 
                  className="text-sm text-primary w-full"
                  onClick={() => setNotifications(0)}
                >
                  Clear all
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center">
                <span className="mr-2 hidden sm:block">John Smith</span>
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100" />
                  <AvatarFallback>JS</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Your Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
