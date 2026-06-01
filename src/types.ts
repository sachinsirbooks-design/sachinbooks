export type BookStatus = 'In stock' | 'Out of stock';
export type BookType = 'New' | 'Old';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  category: string;
  subject: string;
  publication: string;
  publicationYear?: string;
  edition?: string;
  language?: string;
  price: number;
  discount: number;
  finalPrice: number;
  description: string;
  imageUrl: string;
  weight: number;          // Weight in grams for shipping
  stockQuantity: number;
  availableCopies?: number;
  shelfLocation?: string;
  status: BookStatus;
  isSachinSirBook?: boolean;
  sachinSirGroup?: string; // MPSC Sets, Subject-wise Sets, Premium Sets, Foundation Sets
  type: BookType;
  sampleFileUrl?: string;   // PDF drive link
  createdAt?: string;
  addedDate?: string;
}

export interface Subject {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  description?: string;
}

export interface AppSettings {
  id: 'site_settings';
  announcement?: string;
  logoUrl: string;
  socialLinks: {
    whatsapp?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    twitter?: string;
  };
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
  founder: {
    name: string;
    tagline: string;
    description: string;
    imageUrl: string;
  };
  whatsappChatbot: {
    phoneNumber: string;
    message: string;
    enabled: boolean;
  };
  razorpay?: {
    enabled: boolean;
    testMode: boolean;
    keyId: string;
    keySecret: string;
    webhookSecret: string;
  };
  imageSettings?: {
    bannerDesktop: { width: number; height: number };
    bannerMobile: { width: number; height: number };
    bookThumbnail: { width: number; height: number };
    maxFileSizeMB: number;
  };
  publicationPriorities?: string[];
}

export type CategoryType = 'exam' | 'subject' | 'special' | 'practice' | 'language';

export interface Category {
  id: string;
  name: string;
  slug: string;
  type: CategoryType;
  description?: string;
  order?: number;
  icon?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role?: string;
  isAdmin?: boolean;
  createdAt?: string;
}

export interface CartItem extends Book {
  quantity: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  weight: number;
  discount?: number;
  couponCode?: string;
  couponApplied?: boolean;
  status: OrderStatus;
  address: {
    fullName: string;
    phone: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
    postOffice?: string;
    taluka?: string;
  };
  paymentId?: string;
  paymentOrderId?: string;
  paymentStatus?: 'pending' | 'success' | 'failed';
  createdAt: string;
}

export interface Banner {
  id: string;
  imageUrl: string; // Desktop version fallback
  mobileImageUrl?: string;
  title?: string;
  link?: string;
  active: boolean;
  order: number;
  config?: {
    desktopWidth?: number;
    desktopHeight?: number;
    mobileWidth?: number;
    mobileHeight?: number;
  };
}

export interface KoboOffer {
  id: string;
  name: string;
  enabled: boolean;
  minQuantity: number;
  discountAmount: number;
  applicableCategorySlugs?: string[]; // empty fits all
  applicableBookIds?: string[]; // empty fits all
  expiryDate?: string;
  stackable: boolean;
  autoApply: boolean;
  createdAt: string;
}

export interface StudySet {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  discount: number;
  imageUrl?: string;
  bookIds: string[];
  isFeatured: boolean;
  category?: string;
  topLabel?: string;
  statusBadge?: string;
  stats?: string;
  createdAt: string;
  type?: 'combo' | 'batch';
}

export interface Publisher {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minCartValue: number;
  isPublic: boolean;
  active: boolean;
  createdAt?: string;
}

