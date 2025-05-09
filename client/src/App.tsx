import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import Layout from "@/components/layout/Layout";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Bookings from "@/pages/Bookings";
import Services from "@/pages/Services";
import Products from "@/pages/Products";
import Drivers from "@/pages/Drivers";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import { Helmet } from "react-helmet";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/bookings" component={Bookings} />
      <Route path="/services" component={Services} />
      <Route path="/products" component={Products} />
      <Route path="/drivers" component={Drivers} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <Helmet>
        <title>RilyGo G & AE - Auto Service Platform</title>
        <meta name="description" content="Manage your auto service operations efficiently with RilyGo's comprehensive platform" />
      </Helmet>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Layout>
              <Router />
            </Layout>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
