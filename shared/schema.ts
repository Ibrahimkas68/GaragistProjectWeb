import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Garage schema
export const garages = pgTable("garages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  lat: text("lat").notNull(), // Latitude for map display
  lng: text("lng").notNull(), // Longitude for map display
  status: text("status").notNull().default("Open"), // Open, Busy, Closed
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  avatar: text("avatar"),
});

// Services schema
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  garageId: integer("garage_id").notNull().references(() => garages.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // In cents
  duration: integer("duration").notNull(), // In minutes
  imageUrl: text("image_url"),
  category: text("category").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

// Products schema
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  garageId: integer("garage_id").notNull().references(() => garages.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // In cents
  stock: integer("stock").notNull().default(0),
  imageUrl: text("image_url"),
  category: text("category").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

// Drivers (customers) schema
export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  password: text("password").notNull(),
  address: text("address"),
  zip: text("zip"),
  vehicleMake: text("vehicle_make").notNull(),
  vehicleModel: text("vehicle_model").notNull(),
  vehicleYear: text("vehicle_year").notNull(),
  avatar: text("avatar"),
  lastActive: timestamp("last_active").notNull().defaultNow(),
});

// Bookings schema
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  bookingNumber: varchar("booking_number", { length: 10 }).notNull().unique(),
  garageId: integer("garage_id").notNull().references(() => garages.id),
  driverId: integer("driver_id").notNull().references(() => drivers.id),
  date: timestamp("date").notNull(),
  status: text("status").notNull().default("New"), // New, Confirmed, InProgress, Completed, Cancelled, NoShow
  totalPrice: integer("total_price").notNull(), // In cents
  notes: text("notes"),
  servicesBooked: jsonb("services_booked").notNull(), // Array of service IDs and quantities
  productsBooked: jsonb("products_booked"), // Optional array of product IDs and quantities
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Users for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  garageId: integer("garage_id").notNull().references(() => garages.id),
  role: text("role").notNull().default("staff"), // owner, manager, staff
});

// Insert schemas
export const insertGarageSchema = createInsertSchema(garages);
export const insertServiceSchema = createInsertSchema(services);
export const insertProductSchema = createInsertSchema(products);
export const insertDriverSchema = createInsertSchema(drivers);
export const insertBookingSchema = createInsertSchema(bookings);
export const insertUserSchema = createInsertSchema(users);

// Types
export type InsertGarage = z.infer<typeof insertGarageSchema>;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Garage = typeof garages.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type User = typeof users.$inferSelect;

// Extended types for API responses
export interface BookingWithDetails extends Booking {
  driver: Driver;
  services: Service[];
  products?: Product[];
}
