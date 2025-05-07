import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, BarChart3, LineChart, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  TooltipProps
} from 'recharts';

interface EarningsChartProps {
  garageId: number;
}

interface DataPoint {
  date: string;
  revenue: number;
  bookings: number;
}

interface ServiceRevenue {
  name: string;
  revenue: number;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded shadow-sm">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.name === 'revenue' ? formatCurrency(entry.value as number) : entry.value}
          </p>
        ))}
      </div>
    );
  }

  return null;
};

export default function EarningsChart({ garageId }: EarningsChartProps) {
  const [timeRange, setTimeRange] = useState("30days");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  
  // Fetch time series data
  const { data: timeSeriesData, isLoading: isTimeSeriesLoading } = useQuery<DataPoint[]>({
    queryKey: [`/api/analytics/earnings?garageId=${garageId}&range=${timeRange}&service=${serviceFilter}`],
    // Placeholder data for demonstration
    placeholderData: [
      { date: "May 1", revenue: 2500, bookings: 5 },
      { date: "May 2", revenue: 3200, bookings: 7 },
      { date: "May 3", revenue: 2800, bookings: 6 },
      { date: "May 4", revenue: 4100, bookings: 8 },
      { date: "May 5", revenue: 3800, bookings: 7 },
      { date: "May 6", revenue: 2600, bookings: 5 },
      { date: "May 7", revenue: 3300, bookings: 6 },
    ]
  });
  
  // Fetch service data
  const { data: serviceData, isLoading: isServiceLoading } = useQuery<ServiceRevenue[]>({
    queryKey: [`/api/analytics/service-revenue?garageId=${garageId}&range=${timeRange}`],
    // Placeholder data for demonstration
    placeholderData: [
      { name: "Oil Change", revenue: 12500 },
      { name: "Brake Service", revenue: 18700 },
      { name: "Tire Rotation", revenue: 8200 },
      { name: "Engine Diagnostics", revenue: 15400 },
      { name: "A/C Service", revenue: 9800 },
    ]
  });
  
  // Calculate total revenue for the period
  const totalRevenue = timeSeriesData?.reduce((sum, item) => sum + item.revenue, 0) || 0;
  
  return (
    <Card className="col-span-full">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Earnings Analytics</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Total: {formatCurrency(totalRevenue)} for selected period
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Tabs 
              defaultValue="line" 
              value={chartType} 
              onValueChange={(val) => setChartType(val as "line" | "bar")}
              className="w-auto"
            >
              <TabsList className="grid grid-cols-2 w-[120px]">
                <TabsTrigger value="line">
                  <LineChart className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="bar">
                  <BarChart3 className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Select 
              value={timeRange} 
              onValueChange={setTimeRange}
            >
              <SelectTrigger className="w-[140px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={serviceFilter} 
              onValueChange={setServiceFilter}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Service Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {serviceData?.map((service, index) => (
                  <SelectItem key={index} value={service.name.toLowerCase().replace(/\s+/g, '-')}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-80 mt-4">
          {isTimeSeriesLoading ? (
            <div className="h-full w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-md"></div>
          ) : chartType === "line" ? (
            <ResponsiveContainer width="100%" height="100%">
              <ReLineChart
                data={timeSeriesData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" tickFormatter={(value) => `$${value}`} />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Revenue"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="bookings"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Bookings"
                />
              </ReLineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={serviceData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}