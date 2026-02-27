import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    role: z.enum(["buyer", "seller", "both"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").nullable(),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]+$/, "Please enter a valid phone number")
    .nullable()
    .or(z.literal("")),
  location: z.string().nullable().or(z.literal("")),
  bio: z.string().max(500, "Bio must be under 500 characters").nullable().or(z.literal("")),
  role: z.enum(["buyer", "seller", "both"]),
});

export const listingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(120),
  description: z.string().max(5000).nullable().or(z.literal("")),
  address_line1: z.string().min(3, "Address is required"),
  address_line2: z.string().nullable().or(z.literal("")),
  city: z.string().min(2, "City is required"),
  state: z.string().length(2, "Use 2-letter state code"),
  zip_code: z.string().regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code"),
  price: z.number().positive("Price must be positive").int(),
  bedrooms: z.number().int().min(0).nullable(),
  bathrooms: z.number().min(0).nullable(),
  sqft: z.number().int().positive().nullable(),
  lot_sqft: z.number().int().positive().nullable(),
  year_built: z.number().int().min(1800).max(new Date().getFullYear()).nullable(),
  property_type: z.enum(["house", "condo", "townhouse", "land", "multi_family", "other"]),
  photos: z.array(z.string()),
  cover_photo_index: z.number().int().min(0),
});

export const offerSchema = z.object({
  offer_price: z.number().positive("Offer price must be positive").int(),
  earnest_money: z.number().int().min(0),
  closing_date: z.string().min(1, "Closing date is required"),
  inspection_contingency: z.boolean(),
  financing_contingency: z.boolean(),
  appraisal_contingency: z.boolean(),
  notes: z.string().max(2000).nullable().or(z.literal("")),
});

export const counterOfferSchema = z.object({
  counter_price: z.number().positive("Counter price must be positive").int(),
  counter_notes: z.string().max(2000).nullable().or(z.literal("")),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type ListingFormData = z.infer<typeof listingSchema>;
export type OfferFormData = z.infer<typeof offerSchema>;
export type CounterOfferFormData = z.infer<typeof counterOfferSchema>;
