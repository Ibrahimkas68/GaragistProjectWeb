import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { 
  insertBookingSchema, 
  insertDriverSchema, 
  insertGarageSchema, 
  insertProductSchema, 
  insertServiceSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Handle WebSocket connections
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Handle different message types
        if (data.type === 'subscribe') {
          // Store subscription info in WebSocket instance
          (ws as any).subscriptions = data.channels || [];
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  // Helper function to broadcast to subscribed clients
  const broadcast = (channel: string, data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && 
          (client as any).subscriptions?.includes(channel)) {
        client.send(JSON.stringify({
          channel,
          data,
          timestamp: new Date().toISOString()
        }));
      }
    });
  };

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Garage Routes
  app.get('/api/garages', async (_req, res) => {
    try {
      const garages = await storage.getAllGarages();
      res.json(garages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get garages' });
    }
  });

  app.get('/api/garages/:id', async (req, res) => {
    try {
      const garage = await storage.getGarage(Number(req.params.id));
      if (!garage) {
        return res.status(404).json({ error: 'Garage not found' });
      }
      res.json(garage);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get garage' });
    }
  });

  app.post('/api/garages', async (req, res) => {
    try {
      const garageData = insertGarageSchema.parse(req.body);
      const garage = await storage.createGarage(garageData);
      res.status(201).json(garage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: 'Failed to create garage' });
    }
  });

  app.patch('/api/garages/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      if (!['Open', 'Busy', 'Closed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      
      const garage = await storage.updateGarageStatus(Number(req.params.id), status);
      if (!garage) {
        return res.status(404).json({ error: 'Garage not found' });
      }
      
      // Broadcast status change
      broadcast('garage-updates', { type: 'status-change', garage });
      
      res.json(garage);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update garage status' });
    }
  });

  // Service Routes
  app.get('/api/services', async (req, res) => {
    try {
      const garageId = Number(req.query.garageId);
      if (isNaN(garageId)) {
        return res.status(400).json({ error: 'Invalid garage ID' });
      }
      
      const services = await storage.getServicesByGarage(garageId);
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get services' });
    }
  });

  app.post('/api/services', async (req, res) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      
      // Broadcast new service
      broadcast('service-updates', { type: 'service-created', service });
      
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: 'Failed to create service' });
    }
  });

  app.patch('/api/services/:id', async (req, res) => {
    try {
      const service = await storage.updateService(Number(req.params.id), req.body);
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }
      
      // Broadcast service update
      broadcast('service-updates', { type: 'service-updated', service });
      
      res.json(service);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update service' });
    }
  });

  // Product Routes
  app.get('/api/products', async (req, res) => {
    try {
      const garageId = Number(req.query.garageId);
      if (isNaN(garageId)) {
        return res.status(400).json({ error: 'Invalid garage ID' });
      }
      
      const products = await storage.getProductsByGarage(garageId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get products' });
    }
  });

  app.post('/api/products', async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      
      // Broadcast new product
      broadcast('product-updates', { type: 'product-created', product });
      
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  app.patch('/api/products/:id', async (req, res) => {
    try {
      const product = await storage.updateProduct(Number(req.params.id), req.body);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      // Broadcast product update
      broadcast('product-updates', { type: 'product-updated', product });
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  // Driver Routes
  app.get('/api/drivers', async (_req, res) => {
    try {
      const drivers = await storage.getAllDrivers();
      res.json(drivers);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get drivers' });
    }
  });

  app.post('/api/drivers', async (req, res) => {
    try {
      const driverData = insertDriverSchema.parse(req.body);
      const driver = await storage.createDriver(driverData);
      res.status(201).json(driver);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: 'Failed to create driver' });
    }
  });

  app.patch('/api/drivers/:id', async (req, res) => {
    try {
      const driver = await storage.updateDriver(Number(req.params.id), req.body);
      if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
      }
      res.json(driver);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update driver' });
    }
  });

  // Booking Routes
  app.get('/api/bookings', async (req, res) => {
    try {
      const garageId = Number(req.query.garageId);
      if (isNaN(garageId)) {
        return res.status(400).json({ error: 'Invalid garage ID' });
      }
      
      const bookings = await storage.getBookingsByGarage(garageId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get bookings' });
    }
  });

  app.get('/api/bookings/today', async (req, res) => {
    try {
      const garageId = Number(req.query.garageId);
      if (isNaN(garageId)) {
        return res.status(400).json({ error: 'Invalid garage ID' });
      }
      
      const bookings = await storage.getTodaysBookings(garageId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get today\'s bookings' });
    }
  });

  app.post('/api/bookings', async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(bookingData);
      
      // Broadcast new booking
      broadcast('booking-updates', { type: 'booking-created', booking });
      
      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: 'Failed to create booking' });
    }
  });

  app.patch('/api/bookings/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      if (!['New', 'Confirmed', 'InProgress', 'Completed', 'Cancelled', 'NoShow'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      
      const booking = await storage.updateBookingStatus(Number(req.params.id), status);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      
      // Broadcast booking status change
      broadcast('booking-updates', { type: 'booking-status-changed', booking });
      
      res.json(booking);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update booking status' });
    }
  });

  // Analytics Routes
  app.get('/api/analytics/bookings', async (req, res) => {
    try {
      const garageId = Number(req.query.garageId);
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);
      
      if (isNaN(garageId) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ error: 'Invalid parameters' });
      }
      
      const data = await storage.getBookingCountByDate(garageId, startDate, endDate);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get booking analytics' });
    }
  });

  app.get('/api/analytics/revenue', async (req, res) => {
    try {
      const garageId = Number(req.query.garageId);
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);
      
      if (isNaN(garageId) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ error: 'Invalid parameters' });
      }
      
      const data = await storage.getRevenueByService(garageId, startDate, endDate);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get revenue analytics' });
    }
  });

  app.get('/api/analytics/today-summary', async (req, res) => {
    try {
      const garageId = Number(req.query.garageId || 1);
      if (isNaN(garageId)) {
        return res.status(400).json({ error: 'Invalid garage ID' });
      }
      
      const summary = await storage.getTodaysSummary(garageId);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get today\'s summary' });
    }
  });
  
  // Additional analytics endpoints
  app.get('/api/analytics/hero-metrics', async (req, res) => {
    try {
      const garageId = Number(req.query.garageId || 1);
      
      // For demo, returning synthetic metrics
      res.json({
        totalBookings: 152,
        monthlyRevenue: 26420,
        averageRating: 4.7,
        completionRate: 94
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get hero metrics' });
    }
  });
  
  app.get('/api/analytics/service-revenue', async (req, res) => {
    try {
      const garageId = Number(req.query.garageId || 1);
      
      // Demo data for service revenue chart
      res.json([
        { name: 'Oil Change', value: 5200 },
        { name: 'Brake Service', value: 8300 },
        { name: 'Tire Rotation', value: 3100 },
        { name: 'Engine Tune-up', value: 6700 },
        { name: 'Air Conditioning', value: 3120 }
      ]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get service revenue data' });
    }
  });
  
  app.get('/api/analytics/earnings', async (req, res) => {
    try {
      const garageId = Number(req.query.garageId || 1);
      
      // Demo data for monthly earnings chart
      res.json([
        { name: 'Jan', value: 18200 },
        { name: 'Feb', value: 21300 },
        { name: 'Mar', value: 24100 },
        { name: 'Apr', value: 22700 },
        { name: 'May', value: 26420 }
      ]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get earnings data' });
    }
  });

  return httpServer;
}
