import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Home,
  CalendarCheck,
  Wrench,
  PackageOpen,
  Users,
  BarChart,
  Settings,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { type Garage } from "@shared/schema";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const { data: garage } = useQuery<Garage>({
    queryKey: ['/api/garages/1'], // In a real app, you'd get the logged-in user's garage ID
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sidebarLinks = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Bookings", href: "/bookings", icon: CalendarCheck },
    { name: "Services", href: "/services", icon: Wrench },
    { name: "Products", href: "/products", icon: PackageOpen },
    { name: "Drivers", href: "/drivers", icon: Users },
    { name: "Analytics", href: "/analytics", icon: BarChart },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 w-64 transition duration-300 transform bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="flex items-center">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-white font-bold">
                R
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">
                RilyGo G&AE
              </span>
            </Link>
            {isMobile && (
              <button
                onClick={onClose}
                className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <span className="sr-only">Close sidebar</span>
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="space-y-1">
            {sidebarLinks.map((link) => {
              const isActive = location === link.href;
              const Icon = link.icon;
              
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  onClick={isMobile ? onClose : undefined}
                >
                  <a
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                      isActive
                        ? "bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-100"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {link.name}
                  </a>
                </Link>
              );
            })}
          </div>
        </div>
        
        <div className="absolute bottom-0 w-full border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <Avatar>
              <AvatarImage src={garage?.avatar} alt="Garage avatar" />
              <AvatarFallback>JG</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {garage?.name || 'Loading...'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {garage?.email || 'Loading...'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
