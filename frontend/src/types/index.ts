export interface Category {
  id: string;
  name: string;
  type: "DONATION" | "ECOPOINT";
  icon: string;
}

export interface ListingImage {
  id: string;
  url: string;
}

export interface ListingUser {
  id: string;
  name: string;
  avatarUrl?: string | null;
  phone?: string | null;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  type: "DONATION" | "ECOPOINT";
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  userId: string;
  categoryId: string;
  images: ListingImage[];
  category: Category;
  user: ListingUser;
  waLink?: string | null;
  createdAt: string;
}