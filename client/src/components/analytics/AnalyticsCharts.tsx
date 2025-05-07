import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Sector,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { ChartLine, PieChart as PieChartIcon } from "lucide-react";

interface AnalyticsChartsProps {
  garageId: number;
}

// Chart range options
const CHART_RANGES = [
  { value: "7days", label: "Last 7 Days" },
  { value: "30days", label: "Last 30 Days" },
  { value: "90days", label: "Last 90 Days" },
];

// Colors for pie chart
const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

export default function AnalyticsCharts({ garageId }: AnalyticsChartsProps) {
  const [bookingsRange, setBookingsRange] = useState("30days");
  const [revenueRange, setRevenueRange] = useState("30days");
  const [activePieIndex, setActivePieIndex] = useState(0);

  // Helper function to get date range based on selection
  const getDateRange = (range: string) => {
    const end = new Date();
    const start = new Date();
    
    if (range === "7days") {
      start.setDate(end.getDate() - 7);
    } else if (range === "30days") {
      start.setDate(end.getDate() - 30);
    } else if (range === "90days") {
      start.setDate(end.getDate() - 90);
    }
    
    return { start, end };
  };

  // Get bookings data
  const { data: bookingsData, isLoading: isLoadingBookings } = useQuery({
    queryKey: [`/api/analytics/bookings`, garageId, bookingsRange],
    queryFn: async () => {
      const { start, end } = getDateRange(bookingsRange);
      const response = await fetch(
        `/api/analytics/bookings?garageId=${garageId}&startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch booking analytics");
      }
      
      return response.json();
    },
  });

  // Get revenue by service data
  const { data: revenueData, isLoading: isLoadingRevenue } = useQuery({
    queryKey: [`/api/analytics/revenue`, garageId, revenueRange],
    queryFn: async () => {
      const { start, end } = getDateRange(revenueRange);
      const response = await fetch(
        `/api/analytics/revenue?garageId=${garageId}&startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch revenue analytics");
      }
      
      return response.json();
    },
  });

  // Custom pie chart active shape
  const renderActiveShape = (props: any) => {
    const { 
      cx, cy, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, revenue
    } = props;
  
    return (
      <g>
        <text x={cx} y={cy} dy={-20} textAnchor="middle" fill="#888">
          {payload.service}
        </text>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill="#333" className="text-xl font-semibold">
          {formatCurrency(payload.revenue)}
        </text>
        <text x={cx} y={cy} dy={30} textAnchor="middle" fill="#999" className="text-xs">
          {`${(percent * 100).toFixed(2)}%`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 5}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bookings Over Time Chart */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-medium text-gray-900 dark:text-white">
              Bookings Over Time
            </h3>
            <Select 
              value={bookingsRange} 
              onValueChange={setBookingsRange}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                {CHART_RANGES.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="h-64">
            {isLoadingBookings ? (
              <div className="h-full w-full bg-gray-50 dark:bg-gray-900/50 rounded-lg flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">Loading chart data...</p>
              </div>
            ) : !bookingsData || bookingsData.length === 0 ? (
              <div className="h-full w-full bg-gray-50 dark:bg-gray-900/50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <ChartLine className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">No booking data available</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={bookingsData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => [`${value} bookings`, 'Count']}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#3b82f6" 
                    name="Bookings" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Revenue by Service Chart */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-medium text-gray-900 dark:text-white">
              Revenue by Service
            </h3>
            <Select 
              value={revenueRange} 
              onValueChange={setRevenueRange}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                {CHART_RANGES.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="h-64">
            {isLoadingRevenue ? (
              <div className="h-full w-full bg-gray-50 dark:bg-gray-900/50 rounded-lg flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">Loading chart data...</p>
              </div>
            ) : !revenueData || revenueData.length === 0 ? (
              <div className="h-full w-full bg-gray-50 dark:bg-gray-900/50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <PieChartIcon className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">No revenue data available</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    activeIndex={activePieIndex}
                    activeShape={renderActiveShape}
                    data={revenueData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                    nameKey="service"
                    onMouseEnter={(_, index) => setActivePieIndex(index)}
                  >
                    {revenueData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip 
                    formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
