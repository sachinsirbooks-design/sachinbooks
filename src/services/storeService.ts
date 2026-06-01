import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  orderBy, 
  limit, 
  serverTimestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Book, Category, Banner, AppSettings, Order, Subject, KoboOffer, StudySet, Publisher } from '../types';

const BOOKS_COLLECTION = 'books';
const CATEGORIES_COLLECTION = 'categories';
const SUBJECTS_COLLECTION = 'subjects';
const BANNERS_COLLECTION = 'banners';
const SETTINGS_COLLECTION = 'settings';
const ORDERS_COLLECTION = 'orders';
const ADMINS_COLLECTION = 'admins';
const KOBO_OFFERS_COLLECTION = 'koboOffers';
const STUDY_SETS_COLLECTION = 'studySets';
const PUBLISHERS_COLLECTION = 'publishers';

export const storeService = {
  // Books
  async getBooks(categorySlug?: string, limitCount?: number, publication?: string, subjectSlug?: string) {
    let constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
    if (categorySlug) {
      constraints.push(where('category', '==', categorySlug));
    }
    if (subjectSlug) {
      constraints.push(where('subject', '==', subjectSlug));
    }
    if (publication) {
      constraints.push(where('publication', '==', publication));
    }
    if (limitCount && !publication) {
      // If we are limiting, we might miss priority books if we don't fetch enough.
      // For now, let's just fetch and then sort if needed, or if limit is large enough.
      constraints.push(limit(limitCount));
    }
    const q = query(collection(db, BOOKS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);
    let books = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));

    // Priority Sorting
    const settings = await storeService.getSettings();
    if (settings?.publicationPriorities && settings.publicationPriorities.length > 0) {
      const priorities = settings.publicationPriorities;
      books.sort((a, b) => {
        const indexA = priorities.indexOf(a.publication);
        const indexB = priorities.indexOf(b.publication);
        
        // If both in priorities, sort by index
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        // If only A in priorities, A first
        if (indexA !== -1) return -1;
        // If only B in priorities, B first
        if (indexB !== -1) return 1;
        // Neither in priorities, maintain original order
        return 0;
      });
    }

    if (limitCount) {
      return books.slice(0, limitCount);
    }
    return books;
  },

  async getBook(id: string) {
    const docRef = doc(db, BOOKS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Book;
  },

  async addBook(book: Omit<Book, 'id'>) {
    const bookData = {
      ...book,
      createdAt: book.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return await addDoc(collection(db, BOOKS_COLLECTION), bookData);
  },

  async updateBook(id: string, updates: Partial<Book>) {
    const docRef = doc(db, BOOKS_COLLECTION, id);
    return await updateDoc(docRef, updates);
  },

  async deleteBook(id: string) {
    const docRef = doc(db, BOOKS_COLLECTION, id);
    return await deleteDoc(docRef);
  },

  async deleteAllBooks() {
    const snapshot = await getDocs(collection(db, BOOKS_COLLECTION));
    const deletePromises = snapshot.docs.map(document => deleteDoc(doc(db, BOOKS_COLLECTION, document.id)));
    await Promise.all(deletePromises);
    return snapshot.docs.length;
  },
  async getSettings(): Promise<AppSettings | null> {
    const docRef = doc(db, SETTINGS_COLLECTION, 'site_settings');
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: 'site_settings', ...snapshot.data() } as AppSettings;
  },

  async updateSettings(updates: Partial<AppSettings>) {
    const docRef = doc(db, SETTINGS_COLLECTION, 'site_settings');
    return await setDoc(docRef, updates, { merge: true });
  },

  async createSettings(settings: Omit<AppSettings, 'id'>) {
    const docRef = doc(db, SETTINGS_COLLECTION, 'site_settings');
    return await setDoc(docRef, settings);
  },

  // Staff / Admins
  async getAdmins() {
    const snapshot = await getDocs(collection(db, 'admin_emails'));
    return snapshot.docs.map(doc => ({ id: doc.id, email: doc.data().email }));
  },

  async addAdmin(email: string) {
    const docRef = doc(db, 'admin_emails', email);
    return await setDoc(docRef, { email, createdAt: serverTimestamp() });
  },

  async removeAdmin(id: string) {
    return await deleteDoc(doc(db, 'admin_emails', id));
  },

  // Users
  async getUsers() {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Categories
  async getCategories() {
    const q = query(collection(db, CATEGORIES_COLLECTION), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
  },

  async addCategory(category: Omit<Category, 'id'>) {
    return await addDoc(collection(db, CATEGORIES_COLLECTION), category);
  },

  async updateCategory(id: string, updates: Partial<Category>) {
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    return await updateDoc(docRef, updates);
  },

  async deleteCategory(id: string) {
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    return await deleteDoc(docRef);
  },

  // Banners
  async getBanners(all = false) {
    const constraints: QueryConstraint[] = [orderBy('order', 'asc')];
    if (!all) {
      constraints.push(where('active', '==', true));
    }
    const q = query(collection(db, BANNERS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner));
  },

  async addBanner(banner: Omit<Banner, 'id'>) {
    return await addDoc(collection(db, BANNERS_COLLECTION), banner);
  },

  async updateBanner(id: string, updates: Partial<Banner>) {
    const docRef = doc(db, BANNERS_COLLECTION, id);
    return await updateDoc(docRef, updates);
  },

  async deleteBanner(id: string) {
    const docRef = doc(db, BANNERS_COLLECTION, id);
    return await deleteDoc(docRef);
  },

  // Orders & Analytics
  async getOrders() {
    const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
  },

  async getDashboardStats() {
    const books = await storeService.getBooks();
    const orders = await storeService.getOrders();
    const revenue = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((acc, current) => acc + current.total, 0);
    
    return {
      totalProducts: books.length,
      totalOrders: orders.length,
      revenue
    };
  },

  async getPayments() {
    const q = query(collection(db, 'payments'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getFailedPayments() {
    const q = query(collection(db, 'failedPayments'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getPaymentLogs() {
    const q = query(collection(db, 'paymentLogs'), orderBy('createdAt', 'desc'), limit(100));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Featured / Hot Releases
  async getHotReleases(limitCount = 8) {
    return storeService.getBooks(undefined, limitCount);
  },

  // Subjects
  async getSubjects(categorySlug?: string) {
    let q = query(collection(db, SUBJECTS_COLLECTION), orderBy('name', 'asc'));
    if (categorySlug) {
      q = query(collection(db, SUBJECTS_COLLECTION), where('categorySlug', '==', categorySlug), orderBy('name', 'asc'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
  },

  async addSubject(subject: Omit<Subject, 'id'>) {
    return await addDoc(collection(db, SUBJECTS_COLLECTION), subject);
  },

  async updateSubject(id: string, updates: Partial<Subject>) {
    const docRef = doc(db, SUBJECTS_COLLECTION, id);
    return await updateDoc(docRef, updates);
  },

  async deleteSubject(id: string) {
    const docRef = doc(db, SUBJECTS_COLLECTION, id);
    return await deleteDoc(docRef);
  },

  // Seed Data Generator
  async seedSampleData() {
    console.log('Starting seed operations...');
    const SAMPLE_CATEGORIES: Omit<Category, 'id'>[] = [
      { name: 'Sachin Dhawale Publication', slug: 'sachin-dhawale-publication', type: 'special', order: 1 },
      { name: 'MPSC Books', slug: 'mpsc-books', type: 'exam', order: 2 },
      { name: 'Saral Seva Books', slug: 'saral-seva-books', type: 'exam', order: 3 },
      { name: 'New Books', slug: 'new-books', type: 'special', order: 4 },
      { name: 'All Books', slug: 'all-books', type: 'special', order: 5 },
      { name: 'Polity', slug: 'polity', type: 'subject', order: 6 },
      { name: 'Economics', slug: 'economics', type: 'subject', order: 7 },
      { name: 'Science', slug: 'science', type: 'subject', order: 8 },
      { name: 'Maths & Reasoning', slug: 'maths-reasoning', type: 'subject', order: 9 },
      { name: 'History', slug: 'history', type: 'subject', order: 10 },
      { name: 'Geography', slug: 'geography', type: 'subject', order: 11 },
      { name: 'Current Affairs', slug: 'current-affairs', type: 'subject', order: 12 },
      { name: 'Hindi', slug: 'hindi', type: 'language', order: 13 },
      { name: 'Marathi Grammar', slug: 'marathi-grammar', type: 'language', order: 14 },
      { name: 'Question Papers', slug: 'question-papers', type: 'practice', order: 15 },
      { name: 'English', slug: 'english', type: 'language', order: 16 }
    ];

    const SAMPLE_SUBJECTS: Omit<Subject, 'id'>[] = [
      { name: 'Maths', slug: 'maths', categorySlug: 'maths-reasoning' },
      { name: 'Reasoning', slug: 'reasoning', categorySlug: 'maths-reasoning' },
      { name: 'Marathi', slug: 'marathi', categorySlug: 'marathi-grammar' },
      { name: 'English', slug: 'english', categorySlug: 'english' },
      { name: 'Science', slug: 'science', categorySlug: 'science' },
      { name: 'Geography', slug: 'geography', categorySlug: 'geography' }
    ];

    const SAMPLE_BOOKS: Omit<Book, 'id'>[] = [
      {
        title: 'Complete Mathematics Guide (MPSC & All Exams)',
        author: 'Sachin Dhawale',
        isbn: 'SDP-MATH-01',
        category: 'sachin-dhawale-publication',
        subject: 'maths',
        publication: "Sachin Dhawale's Publication",
        publicationYear: '2025',
        edition: '7th Edition',
        language: 'Marathi',
        price: 490,
        discount: 20,
        finalPrice: 392,
        description: 'Comprehensive guide for Mathematics starting from basic concepts to shortcuts and TCS/IBPS pattern tricks.',
        imageUrl: 'https://m.media-amazon.com/images/I/71X8k8yB+vL._AC_UF1000,1000_QL80_.jpg',
        weight: 500,
        stockQuantity: 150,
        availableCopies: 145,
        shelfLocation: 'A-1-1',
        status: 'In stock',
        type: 'New',
        createdAt: new Date().toISOString(),
        addedDate: new Date().toISOString()
      },
      {
        title: 'Reasoning Masterclass (Special TCS & IBPS Pattern)',
        author: 'Sachin Dhawale',
        isbn: 'SDP-REAS-02',
        category: 'sachin-dhawale-publication',
        subject: 'reasoning',
        publication: "Sachin Dhawale's Publication",
        publicationYear: '2025',
        edition: '5th Edition',
        language: 'Marathi',
        price: 450,
        discount: 20,
        finalPrice: 360,
        description: 'Step-by-step logic and shortcuts for all Reasoning chapters. Perfect for MPSC Combine, Police Bharti, and Talathi.',
        imageUrl: 'https://m.media-amazon.com/images/I/71X8k8yB+vL._AC_UF1000,1000_QL80_.jpg',
        weight: 480,
        stockQuantity: 200,
        availableCopies: 190,
        shelfLocation: 'A-1-2',
        status: 'In stock',
        type: 'New',
        createdAt: new Date().toISOString(),
        addedDate: new Date().toISOString()
      },
      {
        title: 'Maths + Reasoning Ultimate Combo',
        author: 'Sachin Dhawale',
        isbn: 'SDP-COMBO-MR',
        category: 'sachin-dhawale-publication',
        subject: 'maths-reasoning',
        publication: "Sachin Dhawale's Publication",
        publicationYear: '2025',
        edition: 'Latest',
        language: 'Marathi',
        price: 940,
        discount: 30,
        finalPrice: 658,
        description: 'The standard bestseller combo set of Complete Mathematics Guide and Reasoning Masterclass by Sachin Dhawale Sir.',
        imageUrl: 'https://m.media-amazon.com/images/I/71X8k8yB+vL._AC_UF1000,1000_QL80_.jpg',
        weight: 980,
        stockQuantity: 100,
        availableCopies: 90,
        shelfLocation: 'A-2-1',
        status: 'In stock',
        type: 'New',
        createdAt: new Date().toISOString(),
        addedDate: new Date().toISOString()
      },
      {
        title: 'MPSC CSAT Specialist Guidance Book',
        author: 'Sachin Dhawale',
        isbn: 'SDP-CSAT-03',
        category: 'mpsc-books',
        subject: 'reasoning',
        publication: "Sachin Dhawale's Publication",
        publicationYear: '2024',
        edition: 'New Edition',
        language: 'Marathi',
        price: 520,
        discount: 25,
        finalPrice: 390,
        description: 'Highly recommended guide for MPSC State Services Paper II CSAT preparation including previous years solved papers.',
        imageUrl: 'https://m.media-amazon.com/images/I/71X8k8yB+vL._AC_UF1000,1000_QL80_.jpg',
        weight: 520,
        stockQuantity: 120,
        availableCopies: 115,
        shelfLocation: 'C-1-3',
        status: 'In stock',
        type: 'New',
        createdAt: new Date().toISOString(),
        addedDate: new Date().toISOString()
      },
      {
        title: 'Police Bharti Arithmetic & Aptitude Guide',
        author: 'Sachin Dhawale',
        isbn: 'SDP-PB-04',
        category: 'saral-seva-books',
        subject: 'maths',
        publication: "Sachin Dhawale's Publication",
        publicationYear: '2025',
        edition: 'Latest Edition',
        language: 'Marathi',
        price: 360,
        discount: 15,
        finalPrice: 306,
        description: 'Arithmetic guide specifically tailored with local Police Recruitment exams and fast computation methods.',
        imageUrl: 'https://m.media-amazon.com/images/I/71X8k8yB+vL._AC_UF1000,1000_QL80_.jpg',
        weight: 420,
        stockQuantity: 300,
        availableCopies: 280,
        shelfLocation: 'P-1-1',
        status: 'In stock',
        type: 'New',
        createdAt: new Date().toISOString(),
        addedDate: new Date().toISOString()
      },
      {
        title: 'Talathi Bharti & Saral Seva Complete Set',
        author: 'Sachin Dhawale',
        isbn: 'SDP-TB-05',
        category: 'saral-seva-books',
        subject: 'maths-reasoning',
        publication: "Sachin Dhawale's Publication",
        publicationYear: '2024',
        edition: '1st',
        language: 'Marathi',
        price: 1100,
        discount: 30,
        finalPrice: 770,
        description: 'Combo package for complete syllabus of Saral Seva, ZP, Talathi recruitment. Invaluable shortcuts included.',
        imageUrl: 'https://m.media-amazon.com/images/I/71X8k8yB+vL._AC_UF1000,1000_QL80_.jpg',
        weight: 900,
        stockQuantity: 80,
        availableCopies: 75,
        shelfLocation: 'T-1-2',
        status: 'In stock',
        type: 'New',
        createdAt: new Date().toISOString(),
        addedDate: new Date().toISOString()
      },
      {
        title: 'Marathi Grammar Fast Track Booster Sanch',
        author: 'M. R. Shinde',
        isbn: 'LKP-MAR-01',
        category: 'marathi-grammar',
        subject: 'marathi',
        publication: "Lokseva Publications",
        publicationYear: '2025',
        edition: '12th Edition',
        language: 'Marathi',
        price: 380,
        discount: 10,
        finalPrice: 342,
        description: 'Excellent Marathi grammar notes and multiple choice questions compiled for State Services and Combine exams.',
        imageUrl: 'https://m.media-amazon.com/images/I/71X8k8yB+vL._AC_UF1000,1000_QL80_.jpg',
        weight: 380,
        stockQuantity: 90,
        availableCopies: 82,
        shelfLocation: 'M-1-1',
        status: 'In stock',
        type: 'New',
        createdAt: new Date().toISOString(),
        addedDate: new Date().toISOString()
      },
      {
        title: 'English Grammar Workbook with Solved Exercises',
        author: 'V. K. Patil',
        isbn: 'LKP-ENG-02',
        category: 'english',
        subject: 'english',
        publication: "Lokseva Publications",
        publicationYear: '2024',
        edition: '4th',
        language: 'English',
        price: 420,
        discount: 15,
        finalPrice: 357,
        description: 'Comprehensive English grammar reference work matching standard exams formats. Fully analyzed questions included.',
        imageUrl: 'https://m.media-amazon.com/images/I/71X8k8yB+vL._AC_UF1000,1000_QL80_.jpg',
        weight: 400,
        stockQuantity: 70,
        availableCopies: 65,
        shelfLocation: 'E-1-2',
        status: 'In stock',
        type: 'New',
        createdAt: new Date().toISOString(),
        addedDate: new Date().toISOString()
      },
      {
        title: 'General Science Exam Blueprint Book',
        author: 'K. R. Jadhav',
        isbn: 'SDP-SCI-01',
        category: 'science',
        subject: 'science',
        publication: "Sachin Dhawale's Publication",
        publicationYear: '2025',
        edition: '2nd',
        language: 'Marathi',
        price: 320,
        discount: 10,
        finalPrice: 288,
        description: 'Physics, Chemistry, and Biology essentials written specifically for state competitive examination standards.',
        imageUrl: 'https://m.media-amazon.com/images/I/71X8k8yB+vL._AC_UF1000,1000_QL80_.jpg',
        weight: 350,
        stockQuantity: 110,
        availableCopies: 103,
        shelfLocation: 'S-2-1',
        status: 'In stock',
        type: 'New',
        createdAt: new Date().toISOString(),
        addedDate: new Date().toISOString()
      },
      {
        title: 'Geography of India & Maharashtra Maps Expert',
        author: 'D. S. Pawar',
        isbn: 'SDP-GEO-01',
        category: 'geography',
        subject: 'geography',
        publication: "Sachin Dhawale's Publication",
        publicationYear: '2024',
        edition: '3rd',
        language: 'Marathi',
        price: 280,
        discount: 10,
        finalPrice: 252,
        description: 'Detailed mapped geography of Maharashtra and India. Essential pictorial reference guide.',
        imageUrl: 'https://m.media-amazon.com/images/I/71X8k8yB+vL._AC_UF1000,1000_QL80_.jpg',
        weight: 340,
        stockQuantity: 140,
        availableCopies: 138,
        shelfLocation: 'G-1-1',
        status: 'In stock',
        type: 'New',
        createdAt: new Date().toISOString(),
        addedDate: new Date().toISOString()
      },
      {
        title: 'Ultimate Batch Package (Full Preparation course set)',
        author: 'Sachin Dhawale',
        isbn: 'SDP-BATCH-FULL',
        category: 'sachin-dhawale-publication',
        subject: 'maths-reasoning',
        publication: "Sachin Dhawale's Publication",
        publicationYear: '2025',
        edition: 'Elite Edition',
        language: 'Marathi',
        price: 1800,
        discount: 40,
        finalPrice: 1080,
        description: 'Full coaching batch combo: include Maths, Reasoning, previous year solved sanch plus worksheets set.',
        imageUrl: 'https://m.media-amazon.com/images/I/71X8k8yB+vL._AC_UF1000,1000_QL80_.jpg',
        weight: 1540,
        stockQuantity: 50,
        availableCopies: 48,
        shelfLocation: 'A-3-3',
        status: 'In stock',
        type: 'New',
        createdAt: new Date().toISOString(),
        addedDate: new Date().toISOString()
      }
    ];

    const SAMPLE_USERS = [
      { uid: 'user_1', email: 'test_student@gmail.com', name: 'Test Student', isAdmin: false, createdAt: new Date().toISOString() },
      { uid: 'user_2', email: 'librarian@gmail.com', name: 'James Librarian', isAdmin: true, createdAt: new Date().toISOString() }
    ];

    const SAMPLE_ORDERS: Omit<Order, 'id'>[] = [
      {
        userId: 'user_1',
        total: 809,
        status: 'delivered',
        createdAt: new Date().toISOString(),
        paymentStatus: 'success',
        items: [{ 
          id: 'sample_book_id', 
          title: 'Artificial Intelligence Basics', 
          price: 809, 
          finalPrice: 809, 
          quantity: 1, 
          imageUrl: '',
          author: 'Tom Taulli',
          category: 'technology',
          subject: 'ai-ml',
          publication: 'Apress',
          description: '',
          weight: 300,
          stockQuantity: 25,
          status: 'In stock',
          type: 'New'
        }] as any,
        address: { 
          fullName: 'Test Student', 
          phone: '9876543210', 
          city: 'Pune', 
          state: 'Maharashtra', 
          addressLine: '123 Study Lane', 
          pincode: '411001' 
        },
        weight: 300
      }
    ];

    try {
      // 1. Seed Settings
      console.log('Step 1/6: Seeding site settings...');
      await storeService.createSettings({
        logoUrl: '',
        seo: {
          title: 'Sachin Sir Books | MPSC Specialist',
          description: "Maharashtra's leading coaching hub for Maths & Reasoning.",
          keywords: 'mpsc, upsc, sachin dhawale, maths, reasoning, csat'
        },
        socialLinks: { whatsapp: 'https://wa.me/919850578039', facebook: '', instagram: '', youtube: '' },
        whatsappChatbot: { enabled: true, phoneNumber: '+919850578039', message: 'Hello! I need help with MPSC books.' },
        founder: { name: 'Sachin Dhawale', tagline: 'Concept is Power', description: 'Mentoring thousands of aspirants...', imageUrl: '' },
        publicationPriorities: ["Sachin Dhawale's Publication"]
      });

      // 2. Seed Categories
      console.log('Step 2/6: Seeding categories...');
      const existingCats = await storeService.getCategories();
      const existingSlugs = new Set(existingCats.map(c => c.slug));
      
      for (const cat of SAMPLE_CATEGORIES) {
        if (!existingSlugs.has(cat.slug)) {
          try {
            await storeService.addCategory(cat);
            console.log(`  Added category: ${cat.name}`);
          } catch (e) {
            console.error(`  Failed to add category ${cat.name}:`, e);
          }
        } else {
          console.log(`  Category ${cat.name} already exists, skipping.`);
        }
      }

      // 3. Seed Subjects
      console.log('Step 3/6: Seeding subjects...');
      const existingSubs = await storeService.getSubjects();
      const existingSubSlugs = new Set(existingSubs.map(s => s.slug));

      for (const sub of SAMPLE_SUBJECTS) {
        if (!existingSubSlugs.has(sub.slug)) {
          try {
            await storeService.addSubject(sub);
            console.log(`  Added subject: ${sub.name}`);
          } catch (e) {
            console.error(`  Failed to add subject ${sub.name}:`, e);
          }
        } else {
          console.log(`  Subject ${sub.name} already exists, skipping.`);
        }
      }

      // 4. Seed Books
      console.log('Step 4/6: Seeding books...');
      const existingBooks = await storeService.getBooks();
      const existingIsbns = new Set(existingBooks.map(b => b.isbn).filter(Boolean));

      for (const book of SAMPLE_BOOKS) {
        if (!book.isbn || !existingIsbns.has(book.isbn)) {
          try {
            await storeService.addBook(book);
            console.log(`  Added book: ${book.title}`);
          } catch (e) {
            console.error(`  Failed to add book ${book.title}:`, e);
          }
        } else {
          console.log(`  Book ${book.title} already exists (ISBN ${book.isbn}), skipping.`);
        }
      }

      // 5. Seed Users
      console.log('Step 5/6: Seeding users...');
      for (const user of SAMPLE_USERS) {
        try {
          await setDoc(doc(db, 'users', user.uid), user, { merge: true });
          console.log(`  Synced user profile: ${user.email}`);
        } catch (e) {
          console.error(`  Failed to add user ${user.uid}:`, e);
        }
      }

      // 6. Ensure Master Admin
      console.log('Step 6/7: Ensuring master admin access...');
      try {
        await setDoc(doc(db, 'admin_emails', 'sachinsirbooks@gmail.com'), {
          email: 'sachinsirbooks@gmail.com',
          createdAt: serverTimestamp()
        }, { merge: true });
        console.log('  Master admin email registered in admin_emails');
      } catch (e) {
        console.error('  Failed to register master admin email:', e);
      }

      // 7. Seed Banners
      console.log('Step 7/7: Seeding default banners...');
      try {
        const existingBans = await storeService.getBanners();
        if (existingBans.length === 0) {
          const SAMPLE_BANNERS = [
            {
              title: 'Master Mathematics with Sachin Sir',
              imageUrl: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=1200',
              mobileImageUrl: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=600',
              link: '/category/sachin-dhawale-publication',
              order: 1,
              active: true
            },
            {
              title: 'TCS & IBPS Pattern Reasoning Books',
              imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=1200',
              mobileImageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=600',
              link: '/category/mpsc-books',
              order: 2,
              active: true
            }
          ];
          for (const banner of SAMPLE_BANNERS) {
            await addDoc(collection(db, 'banners'), {
              ...banner,
              createdAt: serverTimestamp()
            });
            console.log(`  Seeded banner: ${banner.title}`);
          }
        } else {
          console.log('  Banners already exist, skipping banner seed.');
        }
      } catch (e) {
        console.error('  Failed to seed banners:', e);
      }

      // 8. Seed Study Sets (Combos and Batches)
      console.log('Step 8/8: Seeding default Study Sets & Combos...');
      try {
        const existingSets = await storeService.getStudySets();
        if (existingSets.length === 0) {
          const freshBooks = await storeService.getBooks();
          const isbnToIdMap: Record<string, string> = {};
          freshBooks.forEach(b => {
            if (b.isbn) isbnToIdMap[b.isbn] = b.id;
          });

          const mapIsbnsToIds = (isbns: string[]) => {
            return isbns.map(isbn => isbnToIdMap[isbn]).filter(Boolean);
          };

          const DEFAULT_STUDY_SETS: Omit<StudySet, 'id'>[] = [
            {
              title: 'MPPSC Complete Officer Combo',
              description: 'The master conceptual setup specifically matching MPPSC state services. Complete guide series structured by standard Pune academy teachers.',
              price: 850,
              originalPrice: 1320,
              discount: 35,
              imageUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400',
              bookIds: mapIsbnsToIds(['SDP-MATH-01', 'SDP-REAS-02', 'SDP-CSAT-03']),
              isFeatured: true,
              category: 'MPSC',
              topLabel: 'MPPSC SUPER COMBO',
              statusBadge: 'Best Seller',
              stats: '5.2K Students',
              type: 'combo',
              createdAt: new Date().toISOString()
            },
            {
              title: 'PSI / STI / ASO Combine Batch Set',
              description: 'Specialized curriculum bundle mapping directly to standard MPSC PSI-STI combined recruitment exam guidelines.',
              price: 780,
              originalPrice: 1300,
              discount: 40,
              imageUrl: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=400',
              bookIds: mapIsbnsToIds(['SDP-MATH-01', 'SDP-REAS-02']),
              isFeatured: true,
              category: 'MPSC',
              topLabel: 'MPSC COMBINE FOCUS',
              statusBadge: 'Exam Favorite',
              stats: '4.8K Enrolled',
              type: 'batch',
              createdAt: new Date().toISOString()
            },
            {
              title: 'MPSC Rajyaseva CSAT Elite Batch Set',
              description: 'Score-maximizing CSAT workbook package tailored with advanced analytical reasoning & state services guidelines.',
              price: 899,
              originalPrice: 1460,
              discount: 38,
              imageUrl: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=400',
              bookIds: mapIsbnsToIds(['SDP-MATH-01', 'SDP-REAS-02', 'SDP-CSAT-03']),
              isFeatured: true,
              category: 'MPSC',
              topLabel: 'CSAT SPECIALIST',
              statusBadge: 'Popular',
              stats: '3.2K Enrolled',
              type: 'batch',
              createdAt: new Date().toISOString()
            },
            {
              title: 'Saral Seva Batch Package Set',
              description: 'TCS/IBPS syllabus-structured comprehensive preparation bundle for Talathi, ZP, Gramsevak and clerk exam recruits.',
              price: 830,
              originalPrice: 1490,
              discount: 44,
              imageUrl: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=400',
              bookIds: mapIsbnsToIds(['SDP-PB-04', 'SDP-TB-05', 'LKP-MAR-01']),
              isFeatured: true,
              category: 'Police Bharti',
              topLabel: 'TCS/IBPS SPEED SET',
              statusBadge: 'Highly Rated',
              stats: '6.2K Enrolled',
              type: 'batch',
              createdAt: new Date().toISOString()
            }
          ];

          for (const studySet of DEFAULT_STUDY_SETS) {
            await addDoc(collection(db, STUDY_SETS_COLLECTION), studySet);
          }
          console.log('  Seeded default Study Sets and Combo Offers.');
        } else {
          console.log('  Study Sets already exist, skipping study set seed.');
        }
      } catch (e) {
        console.error('  Failed to seed Study Sets:', e);
      }

      console.log('Seed operations completed successfully.');
      return true;
    } catch (err) {
      console.error('Critical failure in seed operation:', err);
      throw err;
    }
  },

  // Clear seed/database data
  async clearAllData() {
    console.log('Starting clear database operations...');
    const collectionsToClear = [
      BOOKS_COLLECTION,
      CATEGORIES_COLLECTION,
      SUBJECTS_COLLECTION,
      BANNERS_COLLECTION,
      'coupons',
      'visual_tiles',
      'leads',
      ORDERS_COLLECTION,
      'studySets'
    ];
    
    interface ClearResult {
      colName: string;
      cleared: number;
      error?: string;
    }
    const results: ClearResult[] = [];
    
    for (const colName of collectionsToClear) {
      try {
        const snapshot = await getDocs(collection(db, colName));
        let clearedCount = 0;
        
        const deletePromises = snapshot.docs.map(async (document) => {
          try {
            await deleteDoc(doc(db, colName, document.id));
            clearedCount++;
          } catch (docErr: any) {
            console.error(`Failed to delete document ${document.id} in ${colName}:`, docErr);
            throw docErr;
          }
        });
        
        await Promise.all(deletePromises);
        results.push({ colName, cleared: clearedCount });
        console.log(`Successfully processed collection: ${colName}`);
      } catch (colErr: any) {
        console.error(`Error reading/clearing collection ${colName}:`, colErr);
        results.push({ colName, cleared: 0, error: colErr.message || String(colErr) });
      }
    }
    
    // Also try to delete custom sample users user_1 and user_2 if they exist
    const sampleUsers = ['user_1', 'user_2'];
    for (const uid of sampleUsers) {
      try {
        const userDocRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          try {
            await deleteDoc(userDocRef);
          } catch (err: any) {
             console.warn(`Could not delete sample user ${uid}:`, err);
          }
        }
      } catch (err) {
        // user collection may have strict permission filters
      }
    }

    return results;
  },

  // Coupons
  async getCoupons() {
    const q = query(collection(db, 'coupons'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async addCoupon(coupon: any) {
    return await addDoc(collection(db, 'coupons'), {
      ...coupon,
      createdAt: coupon.createdAt || new Date().toISOString()
    });
  },

  async deleteCoupon(id: string) {
    return await deleteDoc(doc(db, 'coupons', id));
  },

  // Visual Tiles
  async getVisualTiles() {
    const q = query(collection(db, 'visual_tiles'), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async addVisualTile(tile: any) {
    return await addDoc(collection(db, 'visual_tiles'), tile);
  },

  async updateVisualTile(id: string, updates: any) {
    return await updateDoc(doc(db, 'visual_tiles', id), updates);
  },

  async deleteVisualTile(id: string) {
    return await deleteDoc(doc(db, 'visual_tiles', id));
  },

  // Kobo Offers
  async getKoboOffers() {
    const q = query(collection(db, KOBO_OFFERS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KoboOffer));
  },
  async addKoboOffer(offer: Omit<KoboOffer, 'id'>) {
    return await addDoc(collection(db, KOBO_OFFERS_COLLECTION), {
      ...offer,
      createdAt: offer.createdAt || new Date().toISOString()
    });
  },
  async updateKoboOffer(id: string, updates: Partial<KoboOffer>) {
    return await updateDoc(doc(db, KOBO_OFFERS_COLLECTION, id), updates);
  },
  async deleteKoboOffer(id: string) {
    return await deleteDoc(doc(db, KOBO_OFFERS_COLLECTION, id));
  },

  // Study Sets
  async getStudySets() {
    const q = query(collection(db, STUDY_SETS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudySet));
  },
  async addStudySet(studySet: Omit<StudySet, 'id'>) {
    return await addDoc(collection(db, STUDY_SETS_COLLECTION), {
      ...studySet,
      createdAt: studySet.createdAt || new Date().toISOString()
    });
  },
  async updateStudySet(id: string, updates: Partial<StudySet>) {
    return await updateDoc(doc(db, STUDY_SETS_COLLECTION, id), updates);
  },
  async deleteStudySet(id: string) {
    return await deleteDoc(doc(db, STUDY_SETS_COLLECTION, id));
  },

  // Publishers
  async getPublishers() {
    const q = query(collection(db, PUBLISHERS_COLLECTION), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Publisher));
  },
  async addPublisher(publisher: Omit<Publisher, 'id'>) {
    return await addDoc(collection(db, PUBLISHERS_COLLECTION), {
      ...publisher,
      createdAt: new Date().toISOString()
    });
  },
  async updatePublisher(id: string, updates: Partial<Publisher>) {
    return await updateDoc(doc(db, PUBLISHERS_COLLECTION, id), updates);
  },
  async deletePublisher(id: string) {
    return await deleteDoc(doc(db, PUBLISHERS_COLLECTION, id));
  }
};
