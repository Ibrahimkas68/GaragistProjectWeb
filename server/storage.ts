import { 
  drivers, type Driver, type InsertDriver,
  garages, type Garage, type InsertGarage,
  services, type Service, type InsertService,
  products, type Product, type InsertProduct,
  bookings, type Booking, type InsertBooking, type BookingWithDetails,
  users, type User, type InsertUser
} from "@shared/schema";
import { customAlphabet } from 'nanoid';

// Create a nanoid generator for booking numbers
const generateBookingNumber = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Garage operations
  getGarage(id: number): Promise<Garage | undefined>;
  getAllGarages(): Promise<Garage[]>;
  createGarage(garage: InsertGarage): Promise<Garage>;
  updateGarage(id: number, garage: Partial<Garage>): Promise<Garage | undefined>;
  updateGarageStatus(id: number, status: string): Promise<Garage | undefined>;

  // Service operations
  getService(id: number): Promise<Service | undefined>;
  getServicesByGarage(garageId: number): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<Service>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;

  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  getProductsByGarage(garageId: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Driver operations
  getDriver(id: number): Promise<Driver | undefined>;
  getAllDrivers(): Promise<Driver[]>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: number, driver: Partial<Driver>): Promise<Driver | undefined>;

  // Booking operations
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingWithDetails(id: number): Promise<BookingWithDetails | undefined>;
  getBookingsByGarage(garageId: number): Promise<Booking[]>;
  getBookingsByDriver(driverId: number): Promise<Booking[]>;
  getTodaysBookings(garageId: number): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: number, status: string): Promise<Booking | undefined>;
  updateBooking(id: number, booking: Partial<Booking>): Promise<Booking | undefined>;
  
  // Analytics
  getBookingCountByDate(garageId: number, startDate: Date, endDate: Date): Promise<{date: string, count: number}[]>;
  getRevenueByService(garageId: number, startDate: Date, endDate: Date): Promise<{service: string, revenue: number}[]>;
  getTodaysSummary(garageId: number): Promise<{bookings: number, revenue: number, pendingActions: number}>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private garages: Map<number, Garage>;
  private services: Map<number, Service>;
  private products: Map<number, Product>;
  private drivers: Map<number, Driver>;
  private bookings: Map<number, Booking>;
  
  private currentUserId: number;
  private currentGarageId: number;
  private currentServiceId: number;
  private currentProductId: number;
  private currentDriverId: number;
  private currentBookingId: number;

  constructor() {
    this.users = new Map();
    this.garages = new Map();
    this.services = new Map();
    this.products = new Map();
    this.drivers = new Map();
    this.bookings = new Map();
    
    this.currentUserId = 1;
    this.currentGarageId = 1;
    this.currentServiceId = 1;
    this.currentProductId = 1;
    this.currentDriverId = 1;
    this.currentBookingId = 1;
    
    // Initialize with sample data
    this.initializeData();
  }

  // Initialize sample data
  private initializeData() {
    // Create a garage
    const garage: InsertGarage = {
      name: "John's Garage",
      address: "123 Main St, Anytown, USA",
      lat: "37.7749",
      lng: "-122.4194",
      status: "Open",
      email: "john@example.com",
      phone: "555-123-4567",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100"
    };
    this.createGarage(garage);

    // Create a user
    const user: InsertUser = {
      username: "john",
      password: "password",
      garageId: 1,
      role: "owner"
    };
    this.createUser(user);

    // Create some services
    const services: InsertService[] = [
      {
        garageId: 1,
        name: "Oil Change",
        description: "Standard oil change with filter replacement and fluid check.",
        price: 4999, // $49.99
        duration: 45,
        imageUrl: "https://images.unsplash.com/photo-1635006446525-a0ba306acee3?q=80&w=1632&auto=format&fit=crop",
        category: "Maintenance",
        isActive: true
      },
      {
        garageId: 1,
        name: "Tire Rotation",
        description: "Rotation of all tires to ensure even wear and extend tire life.",
        price: 2999, // $29.99
        duration: 30,
        imageUrl: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=400",
        category: "Maintenance",
        isActive: true
      },
      {
        garageId: 1,
        name: "Brake Service",
        description: "Complete brake inspection, pad replacement and rotor resurfacing.",
        price: 19999, // $199.99
        duration: 120,
        imageUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=400",
        category: "Repairs",
        isActive: true
      }
    ];
    
    services.forEach(service => this.createService(service));

    // Create some products
    const products: InsertProduct[] = [
      {
        garageId: 1,
        name: "Engine Oil (5W-30)",
        description: "High-quality synthetic engine oil for most vehicles.",
        price: 2499, // $24.99
        stock: 50,
        imageUrl: "https://images.unsplash.com/photo-1649264825393-c545772c9a69?q=80&w=1374&auto=format&fit=crop",
        category: "Oils",
        isActive: true
      },
      {
        garageId: 1,
        name: "Oil Filter",
        description: "Standard oil filter compatible with most vehicles.",
        price: 999, // $9.99
        stock: 100,
        imageUrl: "https://images.unsplash.com/photo-1678723650017-745ec86ac2e3?q=80&w=1470&auto=format&fit=crop",
        category: "Filters",
        isActive: true
      }
    ];
    
    products.forEach(product => this.createProduct(product));

    // Create some drivers
    const drivers: InsertDriver[] = [
      {
        name: "John Smith",
        email: "john.smith@example.com",
        phone: "555-111-2222",
        address: "123 Main Street, Apt 4B",
        zip: "12345",
        vehicleMake: "Honda",
        vehicleModel: "Civic",
        vehicleYear: "2018",
        password: "password123",
        lastActive: new Date()
      },
      {
        name: "Sarah Johnson",
        email: "sarah.johnson@example.com",
        phone: "555-222-3333",
        address: "456 Oak Avenue, Suite 101",
        zip: "67890",
        vehicleMake: "Toyota",
        vehicleModel: "Corolla",
        vehicleYear: "2020",
        password: "password123",
        lastActive: new Date()
      },
      {
        name: "Michael Brown",
        email: "michael.brown@example.com",
        phone: "555-333-4444",
        address: "789 Elm Boulevard",
        zip: "34567",
        vehicleMake: "Ford",
        vehicleModel: "F-150",
        vehicleYear: "2019",
        password: "password123",
        lastActive: new Date()
      }
    ];
    
    drivers.forEach(driver => this.createDriver(driver));

    // Create some bookings
    const today = new Date();
    
    const bookings: InsertBooking[] = [
      {
        bookingNumber: `BK-${generateBookingNumber()}`,
        garageId: 1,
        driverId: 1,
        date: new Date(today.setHours(10, 0, 0, 0)),
        status: "Confirmed",
        totalPrice: 4999, // $49.99
        servicesBooked: JSON.stringify([{ serviceId: 1, quantity: 1 }]),
        createdAt: new Date(today.setHours(today.getHours() - 24))
      },
      {
        bookingNumber: `BK-${generateBookingNumber()}`,
        garageId: 1,
        driverId: 2,
        date: new Date(today.setHours(11, 30, 0, 0)),
        status: "InProgress",
        totalPrice: 19999, // $199.99
        servicesBooked: JSON.stringify([{ serviceId: 3, quantity: 1 }]),
        createdAt: new Date(today.setHours(today.getHours() - 48))
      },
      {
        bookingNumber: `BK-${generateBookingNumber()}`,
        garageId: 1,
        driverId: 3,
        date: new Date(today.setHours(14, 0, 0, 0)),
        status: "New",
        totalPrice: 2999, // $29.99
        servicesBooked: JSON.stringify([{ serviceId: 2, quantity: 1 }]),
        createdAt: new Date(today.setHours(today.getHours() - 4))
      }
    ];
    
    bookings.forEach(booking => this.createBooking(booking));
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    // Ensure required fields have default values if missing
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || 'user' // Set default role if not provided
    };
    this.users.set(id, user);
    return user;
  }

  // Garage operations
  async getGarage(id: number): Promise<Garage | undefined> {
    return this.garages.get(id);
  }

  async getAllGarages(): Promise<Garage[]> {
    return Array.from(this.garages.values());
  }

  async createGarage(insertGarage: InsertGarage): Promise<Garage> {
    const id = this.currentGarageId++;
    // Ensure required fields have default values if missing
    const garage: Garage = { 
      ...insertGarage, 
      id,
      status: insertGarage.status || 'Closed', // Default status
      avatar: insertGarage.avatar || null // Default avatar 
    };
    this.garages.set(id, garage);
    return garage;
  }

  async updateGarage(id: number, garageUpdate: Partial<Garage>): Promise<Garage | undefined> {
    const garage = this.garages.get(id);
    if (!garage) return undefined;

    const updatedGarage: Garage = { ...garage, ...garageUpdate };
    this.garages.set(id, updatedGarage);
    return updatedGarage;
  }

  async updateGarageStatus(id: number, status: string): Promise<Garage | undefined> {
    return this.updateGarage(id, { status });
  }

  // Service operations
  async getService(id: number): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async getServicesByGarage(garageId: number): Promise<Service[]> {
    return Array.from(this.services.values()).filter(
      (service) => service.garageId === garageId,
    );
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = this.currentServiceId++;
    // Ensure required fields have default values if missing
    const service: Service = { 
      ...insertService, 
      id,
      imageUrl: insertService.imageUrl || null, // Default image URL
      isActive: insertService.isActive ?? true  // Default active status
    };
    this.services.set(id, service);
    return service;
  }

  async updateService(id: number, serviceUpdate: Partial<Service>): Promise<Service | undefined> {
    const service = this.services.get(id);
    if (!service) return undefined;

    const updatedService: Service = { ...service, ...serviceUpdate };
    this.services.set(id, updatedService);
    return updatedService;
  }

  async deleteService(id: number): Promise<boolean> {
    return this.services.delete(id);
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductsByGarage(garageId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.garageId === garageId,
    );
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    // Ensure required fields have default values if missing
    const product: Product = { 
      ...insertProduct, 
      id,
      imageUrl: insertProduct.imageUrl || null, // Default image URL
      isActive: insertProduct.isActive ?? true,  // Default active status
      stock: insertProduct.stock ?? 0           // Default stock
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, productUpdate: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const updatedProduct: Product = { ...product, ...productUpdate };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  // Driver operations
  async getDriver(id: number): Promise<Driver | undefined> {
    return this.drivers.get(id);
  }

  async getAllDrivers(): Promise<Driver[]> {
    return Array.from(this.drivers.values());
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const id = this.currentDriverId++;
    // Ensure required fields have default values if missing
    const driver: Driver = { 
      ...insertDriver, 
      id,
      address: insertDriver.address || null,    // Default address
      avatar: insertDriver.avatar || null,      // Default avatar
      zip: insertDriver.zip || null,            // Default zip
      lastActive: insertDriver.lastActive || new Date() // Default last active date
    };
    this.drivers.set(id, driver);
    return driver;
  }

  async updateDriver(id: number, driverUpdate: Partial<Driver>): Promise<Driver | undefined> {
    const driver = this.drivers.get(id);
    if (!driver) return undefined;

    const updatedDriver: Driver = { ...driver, ...driverUpdate };
    this.drivers.set(id, updatedDriver);
    return updatedDriver;
  }

  // Booking operations
  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getBookingWithDetails(id: number): Promise<BookingWithDetails | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;

    const driver = this.drivers.get(booking.driverId);
    if (!driver) return undefined;

    // Parse the servicesBooked JSON to get service IDs
    let services: Service[] = [];
    try {
      const servicesBooked = typeof booking.servicesBooked === 'string' 
        ? JSON.parse(booking.servicesBooked) 
        : booking.servicesBooked;
        
      if (Array.isArray(servicesBooked)) {
        services = servicesBooked
          .map((item: { serviceId: number }) => this.services.get(item.serviceId))
          .filter(Boolean) as Service[];
      }
    } catch (error) {
      console.error('Error parsing servicesBooked:', error);
    }

    // Parse the productsBooked JSON if it exists
    let products: Product[] = [];
    if (booking.productsBooked) {
      try {
        const productsBooked = typeof booking.productsBooked === 'string'
          ? JSON.parse(booking.productsBooked)
          : booking.productsBooked;
          
        if (Array.isArray(productsBooked)) {
          products = productsBooked
            .map((item: { productId: number }) => this.products.get(item.productId))
            .filter(Boolean) as Product[];
        }
      } catch (error) {
        console.error('Error parsing productsBooked:', error);
      }
    }

    return {
      ...booking,
      driver,
      services,
      products
    };
  }

  async getBookingsByGarage(garageId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) => booking.garageId === garageId,
    );
  }

  async getBookingsByDriver(driverId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) => booking.driverId === driverId,
    );
  }

  async getTodaysBookings(garageId: number): Promise<Booking[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return Array.from(this.bookings.values()).filter(
      (booking) => 
        booking.garageId === garageId && 
        booking.date >= today && 
        booking.date < tomorrow
    );
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = this.currentBookingId++;
    
    // Helper function to generate a random booking number
    const generateBookingNumber = () => {
      return Math.random().toString(36).substring(2, 10).toUpperCase();
    };
    
    // Ensure required fields have default values if missing
    const booking: Booking = { 
      ...insertBooking, 
      id,
      status: insertBooking.status || 'New',
      bookingNumber: insertBooking.bookingNumber || `BK-${generateBookingNumber()}`,
      notes: insertBooking.notes || null,
      productsBooked: insertBooking.productsBooked || [],
      createdAt: insertBooking.createdAt || new Date(),
      servicesBooked: insertBooking.servicesBooked as unknown
    };
    
    this.bookings.set(id, booking);
    return booking;
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    return this.updateBooking(id, { status });
  }

  async updateBooking(id: number, bookingUpdate: Partial<Booking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;

    const updatedBooking: Booking = { ...booking, ...bookingUpdate };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  // Analytics
  async getBookingCountByDate(garageId: number, startDate: Date, endDate: Date): Promise<{date: string, count: number}[]> {
    const bookings = Array.from(this.bookings.values()).filter(
      (booking) => 
        booking.garageId === garageId && 
        booking.date >= startDate && 
        booking.date <= endDate
    );

    // Group bookings by date
    const bookingsByDate = bookings.reduce((acc, booking) => {
      const dateStr = booking.date.toISOString().split('T')[0];
      if (!acc[dateStr]) {
        acc[dateStr] = 0;
      }
      acc[dateStr]++;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(bookingsByDate).map(([date, count]) => ({ date, count }));
  }

  async getRevenueByService(garageId: number, startDate: Date, endDate: Date): Promise<{service: string, revenue: number}[]> {
    const bookings = Array.from(this.bookings.values()).filter(
      (booking) => 
        booking.garageId === garageId && 
        booking.date >= startDate && 
        booking.date <= endDate
    );

    // Group revenue by service
    const revenueByService: Record<string, number> = {};

    for (const booking of bookings) {
      try {
        // Safely parse servicesBooked from either string or object
        const servicesBooked = typeof booking.servicesBooked === 'string'
          ? JSON.parse(booking.servicesBooked)
          : booking.servicesBooked;
        
        if (Array.isArray(servicesBooked)) {
          for (const item of servicesBooked) {
            const service = this.services.get(item.serviceId);
            if (service) {
              if (!revenueByService[service.name]) {
                revenueByService[service.name] = 0;
              }
              revenueByService[service.name] += service.price * (item.quantity || 1);
            }
          }
        }
      } catch (error) {
        console.error('Error parsing services booked:', error);
      }
    }

    return Object.entries(revenueByService).map(([service, revenue]) => ({ service, revenue }));
  }

  async getTodaysSummary(garageId: number): Promise<{bookings: number, revenue: number, pendingActions: number}> {
    const todaysBookings = await this.getTodaysBookings(garageId);
    
    const revenue = todaysBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
    
    const pendingActions = todaysBookings.filter(
      booking => ['New', 'Confirmed'].includes(booking.status)
    ).length;

    return {
      bookings: todaysBookings.length,
      revenue,
      pendingActions
    };
  }
}

export const storage = new MemStorage();
