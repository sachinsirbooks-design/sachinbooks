import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Layout, 
  Box, 
  ListOrdered, 
  Users, 
  Plus, 
  TrendingUp,
  Settings,
  Image as ImageIcon,
  LogOut,
  ChevronRight,
  BookOpen,
  Trash2,
  Edit,
  Save,
  X as CloseIcon,
  ExternalLink,
  ShieldCheck,
  Tag,
  Globe,
  Share2,
  DollarSign,
  ShoppingCart,
  Mail,
  Calendar,
  Download,
  Percent,
  Grid,
  CreditCard,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { pdfService } from '../services/pdfService';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart, 
  Pie
} from 'recharts';
import { cn, getDriveImageUrl, formatPrice } from '../lib/utils';
import { storeService } from '../services/storeService';
import { Banner, Book, Category, AppSettings, Order, Subject, KoboOffer, StudySet, Publisher } from '../types';
import toast from 'react-hot-toast';
import CourierLabelModal from '../components/CourierLabelModal';

export default function AdminDashboard() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  
  const [activeTab, setActiveTab] = React.useState('overview');
  const [banners, setBanners] = React.useState<Banner[]>([]);
  const [books, setBooks] = React.useState<Book[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [admins, setAdmins] = React.useState<{id: string, email: string}[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [payments, setPayments] = React.useState<any[]>([]);
  const [failedPayments, setFailedPayments] = React.useState<any[]>([]);
  const [paymentLogs, setPaymentLogs] = React.useState<any[]>([]);
  const [paymentSearch, setPaymentSearch] = React.useState('');
  const [paymentFilter, setPaymentFilter] = React.useState('all');
  const [isProcessingRefund, setIsProcessingRefund] = React.useState<string | null>(null);
  const [users, setUsers] = React.useState<any[]>([]);
  const [settings, setSettings] = React.useState<AppSettings | null>(null);
  
  const [isBannerModalOpen, setIsBannerModalOpen] = React.useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = React.useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = React.useState(false);

  const [editingBanner, setEditingBanner] = React.useState<Partial<Banner> | null>(null);
  const [editingBook, setEditingBook] = React.useState<Partial<Book> | null>(null);
  const [editingCategory, setEditingCategory] = React.useState<Partial<Category> | null>(null);
  const [editingSubject, setEditingSubject] = React.useState<Partial<Subject> | null>(null);
  const [staffEmail, setStaffEmail] = React.useState('');

  const [isSubjectModalOpen, setIsSubjectModalOpen] = React.useState(false);

  const [stats, setStats] = React.useState({ totalProducts: 0, totalOrders: 0, revenue: 0 });
  const [isSavingSettings, setIsSavingSettings] = React.useState(false);

  const [tiles, setTiles] = React.useState<any[]>([]);
  const [newTile, setNewTile] = React.useState({ name: '', slug: '', emoji: '📚', order: 1, googleDriveUrl: '' });
  const [isSubmittingTile, setIsSubmittingTile] = React.useState(false);

  const [coupons, setCoupons] = React.useState<any[]>([]);
  const [newCoupon, setNewCoupon] = React.useState({ code: '', discountType: 'percentage', discountValue: 10, minCartValue: 0, isPublic: true, active: true });
  const [isSubmittingCoupon, setIsSubmittingCoupon] = React.useState(false);
  const [selectedLabelOrder, setSelectedLabelOrder] = React.useState<Order | null>(null);

  const [koboOffers, setKoboOffers] = React.useState<KoboOffer[]>([]);
  const [editingKoboOffer, setEditingKoboOffer] = React.useState<Partial<KoboOffer> | null>(null);
  const [isKoboOfferModalOpen, setIsKoboOfferModalOpen] = React.useState(false);

  const [studySets, setStudySets] = React.useState<StudySet[]>([]);
  const [editingStudySet, setEditingStudySet] = React.useState<Partial<StudySet> | null>(null);
  const [isStudySetModalOpen, setIsStudySetModalOpen] = React.useState(false);

  const [publishers, setPublishers] = React.useState<Publisher[]>([]);
  const [editingPublisher, setEditingPublisher] = React.useState<Partial<Publisher> | null>(null);
  const [isPublisherModalOpen, setIsPublisherModalOpen] = React.useState(false);

  const { logout, profile, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    if (activeTab === 'overview') {
      fetchStats();
      fetchOrders();
      fetchBanners();
      fetchBooks();
      fetchCategories();
      fetchSubjects();
    }
    if (activeTab === 'banners') {
      fetchBanners();
    }
    if (activeTab === 'books') {
      fetchBooks();
    }
    if (activeTab === 'categories') {
      fetchCategories();
    }
    if (activeTab === 'subjects') {
      fetchSubjects();
    }
    if (activeTab === 'koboOffers') {
      fetchKoboOffers();
      fetchCategories();
      fetchBooks();
    }
    if (activeTab === 'studySets') {
      fetchStudySets();
      fetchBooks();
    }
    if (activeTab === 'publications') {
      fetchPublishers();
    }
    if (activeTab === 'settings') {
      fetchSettings();
    }
    if (activeTab === 'staff') {
      fetchStaff();
    }
    if (activeTab === 'users') {
      fetchUsers();
    }
    if (activeTab === 'tiles') {
      fetchTiles();
    }
    if (activeTab === 'coupons') {
      fetchCoupons();
    }
    if (activeTab === 'payments') {
      fetchPaymentsData();
    }
  };

  const fetchPaymentsData = async () => {
    try {
      const p = await storeService.getPayments();
      const fp = await storeService.getFailedPayments();
      const pl = await storeService.getPaymentLogs();
      setPayments(p);
      setFailedPayments(fp);
      setPaymentLogs(pl);
    } catch (err: any) {
      console.error("Failed to fetch payments data", err);
      toast.error("Failed to load payments details");
    }
  };

  const testRazorpayConnection = async () => {
    if (!settings?.razorpay?.keyId || !settings?.razorpay?.keySecret) {
      toast.error('Razorpay credentials missing');
      return;
    }

    const testToast = toast.loading('Testing Razorpay connection...');
    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyId: settings.razorpay.keyId,
          keySecret: settings.razorpay.keySecret,
        }),
      });

      if (response.ok) {
        toast.success('Razorpay connection successful!', { id: testToast });
      } else {
        const error = await response.json();
        toast.error(`Connection failed: ${error.error}`, { id: testToast });
      }
    } catch (err) {
      toast.error('Connection test failed', { id: testToast });
    }
  };

  const fetchStats = async () => {
    try {
      const data = await storeService.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await storeService.getOrders();
      setOrders(data);
    } catch (err) {
      toast.error('Failed to fetch orders');
    }
  };

  const fetchBanners = async () => {
    try {
      const data = await storeService.getBanners(true);
      setBanners(data);
    } catch (err) {
      toast.error('Failed to fetch banners');
    }
  };

  const fetchBooks = async () => {
    try {
      const data = await storeService.getBooks();
      setBooks(data);
    } catch (err) {
      toast.error('Failed to fetch books');
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await storeService.getCategories();
      setCategories(data);
    } catch (err) {
      toast.error('Failed to fetch categories');
    }
  };

  const fetchSubjects = async () => {
    try {
      const data = await storeService.getSubjects();
      setSubjects(data);
    } catch (err) {
      toast.error('Failed to fetch subjects');
    }
  };

  const fetchStaff = async () => {
    try {
      const data = await storeService.getAdmins();
      setAdmins(data);
    } catch (err) {
      toast.error('Failed to fetch staff');
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await storeService.getUsers();
      setUsers(data);
    } catch (err) {
      toast.error('Failed to fetch users');
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await storeService.getSettings();
      if (data) {
        if (data.razorpay) {
          data.razorpay.keySecret = (data.razorpay as any).encryptedKeySecret ? '••••••••••••••••' : '';
          data.razorpay.webhookSecret = (data.razorpay as any).encryptedWebhookSecret ? '••••••••••••••••' : '';
        }
        setSettings(data);
      } else {
        // Initialize default settings if none exist
        const initialSettings: Omit<AppSettings, 'id'> = {
          logoUrl: '',
          socialLinks: { whatsapp: '', facebook: '', instagram: '', youtube: '', twitter: '' },
          seo: { title: 'Sachin Sir Books', description: '', keywords: '' },
          founder: { name: 'Sachin Dhawale', tagline: '', description: '', imageUrl: '' },
          whatsappChatbot: { phoneNumber: '', message: 'Hi, I am interested in your books.', enabled: true },
          razorpay: { enabled: false, testMode: true, keyId: '', keySecret: '', webhookSecret: '' },
          imageSettings: {
            bannerDesktop: { width: 1920, height: 700 },
            bannerMobile: { width: 768, height: 1000 },
            bookThumbnail: { width: 800, height: 1200 },
            maxFileSizeMB: 5
          }
        };
        await storeService.createSettings(initialSettings);
        setSettings({ id: 'site_settings', ...initialSettings });
      }
    } catch (err) {
      toast.error('Failed to fetch settings');
    }
  };

  const fetchKoboOffers = async () => {
    try {
      const data = await storeService.getKoboOffers();
      setKoboOffers(data);
    } catch (err) {
      toast.error('Failed to fetch Kobo offers');
    }
  };

  const fetchStudySets = async () => {
    try {
      const data = await storeService.getStudySets();
      setStudySets(data);
    } catch (err) {
      toast.error('Failed to fetch Study Sets');
    }
  };

  const fetchPublishers = async () => {
    try {
      const data = await storeService.getPublishers();
      setPublishers(data);
    } catch (err) {
      toast.error('Failed to fetch Publishers');
    }
  };

  const handleRefund = async (paymentId: string, orderId: string, amount: number) => {
    if (!window.confirm(`Are you sure you want to refund this payment of ${formatPrice(amount)}? This will initiate a total refund in Razorpay Test Mode and cancel the associated order.`)) {
      return;
    }
    setIsProcessingRefund(paymentId);
    try {
      const resp = await fetch('/api/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, orderId, amount })
      });
      const data = await resp.json();
      if (resp.ok) {
        toast.success(`Refund successful! Razorpay Refund ID: ${data.refundId || 'N/A'}`);
        await fetchPaymentsData();
        await fetchOrders();
      } else {
        throw new Error(data.error || "Refund request rejected");
      }
    } catch (err: any) {
      toast.error(err.message || 'Refund process failed');
    } finally {
      setIsProcessingRefund(null);
    }
  };

  const deleteBanner = async (id: string) => {
    console.log("Delete banner trigger - auth.currentUser?.email:", user?.email);
    console.log("Delete banner trigger - isAdmin status:", isAdmin);
    if (!window.confirm('Delete this banner?')) return;
    try {
      await storeService.deleteBanner(id);
      toast.success('Banner deleted');
      fetchBanners();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner?.imageUrl) return;
    try {
      if (editingBanner.id) {
        await storeService.updateBanner(editingBanner.id, editingBanner);
        toast.success('Banner updated');
      } else {
        await storeService.addBanner(editingBanner as Omit<Banner, 'id'>);
        toast.success('Banner added');
      }
      setIsBannerModalOpen(false);
      setEditingBanner(null);
      fetchBanners();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return;
    try {
      if (editingCategory.id) {
        await storeService.updateCategory(editingCategory.id, editingCategory);
        toast.success('Category updated');
      } else {
        const slug = editingCategory.name.toLowerCase().replace(/\s+/g, '-');
        await storeService.addCategory({ ...editingCategory, slug } as Omit<Category, 'id'>);
        toast.success('Category added');
      }
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    console.log("Delete category trigger - auth.currentUser?.email:", user?.email);
    console.log("Delete category trigger - isAdmin status:", isAdmin);
    if (!window.confirm('Delete this category?')) return;
    try {
      await storeService.deleteCategory(id);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  // Publisher Handlers
  const handlePublisherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPublisher?.name) return;
    try {
      if (editingPublisher.id) {
        await storeService.updatePublisher(editingPublisher.id, editingPublisher);
        toast.success('Publisher updated');
      } else {
        await storeService.addPublisher(editingPublisher as Omit<Publisher, 'id'>);
        toast.success('Publisher added');
      }
      setIsPublisherModalOpen(false);
      setEditingPublisher(null);
      fetchPublishers();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleDeletePublisher = async (id: string) => {
    if (!window.confirm('Delete this publisher?')) return;
    try {
      await storeService.deletePublisher(id);
      toast.success('Publisher deleted');
      fetchPublishers();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  // Kobo Offer Handlers
  const handleKoboOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKoboOffer?.name || !editingKoboOffer.discountAmount || !editingKoboOffer.minQuantity) return;
    try {
      if (editingKoboOffer.id) {
        await storeService.updateKoboOffer(editingKoboOffer.id, editingKoboOffer);
        toast.success('Offer updated');
      } else {
        await storeService.addKoboOffer({
          name: editingKoboOffer.name,
          enabled: editingKoboOffer.enabled ?? true,
          minQuantity: Number(editingKoboOffer.minQuantity),
          discountAmount: Number(editingKoboOffer.discountAmount),
          applicableCategorySlugs: editingKoboOffer.applicableCategorySlugs ?? [],
          applicableBookIds: editingKoboOffer.applicableBookIds ?? [],
          expiryDate: editingKoboOffer.expiryDate ?? '',
          stackable: editingKoboOffer.stackable ?? false,
          autoApply: editingKoboOffer.autoApply ?? true,
        } as Omit<KoboOffer, 'id'>);
        toast.success('Offer added');
      }
      setIsKoboOfferModalOpen(false);
      setEditingKoboOffer(null);
      fetchKoboOffers();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleDeleteKoboOffer = async (id: string) => {
    if (!window.confirm('Delete this combo offer?')) return;
    try {
      await storeService.deleteKoboOffer(id);
      toast.success('Offer deleted');
      fetchKoboOffers();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  // Study Set Handlers
  const handleStudySetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudySet?.title || !editingStudySet.price) return;
    try {
      if (editingStudySet.id) {
        await storeService.updateStudySet(editingStudySet.id, {
          ...editingStudySet,
          type: editingStudySet.type || 'batch'
        });
        toast.success('Study Set updated');
      } else {
        await storeService.addStudySet({
          title: editingStudySet.title,
          description: editingStudySet.description || '',
          price: Number(editingStudySet.price),
          originalPrice: Number(editingStudySet.originalPrice || editingStudySet.price),
          discount: Number(editingStudySet.discount || 0),
          imageUrl: editingStudySet.imageUrl || '',
          bookIds: editingStudySet.bookIds || [],
          isFeatured: editingStudySet.isFeatured ?? true,
          category: editingStudySet.category || 'MPSC',
          topLabel: editingStudySet.topLabel || 'SPECIAL STUDY SET',
          statusBadge: editingStudySet.statusBadge || 'Best Seller',
          stats: editingStudySet.stats || '4.5K Students',
          type: editingStudySet.type || 'batch',
        } as Omit<StudySet, 'id'>);
        toast.success('Study Set added');
      }
      setIsStudySetModalOpen(false);
      setEditingStudySet(null);
      fetchStudySets();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleDeleteStudySet = async (id: string) => {
    if (!window.confirm('Delete this study set?')) return;
    try {
      await storeService.deleteStudySet(id);
      toast.success('Study Set deleted');
      fetchStudySets();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBook?.id) {
        await storeService.updateBook(editingBook.id, editingBook);
        toast.success('Book updated');
      } else {
        await storeService.addBook(editingBook as Omit<Book, 'id'>);
        toast.success('Book added');
      }
      setIsBookModalOpen(false);
      setEditingBook(null);
      fetchBooks();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffEmail) return;
    try {
      await storeService.addAdmin(staffEmail);
      toast.success('Staff access granted');
      setStaffEmail('');
      setIsStaffModalOpen(false);
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!window.confirm('Revoke staff access?')) return;
    try {
      await storeService.removeAdmin(id);
      toast.success('Access revoked');
      fetchStaff();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSavingSettings(true);
    try {
      // 1. Split out and securely save Razorpay credentials to the backend API
      const rzpConfig = settings.razorpay || { enabled: false, testMode: true, keyId: '' };
      const rzpSaveResp = await fetch('/api/save-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: rzpConfig.enabled,
          testMode: rzpConfig.testMode,
          keyId: rzpConfig.keyId,
          keySecret: rzpConfig.keySecret || '',
          webhookSecret: rzpConfig.webhookSecret || '',
        }),
      });

      if (!rzpSaveResp.ok) {
        throw new Error('Failed to save Razorpay configuration securely on the server.');
      }

      const rzpEncObj = await rzpSaveResp.json();

      // 2. Prepare a sanitized settings object to persist on the frontend database (no plaintext secrets)
      const publicSettings = { ...settings };
      if (publicSettings.razorpay) {
        // Store the server-encrypted keys in our public settings document on Firestore
        (publicSettings.razorpay as any).encryptedKeySecret = rzpEncObj.encryptedKeySecret || '';
        (publicSettings.razorpay as any).encryptedWebhookSecret = rzpEncObj.encryptedWebhookSecret || '';

        // Delete raw secret properties so they never get written plain to the public document
        delete (publicSettings.razorpay as any).keySecret;
        delete (publicSettings.razorpay as any).webhookSecret;
      }

      await storeService.updateSettings(publicSettings);

      // 3. Set standard bullet placeholders in state so password fields look correctly populated
      setSettings(prev => {
        if (!prev) return null;
        return {
          ...prev,
          razorpay: {
            ...prev.razorpay,
            enabled: rzpConfig.enabled,
            testMode: rzpConfig.testMode,
            keyId: rzpConfig.keyId,
            keySecret: rzpConfig.keySecret ? '••••••••••••••••' : '',
            webhookSecret: rzpConfig.webhookSecret ? '••••••••••••••••' : '',
          } as any
        };
      });

      toast.success('Settings updated and secured successfully!');
    } catch (err: any) {
      console.error("Save settings error:", err);
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleUpdatePublicationPriorities = async (newPriorities: string[]) => {
    if (!settings) return;
    try {
      await storeService.updateSettings({ publicationPriorities: newPriorities });
      setSettings(prev => prev ? { ...prev, publicationPriorities: newPriorities } : null);
      toast.success('Publication priorities updated');
    } catch (err) {
      toast.error('Failed to update priorities');
    }
  };

  const handleDeleteBook = async (id: string) => {
    console.log("Delete book trigger - auth.currentUser?.email:", user?.email);
    console.log("Delete book trigger - isAdmin status:", isAdmin);
    if (!window.confirm('Delete this book?')) return;
    try {
      await storeService.deleteBook(id);
      toast.success('Book deleted');
      fetchBooks();
    } catch (err: any) {
      console.error('Delete book error:', err);
      toast.error(`Delete failed: ${err?.message || String(err)}`);
    }
  };

  const handleDeleteAllBooks = async () => {
    console.log("Delete ALL books trigger - auth.currentUser?.email:", user?.email);
    console.log("Delete ALL books trigger - isAdmin status:", isAdmin);
    if (!window.confirm('WARNING: Are you sure you want to delete ALL books at once? This action is IRREVERSIBLE.')) return;
    const deleteToast = toast.loading('Deleting all books...');
    try {
      const deletedCount = await storeService.deleteAllBooks();
      toast.success(`Successfully deleted all ${deletedCount} books!`, { id: deleteToast });
      fetchBooks();
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to delete all books: ${err?.message || String(err)}`, { id: deleteToast });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSeedData = async () => {
    if (!window.confirm('This will seed the database with sample data. Continue?')) return;
    const seedToast = toast.loading('Seeding data...');
    try {
       await storeService.seedSampleData();
       toast.success('Sample data seeded successfully!', { id: seedToast });
       loadData();
    } catch (err: any) {
       console.error('Seeding failed error:', err);
       toast.error(`Seeding failed: ${err?.message || String(err)}`, { id: seedToast });
    }
  };

  const handleDeleteSeedData = async () => {
    if (!window.confirm('WARNING: This will delete ALL books, categories, subjects, banners, coupons, and visual tiles. This action is IRREVERSIBLE. Are you sure?')) return;
    const deleteToast = toast.loading('Clearing database...');
    try {
      const results = await storeService.clearAllData();
      
      const failed = results.filter((r: any) => r.error);
      const succeeded = results.filter((r: any) => r.cleared > 0);
      const totalDeletedCount = results.reduce((sum: number, r: any) => sum + r.cleared, 0);

      if (failed.length > 0) {
        console.warn('Database cleared with some non-critical failures:', failed);
        const failNames = failed.map((f: any) => f.colName).join(', ');
        toast.success(`Cleared ${totalDeletedCount} items from succeeded hubs! (Skipped empty or restricted: ${failNames})`, { 
          id: deleteToast,
          duration: 5000 
        });
      } else {
        toast.success(`Database cleared successfully! Deleted ${totalDeletedCount} total documents.`, { id: deleteToast });
      }
      
      loadData();
    } catch (err: any) {
      console.error('Error in handleDeleteSeedData:', err);
      const errMsg = err?.message || 'Clearing database failed';
      toast.error(`Clearing database failed: ${errMsg}`, { id: deleteToast });
    }
  };

  const fetchTiles = async () => {
    try {
      const data = await storeService.getVisualTiles();
      setTiles(data);
    } catch (e) {
      toast.error('Failed to load visual tiles');
    }
  };

  const fetchCoupons = async () => {
    try {
      const data = await storeService.getCoupons();
      setCoupons(data);
    } catch (e) {
      toast.error('Failed to load coupons');
    }
  };

  const handleAddTile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTile.name || !newTile.slug) {
      toast.error('Name and Slug are required');
      return;
    }
    setIsSubmittingTile(true);
    try {
      await storeService.addVisualTile({
        name: newTile.name,
        slug: newTile.slug.toLowerCase().replace(/\s+/g, '-'),
        emoji: newTile.emoji,
        order: Number(newTile.order),
        googleDriveUrl: newTile.googleDriveUrl || ''
      });
      toast.success('Visual category tile added!');
      setNewTile({ name: '', slug: '', emoji: '📚', order: tiles.length + 1, googleDriveUrl: '' });
      fetchTiles();
    } catch (err) {
      toast.error('Failed to add tile');
    } finally {
      setIsSubmittingTile(false);
    }
  };

  const handleDeleteTile = async (id: string) => {
    if (!window.confirm('Delete this visual category tile?')) return;
    try {
      await storeService.deleteVisualTile(id);
      toast.success('Tile deleted');
      fetchTiles();
    } catch (err) {
      toast.error('Failed to delete tile');
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code) {
      toast.error('Coupon code is required');
      return;
    }
    setIsSubmittingCoupon(true);
    try {
      await storeService.addCoupon({
        code: newCoupon.code.toUpperCase().trim(),
        discountType: newCoupon.discountType,
        discountValue: Number(newCoupon.discountValue),
        minCartValue: Number(newCoupon.minCartValue),
        isPublic: Boolean(newCoupon.isPublic),
        active: Boolean(newCoupon.active)
      });
      toast.success('Coupon created successfully!');
      setNewCoupon({ code: '', discountType: 'percentage', discountValue: 10, minCartValue: 0, isPublic: true, active: true });
      fetchCoupons();
    } catch (err) {
      toast.error('Failed to create coupon');
    } finally {
      setIsSubmittingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await storeService.deleteCoupon(id);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (err) {
      toast.error('Failed to delete coupon');
    }
  };

  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject?.name) return;
    try {
      if (editingSubject.id) {
        await storeService.updateSubject(editingSubject.id, editingSubject);
        toast.success('Subject updated');
      } else {
        const slug = editingSubject.name.toLowerCase().replace(/\s+/g, '-');
        await storeService.addSubject({ ...editingSubject, slug } as Omit<Subject, 'id'>);
        toast.success('Subject added');
      }
      setIsSubjectModalOpen(false);
      setEditingSubject(null);
      fetchSubjects();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm('Delete this subject?')) return;
    try {
      await storeService.deleteSubject(id);
      toast.success('Subject deleted');
      fetchSubjects();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex font-sans relative">
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-20 bg-neutral-950 text-white z-[60] flex items-center justify-between px-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white"
          >
            <Layout size={20} />
          </button>
          <span className="font-display font-bold text-lg leading-tight uppercase">Dashboard</span>
        </div>
        <Link to="/" className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-black">
          <ShoppingCart size={18} />
        </Link>
      </div>

      {/* Sidebar - Desktop and Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "bg-neutral-950 text-white p-6 lg:p-8 flex flex-col z-[80] transition-all duration-500",
        "fixed inset-y-0 left-0 w-80 lg:relative lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-black">
                <BookOpen size={24} />
            </div>
            <div className="flex flex-col">
                <span className="font-display font-bold text-xl leading-tight">ADMIN HUB</span>
                <span className="text-[9px] font-black tracking-[0.3em] uppercase text-amber-500 -mt-0.5">Control System v4</span>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <nav className="space-y-2 flex-1 overflow-y-auto">
         {[
            { id: 'overview', icon: <Layout size={20} />, label: 'Overview' },
            { id: 'orders', icon: <ListOrdered size={20} />, label: 'Orders' },
            { id: 'payments', icon: <CreditCard size={20} />, label: 'Payments' },
            { id: 'books', icon: <Box size={20} />, label: 'Books' },
            { id: 'categories', icon: <Tag size={20} />, label: 'Categories' },
            { id: 'subjects', icon: <BookOpen size={20} />, label: 'Subjects' },
            { id: 'koboOffers', icon: <Percent size={20} />, label: 'Kobo Offers' },
            { id: 'studySets', icon: <Grid size={20} />, label: 'Study Sets' },
            { id: 'banners', icon: <ImageIcon size={20} />, label: 'Banners' },
            { id: 'tiles', icon: <Grid size={20} />, label: 'Visual Tiles' },
            { id: 'coupons', icon: <Percent size={20} />, label: 'Coupons' },
            { id: 'publications', icon: <Globe size={20} />, label: 'Publishers & Priorities' },
            { id: 'staff', icon: <ShieldCheck size={20} />, label: 'Staff' },
            { id: 'settings', icon: <Settings size={20} />, label: 'Settings' },
            { id: 'users', icon: <Users size={20} />, label: 'Customers' },
         ].map(item => (
            <button 
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl transition-all group",
                activeTab === item.id ? "bg-amber-500 text-black shadow-lg shadow-amber-500/10" : "text-neutral-500 hover:bg-white/5 hover:text-white"
              )}
            >
              <div className="flex items-center gap-4">
                {item.icon}
                <span className="font-display font-bold text-[11px] lg:text-sm uppercase tracking-wider">{item.label}</span>
              </div>
              <ChevronRight size={14} className={cn("transition-transform", activeTab === item.id ? "rotate-90" : "")} />
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-10">
           <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/5">
              <div className="flex items-center gap-3 mb-3">
                 <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold">
                    AD
                 </div>
                 <div>
                    <p className="text-xs font-bold text-white uppercase">{profile?.name || 'Administrator'}</p>
                    <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest">Master Auth</p>
                 </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 bg-rose-500/10 text-rose-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm"
              >
                <LogOut size={14} /> Exit System
              </button>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 pt-24 lg:pt-12 overflow-y-auto min-w-0">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 lg:mb-12">
          <div>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-neutral-900 tracking-tight capitalize">
              {activeTab} <span className="hidden sm:inline">Management</span>
            </h1>
            <p className="text-[10px] md:text-sm text-neutral-400 font-sans font-medium uppercase tracking-[0.2em] mt-1">
              Sync: Online
            </p>
          </div>
          <div className="flex gap-2 sm:gap-4 flex-wrap">
             <button 
               onClick={handleSeedData}
               className="bg-amber-100 text-amber-700 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-display font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-amber-200 transition-all shadow-sm flex items-center gap-2"
             >
                <Plus size={16} /> Seed Data
             </button>
             <button 
               onClick={handleDeleteSeedData}
               className="bg-rose-50 text-rose-700 hover:bg-rose-100 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-display font-black text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 border border-rose-150-soft"
             >
                <Trash2 size={16} /> Clear Database
             </button>
             <button className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-neutral-200 text-neutral-400 hover:text-neutral-900 shadow-sm transition-all">
                <Settings size={18} className="md:w-5 md:h-5" />
             </button>
             <Link to="/" className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-neutral-950 text-white px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-display font-bold text-xs md:text-sm shadow-xl active:scale-95 transition-all">
                <ArrowLeft size={16} className="md:w-[18px] md:h-[18px]" /> <span className="uppercase">Store</span>
             </Link>
          </div>
        </header>

        {activeTab === 'banners' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl md:rounded-[2rem] border border-neutral-100 shadow-sm gap-4">
              <div>
                <h3 className="font-display font-bold text-xl">Banner Catalog</h3>
                <p className="text-[10px] text-neutral-400 font-sans uppercase tracking-widest mt-1">Manage home page rotating advertisements</p>
              </div>
              <button 
                onClick={() => {
                  setEditingBanner({ active: true, order: banners.length });
                  setIsBannerModalOpen(true);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-500 text-black px-6 py-3 rounded-xl font-display font-bold text-[10px] md:text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                <Plus size={16} /> New Banner
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {banners.map((banner) => (
                <div key={banner.id} className="bg-white rounded-2xl md:rounded-[2rem] border border-neutral-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col">
                  <div className="aspect-video bg-neutral-100 relative group">
                    <img 
                      src={getDriveImageUrl(banner.imageUrl)} 
                      alt={banner.title || 'Banner'} 
                      className="w-full h-full object-contain p-2"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="absolute bottom-4 right-4 flex gap-2">
                         <button 
                           onClick={() => {
                             setEditingBanner(banner);
                             setIsBannerModalOpen(true);
                           }}
                           className="flex items-center gap-2 bg-white text-neutral-950 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 transition-all shadow-xl active:scale-95"
                         >
                           <Edit size={14} /> Edit
                         </button>
                          <button 
                           onClick={() => {
                             if (banner.id) {
                               deleteBanner(banner.id);
                             } else {
                               toast.error('Cannot delete: Missing ID');
                             }
                           }}
                           className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl active:scale-95"
                         >
                           <Trash2 size={14} /> Delete
                         </button>
                      </div>
                    </div>
                    <div className={cn(
                      "absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg",
                      banner.active ? "bg-green-500 text-white" : "bg-neutral-500 text-white"
                    )}>
                      {banner.active ? 'Active' : 'Paused'}
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h4 className="font-display font-bold text-lg mb-2 line-clamp-1">{banner.title || 'Untitled Banner'}</h4>
                    <div className="flex items-center gap-2 text-xs text-neutral-400 font-sans mb-4">
                      <span className="font-black uppercase tracking-widest px-2 py-1 bg-neutral-50 rounded">Order: {banner.order}</span>
                    </div>
                    {banner.link && (
                      <div className="flex items-center gap-2 text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-auto">
                        <ExternalLink size={12} /> {banner.link}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {banners.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-50">
                  <ImageIcon size={48} className="mb-4 text-neutral-300" />
                  <p className="font-display font-bold tracking-widest uppercase text-xs">No banners found</p>
                </div>
              )}
            </div>

            {/* Modal */}
            <AnimatePresence>
              {isBannerModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsBannerModalOpen(false)}
                    className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
                  >
                    <div className="p-8 md:p-12">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-display font-bold uppercase italic tracking-tight">
                          {editingBanner?.id ? 'Edit Banner' : 'New Banner'}
                        </h3>
                        <button onClick={() => setIsBannerModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full">
                          <CloseIcon size={24} />
                        </button>
                      </div>

                      <form onSubmit={handleBannerSubmit} className="space-y-6">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Banner Title (Optional)</label>
                          <input 
                            type="text" 
                            value={editingBanner?.title || ''}
                            onChange={e => setEditingBanner(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                            placeholder="e.g. Summer Special Offer"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Desktop Banner Image URL</label>
                          <p className="text-[9px] text-amber-600 font-bold mb-2 uppercase tracking-widest">Recommended: {settings?.imageSettings?.bannerDesktop.width || 1920}x{settings?.imageSettings?.bannerDesktop.height || 700} px</p>
                          <input 
                            type="text" 
                            required
                            value={editingBanner?.imageUrl || ''}
                            onChange={e => setEditingBanner(prev => ({ ...prev, imageUrl: e.target.value }))}
                            className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                            placeholder="Paste your Drive share link for Desktop"
                          />
                          {editingBanner?.imageUrl && (
                            <div className="mt-4 p-2 bg-neutral-100 rounded-xl overflow-hidden aspect-video relative">
                               <img src={getDriveImageUrl(editingBanner.imageUrl)} className="w-full h-full object-contain" alt="Desktop Preview" />
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Mobile Banner Image URL (Optional)</label>
                          <p className="text-[9px] text-amber-600 font-bold mb-2 uppercase tracking-widest">Recommended: {settings?.imageSettings?.bannerMobile.width || 768}x{settings?.imageSettings?.bannerMobile.height || 1000} px</p>
                          <input 
                            type="text" 
                            value={editingBanner?.mobileImageUrl || ''}
                            onChange={e => setEditingBanner(prev => ({ ...prev, mobileImageUrl: e.target.value }))}
                            className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                            placeholder="Paste your Drive share link for Mobile"
                          />
                          {editingBanner?.mobileImageUrl && (
                            <div className="mt-4 p-2 bg-neutral-100 rounded-xl overflow-hidden aspect-[4/5] w-32 relative">
                               <img src={getDriveImageUrl(editingBanner.mobileImageUrl)} className="w-full h-full object-contain" alt="Mobile Preview" />
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Display Order</label>
                            <input 
                              type="number" 
                              value={editingBanner?.order || 0}
                              onChange={e => setEditingBanner(prev => ({ ...prev, order: parseInt(e.target.value) }))}
                              className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                            />
                          </div>
                          <div className="flex items-end pb-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={editingBanner?.active || false}
                                onChange={e => setEditingBanner(prev => ({ ...prev, active: e.target.checked }))}
                                className="w-5 h-5 accent-amber-500"
                              />
                              <span className="text-[10px] font-black uppercase tracking-widest">Mark as Active</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Redirect Link (Optional)</label>
                          <input 
                            type="text" 
                            value={editingBanner?.link || ''}
                            onChange={e => setEditingBanner(prev => ({ ...prev, link: e.target.value }))}
                            className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                            placeholder="e.g. /category/maths"
                          />
                        </div>

                        <button 
                          type="submit"
                          className="w-full bg-neutral-950 text-white py-5 rounded-2xl font-display font-bold uppercase tracking-widest shadow-xl shadow-neutral-900/10 active:scale-95 transition-all mt-4"
                        >
                          {editingBanner?.id ? 'Update Banner Settings' : 'Create Banner'}
                        </button>
                      </form>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {activeTab === 'books' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm gap-4">
              <div>
                <h3 className="font-display font-bold text-xl">Library Catalog</h3>
                <p className="text-xs text-neutral-400 font-sans uppercase tracking-widest mt-1">Manage books and stock levels</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleDeleteAllBooks}
                  className="flex items-center gap-2 bg-rose-50 text-rose-700 hover:bg-rose-105 border border-rose-150 px-5 py-3 rounded-xl font-display font-bold text-xs uppercase tracking-widest active:scale-95 transition-all"
                >
                  <Trash2 size={16} /> Delete All Books
                </button>
                <button 
                  onClick={() => {
                    setEditingBook({ status: 'In stock', price: 0, finalPrice: 0, stockQuantity: 0 });
                    setIsBookModalOpen(true);
                  }}
                  className="flex items-center gap-2 bg-amber-500 text-black px-6 py-3 rounded-xl font-display font-bold text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  <Plus size={16} /> Add Book
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map((book) => (
                <div key={book.id} className="bg-white rounded-[2rem] border border-neutral-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col">
                  <div className="aspect-[3/4] bg-neutral-100 relative">
                    <img 
                      src={getDriveImageUrl(book.imageUrl)} 
                      alt={book.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                       <h4 className="font-display font-bold text-base line-clamp-1 flex-1">{book.title}</h4>
                       <span className={cn(
                          "text-[8px] font-black uppercase px-2 py-0.5 rounded ml-2",
                          book.type === 'New' ? "bg-blue-50 text-blue-600" : "bg-neutral-100 text-neutral-600"
                       )}>
                          {book.type}
                       </span>
                    </div>
                    <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest mb-1">{book.category} / {book.subject}</p>
                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mb-4">ISBN: {book.isbn || 'N/A'}</p>
                    
                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-neutral-50 mb-4">
                      <div className="flex flex-col">
                         <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">Price</span>
                         <span className="font-display font-bold text-neutral-900">{formatPrice(book.finalPrice)}</span>
                      </div>
                      <div className="text-right">
                         <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest block">Available</span>
                         <span className={cn(
                           "text-[10px] font-bold",
                           book.stockQuantity > 5 ? "text-green-600" : "text-rose-600"
                         )}>
                           {book.stockQuantity} Copies
                         </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-neutral-100">
                      <button 
                        onClick={() => {
                          setEditingBook(book);
                          setIsBookModalOpen(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-neutral-100 text-neutral-800 hover:bg-amber-100 hover:text-amber-900 rounded-xl text-xs font-bold transition-all uppercase tracking-wider"
                      >
                        <Edit size={12} /> Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteBook(book.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-500 hover:text-white rounded-xl text-xs font-bold transition-all uppercase tracking-wider"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Book Modal (Simplified) */}
            <AnimatePresence>
              {isBookModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsBookModalOpen(false)}
                    className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
                  >
                    <div className="p-8 md:p-12 max-h-[90vh] overflow-y-auto">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-display font-bold uppercase italic tracking-tight">
                          {editingBook?.id ? 'Edit Book' : 'New Book'}
                        </h3>
                        <button onClick={() => setIsBookModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full">
                          <CloseIcon size={24} />
                        </button>
                      </div>

                      <form onSubmit={handleBookSubmit} className="space-y-6">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Book Title</label>
                          <input 
                            type="text" 
                            required
                            value={editingBook?.title || ''}
                            onChange={e => setEditingBook(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div>
                              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Author</label>
                              <input 
                                type="text" 
                                required
                                value={editingBook?.author || ''}
                                onChange={e => setEditingBook(prev => ({ ...prev, author: e.target.value }))}
                                className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                              />
                           </div>
                           <div>
                              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Publisher</label>
                              <select 
                                required
                                value={editingBook?.publication || ''}
                                onChange={e => setEditingBook(prev => ({ ...prev, publication: e.target.value }))}
                                className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold appearance-none"
                              >
                                <option value="">Select Publisher...</option>
                                <option value="Sachin Sir">Sachin Sir</option>
                                <option value="Sachin Dhawale's Publication">Sachin Dhawale's Publication</option>
                                {publishers.map(p => (
                                  <option key={p.id} value={p.name}>{p.name}</option>
                                ))}
                              </select>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div>
                              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Book ID / ISBN</label>
                              <input 
                                type="text" 
                                value={editingBook?.isbn || ''}
                                onChange={e => setEditingBook(prev => ({ ...prev, isbn: e.target.value }))}
                                className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                                placeholder="SD-001 or ISBN"
                              />
                           </div>
                           <div>
                              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Book Type</label>
                              <select 
                                value={editingBook?.type || 'New'}
                                onChange={e => setEditingBook(prev => ({ ...prev, type: e.target.value as any }))}
                                className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold appearance-none"
                              >
                                <option value="New">New Book</option>
                                <option value="Old">Old / Pre-owned</option>
                              </select>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div>
                              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Category</label>
                              <select 
                                required
                                value={editingBook?.category || ''}
                                onChange={e => setEditingBook(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold appearance-none"
                              >
                                <option value="">Select Category</option>
                                {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                              </select>
                           </div>
                           <div>
                              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Subject</label>
                              <select 
                                required
                                value={editingBook?.subject || ''}
                                onChange={e => setEditingBook(prev => ({ ...prev, subject: e.target.value }))}
                                className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold appearance-none"
                              >
                                <option value="">Select Subject</option>
                                {subjects.map(s => <option key={s.id} value={s.slug}>{s.name}</option>)}
                              </select>
                           </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                           <div>
                              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Publication Year</label>
                              <input 
                                type="text" 
                                value={editingBook?.publicationYear || ''}
                                onChange={e => setEditingBook(prev => ({ ...prev, publicationYear: e.target.value }))}
                                className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                              />
                           </div>
                           <div>
                              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Edition</label>
                              <input 
                                type="text" 
                                value={editingBook?.edition || ''}
                                onChange={e => setEditingBook(prev => ({ ...prev, edition: e.target.value }))}
                                className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                              />
                           </div>
                           <div>
                              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Language</label>
                              <input 
                                type="text" 
                                value={editingBook?.language || ''}
                                onChange={e => setEditingBook(prev => ({ ...prev, language: e.target.value }))}
                                className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                              />
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div>
                              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Shelf Location</label>
                              <input 
                                type="text" 
                                value={editingBook?.shelfLocation || ''}
                                onChange={e => setEditingBook(prev => ({ ...prev, shelfLocation: e.target.value }))}
                                className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                                placeholder="A-1-4"
                              />
                           </div>
                           <div>
                              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Available Copies</label>
                              <input 
                                type="number" 
                                value={editingBook?.availableCopies || 0}
                                onChange={e => setEditingBook(prev => ({ ...prev, availableCopies: parseInt(e.target.value) }))}
                                className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                              />
                           </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">MSRP Price</label>
                            <input 
                              type="number" 
                              required
                              value={editingBook?.price || 0}
                              onChange={e => setEditingBook(prev => ({ ...prev, price: parseInt(e.target.value) }))}
                              className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Selling Price</label>
                            <input 
                              type="number" 
                              required
                              value={editingBook?.finalPrice || 0}
                              onChange={e => setEditingBook(prev => ({ ...prev, finalPrice: parseInt(e.target.value) }))}
                              className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Weight (Grams)</label>
                            <input 
                              type="number" 
                              required
                              value={editingBook?.weight || 0}
                              onChange={e => setEditingBook(prev => ({ ...prev, weight: parseInt(e.target.value) }))}
                              className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Stock Quantity</label>
                            <input 
                              type="number" 
                              required
                              value={editingBook?.stockQuantity || 0}
                              onChange={e => setEditingBook(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) }))}
                              className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Sample PDF Drive URL</label>
                            <input 
                              type="text" 
                              value={editingBook?.sampleFileUrl || ''}
                              onChange={e => setEditingBook(prev => ({ ...prev, sampleFileUrl: e.target.value }))}
                              className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                              placeholder="Direct Google Drive Link"
                            />
                          </div>
                        </div>

                        {/* Sachin Sir Book Promotion Category checkbox */}
                        <div className="flex flex-col gap-4 bg-red-50/40 p-5 rounded-2xl border border-red-100/60 mb-6 font-sans">
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox"
                              id="isSachinSirBook"
                              checked={!!editingBook?.isSachinSirBook}
                              onChange={e => setEditingBook(prev => ({ ...prev, isSachinSirBook: e.target.checked }))}
                              className="w-5 h-5 accent-[#5c0612] rounded border-neutral-300 focus:ring-red-500 cursor-pointer"
                            />
                            <label htmlFor="isSachinSirBook" className="text-sm font-extrabold text-neutral-800 cursor-pointer select-none flex items-center gap-1.5">
                              📚 Featured in Sachin Sir Books Section (At top of homepage)
                            </label>
                          </div>
                          {editingBook?.isSachinSirBook && (
                            <div className="mt-2 pl-8 border-l-2 border-[#5c0612]/30">
                              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#5c0612] mb-2 font-sans">Collection Grouping</label>
                              <select 
                                value={editingBook?.sachinSirGroup || ''}
                                onChange={e => setEditingBook(prev => ({ ...prev, sachinSirGroup: e.target.value }))}
                                className="w-full bg-white px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-bold"
                              >
                                <option value="">Select Grouping...</option>
                                <option value="MPSC Sets">MPSC Sets</option>
                                <option value="Subject-wise Sets">Subject-wise Sets</option>
                                <option value="Premium Sets">Premium Sets</option>
                                <option value="Foundation Sets">Foundation Sets</option>
                              </select>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Google Drive Image URL</label>
                          <p className="text-[9px] text-amber-600 font-bold mb-2 uppercase tracking-widest">Recommended: {settings?.imageSettings?.bookThumbnail.width || 800}x{settings?.imageSettings?.bookThumbnail.height || 1200} px</p>
                          <input 
                            type="text" 
                            required
                            value={editingBook?.imageUrl || ''}
                            onChange={e => setEditingBook(prev => ({ ...prev, imageUrl: e.target.value }))}
                            className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                          />
                          {editingBook?.imageUrl && (
                            <div className="mt-4 p-2 bg-neutral-100 rounded-xl overflow-hidden aspect-[3/4] w-24 relative">
                               <img src={getDriveImageUrl(editingBook.imageUrl)} className="w-full h-full object-contain" alt="Book Preview" />
                            </div>
                          )}
                        </div>

                        <button 
                          type="submit"
                          className="w-full bg-neutral-950 text-white py-5 rounded-2xl font-display font-bold uppercase tracking-widest shadow-xl shadow-neutral-900/10 active:scale-95 transition-all mt-4"
                        >
                          {editingBook?.id ? 'Update Book' : 'Add to Catalog'}
                        </button>
                      </form>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-8">
             <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm">
              <div>
                <h3 className="font-display font-bold text-xl">Classification</h3>
                <p className="text-xs text-neutral-400 font-sans uppercase tracking-widest mt-1">Organize books into pathways</p>
              </div>
              <button 
                onClick={() => {
                  setEditingCategory({ type: 'exam', order: categories.length });
                  setIsCategoryModalOpen(true);
                }}
                className="flex items-center gap-2 bg-amber-500 text-black px-6 py-3 rounded-xl font-display font-bold text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                <Plus size={16} /> New Category
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {categories.map((cat) => (
                 <div key={cat.id} className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm group hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-4">
                       <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-neutral-100 rounded">{cat.type}</span>
                       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingCategory(cat); setIsCategoryModalOpen(true); }} className="text-neutral-400 hover:text-amber-500"><Edit size={16} /></button>
                          <button onClick={() => handleDeleteCategory(cat.id)} className="text-neutral-400 hover:text-rose-500"><Trash2 size={16} /></button>
                       </div>
                    </div>
                    <h4 className="font-display font-bold text-xl mb-1">{cat.name}</h4>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest italic">{cat.slug}</p>
                 </div>
               ))}
               
               {categories.length === 0 && (
                 <div className="col-span-full py-20 bg-white rounded-[2rem] border border-dashed border-neutral-200 flex flex-col items-center justify-center text-center opacity-50">
                    <Tag size={48} className="mb-4 text-neutral-300" />
                    <p className="font-display font-bold tracking-widest uppercase text-xs">No categories established</p>
                 </div>
               )}
            </div>

            {/* Category Modal */}
            <AnimatePresence>
              {isCategoryModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
                  >
                    <div className="p-8 md:p-10">
                      <h3 className="text-2xl font-display font-bold uppercase italic mb-8">Category Details</h3>
                      <form onSubmit={handleCategorySubmit} className="space-y-6">
                         <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Display Name</label>
                            <input 
                              type="text" 
                              required
                              value={editingCategory?.name || ''}
                              onChange={e => setEditingCategory(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                            />
                         </div>
                         <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Category Type</label>
                            <select 
                              value={editingCategory?.type || 'exam'}
                              onChange={e => setEditingCategory(prev => ({ ...prev, type: e.target.value as any }))}
                              className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                            >
                               <option value="exam">Exam Pathway</option>
                               <option value="subject">Subject Specific</option>
                               <option value="special">Special Collection</option>
                               <option value="practice">Practice Materials</option>
                            </select>
                         </div>
                         <button type="submit" className="w-full bg-neutral-950 text-white py-5 rounded-2xl font-display font-bold uppercase tracking-widest shadow-xl">
                            {editingCategory?.id ? 'Update Category' : 'Create Category'}
                         </button>
                      </form>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="space-y-8">
             <div className="flex justify-between items-center bg-white p-10 rounded-[3rem] border border-neutral-100 shadow-sm">
              <div>
                <h3 className="font-display font-bold text-3xl">Staff Access Management</h3>
                <p className="text-xs text-neutral-400 font-sans uppercase tracking_widest mt-1">Delegate administrative control to team members</p>
              </div>
              <button 
                onClick={() => setIsStaffModalOpen(true)}
                className="flex items-center gap-2 bg-neutral-950 text-white px-8 py-4 rounded-2xl font-display font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
              >
                <Plus size={16} /> Grant Access
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {admins.map((staff) => (
                 <div key={staff.id} className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm flex items-center justify-between">
                    <div>
                       <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Administrative Staff</p>
                       <p className="font-display font-bold text-neutral-900">{staff.email}</p>
                    </div>
                    {staff.email !== 'sachinsirbooks@gmail.com' && (
                      <button onClick={() => handleDeleteStaff(staff.id)} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all">
                        <Trash2 size={18} />
                      </button>
                    )}
                 </div>
               ))}
            </div>

            {/* Staff Modal */}
            <AnimatePresence>
              {isStaffModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsStaffModalOpen(false)}
                    className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
                  >
                    <div className="p-10">
                       <h3 className="text-2xl font-display font-bold uppercase italic mb-8">Grant Admin Access</h3>
                       <form onSubmit={handleStaffSubmit} className="space-y-6">
                          <div>
                             <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Staff Email Address</label>
                             <input 
                               type="email" 
                               required
                               placeholder="staff@gmail.com"
                               value={staffEmail}
                               onChange={e => setStaffEmail(e.target.value)}
                               className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                             />
                          </div>
                          <p className="text-[10px] text-neutral-400 leading-relaxed uppercase font-bold tracking-wider">
                             Granting access will allow this user to modify library catalog, manage orders and update site settings.
                          </p>
                          <button type="submit" className="w-full bg-neutral-950 text-white py-5 rounded-2xl font-display font-bold uppercase tracking-widest shadow-xl">
                             Authorize User
                          </button>
                       </form>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {activeTab === 'orders' && (
           <div className="space-y-8">
              <div className="bg-white p-10 rounded-[3rem] border border-neutral-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                 <div>
                    <h3 className="font-display font-bold text-3xl">Order Management</h3>
                    <p className="text-xs text-neutral-400 font-sans uppercase tracking-widest mt-1">Direct oversight of sales and payment confirmation</p>
                 </div>
                 <div className="flex gap-4">
                    <button className="px-8 py-4 bg-neutral-50 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-900 hover:text-white transition-all">Export Report</button>
                    <button className="px-8 py-4 bg-amber-500 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20">Process All</button>
                 </div>
              </div>

              <div className="bg-white rounded-[3rem] border border-neutral-100 shadow-sm overflow-hidden">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="border-b border-neutral-100">
                             <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">Transaction ID</th>
                             <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">Member</th>
                             <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">Inventory</th>
                             <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">Revenue</th>
                             <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">Fulfillment</th>
                             <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">Date</th>
                             <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right">Actions</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-neutral-50">
                          {orders.map(order => (
                            <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors group">
                               <td className="px-10 py-6 font-display font-bold text-sm text-amber-600">
                                  #{order.id.substring(0, 8).toUpperCase()}
                               </td>
                               <td className="px-10 py-6">
                                  <p className="font-sans font-bold text-sm text-neutral-900">{order.address?.fullName || 'Guest'}</p>
                                  <p className="text-[10px] text-neutral-400 uppercase font-bold">{order.address?.phone}</p>
                               </td>
                               <td className="px-10 py-6">
                                  <span className="text-xs font-bold text-neutral-500">{order.items.length} Units</span>
                               </td>
                               <td className="px-10 py-6 font-display font-bold text-sm text-neutral-900">
                                  {formatPrice(order.total)}
                               </td>
                               <td className="px-10 py-6">
                                  <span className={cn(
                                    "px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm",
                                    order.status === 'delivered' ? "bg-green-500 text-white" :
                                    order.status === 'cancelled' ? "bg-rose-500 text-white" :
                                    "bg-amber-500 text-black"
                                  )}>
                                    {order.status}
                                  </span>
                               </td>
                               <td className="px-10 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-tighter">
                                  {new Date(order.createdAt).toLocaleDateString()}
                               </td>
                               <td className="px-10 py-6 text-right">
                                  <div className="flex justify-end gap-3">
                                     <button 
                                        onClick={() => setSelectedLabelOrder(order)}
                                        className="p-3 bg-neutral-100 rounded-xl text-neutral-400 hover:bg-neutral-900 hover:text-white transition-all shadow-sm cursor-pointer"
                                        title="View Shipment Label"
                                     >
                                        <ExternalLink size={16} />
                                     </button>
                                     <button 
                                        onClick={() => setSelectedLabelOrder(order)}
                                        className="px-5 py-3 bg-amber-500 rounded-xl text-black hover:bg-black hover:text-amber-500 transition-all font-black text-[9px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer"
                                        title="Print Invoice / Label"
                                     >
                                        <Download size={14} /> Label/Invoice
                                     </button>
                                  </div>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
                 {orders.length === 0 && (
                    <div className="py-24 text-center opacity-40">
                       <ShoppingCart size={64} className="mx-auto mb-6 text-neutral-300" />
                       <p className="font-display font-bold uppercase tracking-widest text-sm italic">No active orders in record</p>
                    </div>
                 )}
              </div>
           </div>
        )}

        {activeTab === 'payments' && (
           <div className="space-y-8 animate-fade-in">
              {/* Premium Payments Analytics Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 font-sans">Gross Revenue</span>
                       <span className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl group-hover:scale-110 transition-transform"><DollarSign size={18} /></span>
                    </div>
                    <div className="font-display font-black text-3xl text-neutral-900">
                       {formatPrice(payments.reduce((acc, p) => acc + (p.amount || 0), 0))}
                    </div>
                    <p className="text-xs text-neutral-400 mt-2 font-sans font-medium">Accumulated successful Razorpay orders</p>
                 </div>

                 <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 font-sans">Success Purchases</span>
                       <span className="p-3 bg-amber-50 text-amber-500 rounded-2xl group-hover:scale-110 transition-transform"><CreditCard size={18} /></span>
                    </div>
                    <div className="font-display font-black text-3xl text-neutral-900">
                       {payments.length}
                    </div>
                    <p className="text-xs text-neutral-400 mt-2 font-sans font-medium">Verified real payment captures</p>
                 </div>

                 <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 font-sans">Failed / Dismissed</span>
                       <span className="p-3 bg-rose-50 text-rose-500 rounded-2xl group-hover:scale-110 transition-transform"><AlertCircle size={18} /></span>
                    </div>
                    <div className="font-display font-black text-3xl text-neutral-900 text-rose-600">
                       {failedPayments.length}
                    </div>
                    <p className="text-xs text-neutral-400 mt-2 font-sans font-medium">Aborted checkouts & missing signatures</p>
                 </div>

                 <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 font-sans">Integrity Ratio</span>
                       <span className="p-3 bg-neutral-100 text-neutral-500 rounded-2xl group-hover:scale-110 transition-transform"><RefreshCw size={18} /></span>
                    </div>
                    <div className="font-display font-black text-3xl text-neutral-900">
                       {payments.length + failedPayments.length > 0 
                          ? ((payments.length / (payments.length + failedPayments.length)) * 100).toFixed(1) + '%'
                          : '100%'}
                    </div>
                    <p className="text-xs text-neutral-400 mt-2 font-sans font-medium">Conversion from popup to completion</p>
                 </div>
              </div>

              {/* Toolbar Search & Tabs Filter */}
              <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-neutral-100 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                 <div className="flex flex-wrap items-center gap-3">
                    <button 
                       onClick={() => setPaymentFilter('all')}
                       className={cn(
                          "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
                          paymentFilter === 'all' ? "bg-amber-500 text-black shadow-md shadow-amber-500/10" : "bg-neutral-50 text-neutral-500 hover:bg-neutral-100"
                       )}
                    >
                       Successful Transactions ({payments.length})
                    </button>
                    <button 
                       onClick={() => setPaymentFilter('failed')}
                       className={cn(
                          "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
                          paymentFilter === 'failed' ? "bg-rose-600 text-white shadow-md shadow-rose-600/10" : "bg-neutral-50 text-neutral-500 hover:bg-neutral-100"
                       )}
                    >
                       Failed Checkouts ({failedPayments.length})
                    </button>
                    <button 
                       onClick={() => setPaymentFilter('logs')}
                       className={cn(
                          "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
                          paymentFilter === 'logs' ? "bg-neutral-900 text-white" : "bg-neutral-50 text-neutral-500 hover:bg-neutral-100"
                       )}
                    >
                       Audit Logs / Webhooks ({paymentLogs.length})
                    </button>
                 </div>

                 <div className="relative max-w-md w-full">
                    <input
                       type="text"
                       placeholder="Search IDs, user emails, error triggers..."
                       value={paymentSearch}
                       onChange={(e) => setPaymentSearch(e.target.value)}
                       className="w-full px-5 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl text-xs font-sans font-bold text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                 </div>
              </div>

              {/* Main Payments Active Table view */}
              <div className="bg-white rounded-[3rem] border border-neutral-100 shadow-sm overflow-hidden">
                 {paymentFilter === 'all' && (
                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                          <thead>
                             <tr className="border-b border-neutral-100 bg-neutral-50/50">
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">Payment ID</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">Order ID</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">Customer Info</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">Created At</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">Amount</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right">Actions</th>
                             </tr>
                          </thead>
                          <tbody>
                             {payments
                                .filter(pay => {
                                   const term = paymentSearch.toLowerCase();
                                   return (
                                      (pay.paymentId || '').toLowerCase().includes(term) ||
                                      (pay.orderId || '').toLowerCase().includes(term) ||
                                      (pay.userEmail || '').toLowerCase().includes(term) ||
                                      (pay.userId || '').toLowerCase().includes(term)
                                   );
                                })
                                .map((pay) => (
                                   <tr key={pay.id} className="border-b border-neutral-50 hover:bg-neutral-50/40 transition-colors">
                                      <td className="px-10 py-6">
                                         <span className="font-mono text-xs font-black text-amber-600 bg-amber-50/50 px-3 py-1 rounded-lg border border-amber-100/50">{pay.paymentId}</span>
                                      </td>
                                      <td className="px-10 py-6">
                                         <span className="font-mono text-[11px] font-bold text-neutral-500">{pay.orderId}</span>
                                      </td>
                                      <td className="px-10 py-6">
                                         <div className="text-xs font-bold text-neutral-800">{pay.userEmail}</div>
                                      </td>
                                      <td className="px-10 py-6 text-xs text-neutral-500 font-sans">
                                         {pay.timestamp ? new Date(pay.timestamp).toLocaleString() : 'N/A'}
                                      </td>
                                      <td className="px-10 py-6 font-display font-black text-sm text-neutral-900">
                                         {formatPrice(pay.amount)}
                                      </td>
                                      <td className="px-10 py-6 text-right">
                                         <div className="flex justify-end gap-3">
                                            <button 
                                               onClick={() => {
                                                  const order = orders.find(o => o.id === pay.orderId);
                                                  if (order) {
                                                     pdfService.generateInvoice({ ...order, status: 'processing' });
                                                  } else {
                                                     toast.error("Complete order details not loaded!");
                                                  }
                                               }}
                                               className="px-4 py-2 bg-neutral-100 text-neutral-600 hover:bg-neutral-900 hover:text-white transition-all rounded-xl font-bold text-[9px] uppercase tracking-wider cursor-pointer"
                                               title="Download PDF invoice directly"
                                            >
                                               Invoice
                                            </button>
                                            <button 
                                               onClick={() => handleRefund(pay.paymentId, pay.orderId, pay.amount)}
                                               disabled={isProcessingRefund === pay.paymentId}
                                               className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all rounded-xl font-bold text-[9px] uppercase tracking-wider cursor-pointer disabled:opacity-50"
                                            >
                                               {isProcessingRefund === pay.paymentId ? 'Refunding...' : 'Refund'}
                                            </button>
                                         </div>
                                      </td>
                                   </tr>
                                ))}
                             {payments.length === 0 && (
                                <tr>
                                   <td colSpan={6} className="py-24 text-center opacity-40">
                                      <CreditCard size={64} className="mx-auto mb-6 text-neutral-300" />
                                      <p className="font-display font-bold uppercase tracking-widest text-sm italic">No captured successful payments found</p>
                                   </td>
                                </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 )}

                 {paymentFilter === 'failed' && (
                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                          <thead>
                             <tr className="border-b border-neutral-100 bg-neutral-50/50">
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">Razorpay Order ID</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">Order Document ID</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">Detected Reason</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">Aborted Stamp</th>
                             </tr>
                          </thead>
                          <tbody>
                             {failedPayments
                                .filter(pay => {
                                   const term = paymentSearch.toLowerCase();
                                   return (
                                      (pay.razorpayPaymentId || '').toLowerCase().includes(term) ||
                                      (pay.razorpayOrderId || '').toLowerCase().includes(term) ||
                                      (pay.orderId || '').toLowerCase().includes(term) ||
                                      (pay.errorReason || '').toLowerCase().includes(term)
                                   );
                                })
                                .map((pay) => (
                                   <tr key={pay.id} className="border-b border-neutral-50 hover:bg-neutral-50/40 transition-colors">
                                      <td className="px-10 py-6">
                                         <span className="font-mono text-xs font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100">{pay.razorpayOrderId || 'uninitiated'}</span>
                                      </td>
                                      <td className="px-10 py-6">
                                         <span className="font-mono text-[11px] font-bold text-neutral-500">{pay.orderId || 'N/A'}</span>
                                      </td>
                                      <td className="px-10 py-6">
                                         <span className="text-xs font-bold text-neutral-700 bg-neutral-100 px-3 py-1 rounded-xl max-w-xs truncate inline-block">{pay.errorReason || 'Manual Dismiss'}</span>
                                      </td>
                                      <td className="px-10 py-6 text-xs text-neutral-500 font-sans">
                                         {pay.timestamp ? new Date(pay.timestamp).toLocaleString() : 'N/A'}
                                      </td>
                                   </tr>
                                ))}
                             {failedPayments.length === 0 && (
                                <tr>
                                   <td colSpan={4} className="py-24 text-center opacity-40">
                                      <AlertCircle size={64} className="mx-auto mb-6 text-neutral-300" />
                                      <p className="font-display font-bold uppercase tracking-widest text-sm italic">No failed logs on register</p>
                                   </td>
                                </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 )}

                 {paymentFilter === 'logs' && (
                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                          <thead>
                             <tr className="border-b border-neutral-100 bg-neutral-50/50">
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400 font-sans">Audit Type</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400 font-sans">System Source Info</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400 font-sans">Action Status</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400 font-sans">Telemetry Date</th>
                             </tr>
                          </thead>
                          <tbody>
                             {paymentLogs
                                .filter(log => {
                                   const term = paymentSearch.toLowerCase();
                                   return (
                                      (log.type || '').toLowerCase().includes(term) ||
                                      (log.status || '').toLowerCase().includes(term) ||
                                      JSON.stringify(log.payload || {}).toLowerCase().includes(term)
                                   );
                                })
                                .map((log) => (
                                   <tr key={log.id} className="border-b border-neutral-5 hover:bg-neutral-50/40 transition-colors">
                                      <td className="px-10 py-6">
                                         <span className="font-sans text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-neutral-100 rounded-lg text-neutral-600 block w-max">{log.type}</span>
                                      </td>
                                      <td className="px-10 py-6">
                                         <div className="font-mono text-xs max-w-sm truncate text-neutral-600">{JSON.stringify(log.payload || log.errorReason || log.razorpayPaymentId || "-")}</div>
                                      </td>
                                      <td className="px-10 py-6">
                                         <span className={cn(
                                            "px-3 py-1 rounded-xl font-bold text-[9px] uppercase tracking-wider",
                                            log.status === 'success' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                         )}>
                                            {log.status || 'system'}
                                         </span>
                                      </td>
                                      <td className="px-10 py-6 text-xs text-neutral-500 font-sans">
                                         {new Date(log.createdAt || log.timestamp || Date.now()).toLocaleString()}
                                      </td>
                                   </tr>
                                ))}
                             {paymentLogs.length === 0 && (
                                <tr>
                                   <td colSpan={4} className="py-24 text-center opacity-40">
                                      <RefreshCw size={64} className="mx-auto mb-6 text-neutral-300 animate-spin" />
                                      <p className="font-display font-bold uppercase tracking-widest text-sm italic">Audit trail empty</p>
                                   </td>
                                </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 )}
              </div>
           </div>
        )}

        {activeTab === 'users' && (
           <div className="space-y-8">
              <div className="bg-white p-10 rounded-[3rem] border border-neutral-100 shadow-sm flex items-center justify-between">
                 <div>
                    <h3 className="font-display font-bold text-3xl">Member Directory</h3>
                    <p className="text-xs text-neutral-400 font-sans uppercase tracking-widest mt-1">Total registered students and book enthusiasts</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {users.map(user => (
                   <div key={user.id} className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm flex flex-col group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform" />
                      <div className="flex items-center gap-4 mb-6">
                         <div className="w-14 h-14 bg-neutral-900 rounded-2xl flex items-center justify-center text-white font-display font-bold text-xl uppercase shadow-xl group-hover:rotate-6 transition-transform">
                            {user.name?.[0] || 'U'}
                         </div>
                         <div>
                            <h4 className="font-display font-bold text-lg text-neutral-900">{user.name}</h4>
                            <p className="text-[10px] text-neutral-400 uppercase font-black tracking-widest">{user.role || 'Student'}</p>
                         </div>
                      </div>
                      
                      <div className="space-y-3 mb-8">
                         <div className="flex items-center gap-3 text-neutral-500">
                            <Mail size={14} />
                            <span className="text-xs font-medium">{user.email}</span>
                         </div>
                         <div className="flex items-center gap-3 text-neutral-500">
                            <Calendar size={14} />
                            <span className="text-xs font-medium">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                         </div>
                      </div>

                      <div className="mt-auto pt-6 border-t border-neutral-50 flex items-center justify-between">
                         <span className={cn(
                           "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                           user.isAdmin ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                         )}>
                           {user.isAdmin ? 'Admin' : 'Member'}
                         </span>
                         <button className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors">View Profile</button>
                      </div>
                   </div>
                 ))}
                 {users.length === 0 && (
                    <div className="col-span-full py-24 text-center opacity-40">
                       <Users size={64} className="mx-auto mb-6 text-neutral-200" />
                       <p className="font-display font-bold uppercase tracking-widest text-sm italic">No users found in database</p>
                    </div>
                 )}
              </div>
           </div>
        )}

        {activeTab === 'settings' && settings && (
          <form onSubmit={handleSettingsSubmit} className="space-y-12">
            {/* Logo & Branding */}
            <div className="bg-white rounded-[3rem] p-10 border border-neutral-100 shadow-sm">
              <h3 className="font-display font-bold text-2xl mb-8 flex items-center gap-3">
                <ImageIcon className="text-amber-500" /> Branding & Identity
              </h3>
              <div className="mb-8 pb-8 border-b border-neutral-100">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-3">Top Bar Promo/Announcement Offer Message</label>
                <input 
                  type="text" 
                  value={settings.announcement || ''}
                  onChange={e => setSettings(prev => prev ? ({ ...prev, announcement: e.target.value }) : null)}
                  className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                  placeholder="Enter the announcement message displayed in the top notice bar"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-3">Main Logo URL (Drive Link)</label>
                   <input 
                     type="text" 
                     value={settings.logoUrl}
                     onChange={e => setSettings(prev => prev ? ({ ...prev, logoUrl: e.target.value }) : null)}
                     className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold mb-4"
                     placeholder="Google Drive direct image link"
                   />
                   {settings.logoUrl && (
                     <div className="w-20 h-20 bg-neutral-50 rounded-xl overflow-hidden border border-neutral-100">
                       <img src={getDriveImageUrl(settings.logoUrl)} className="w-full h-full object-contain" alt="Logo preview" />
                     </div>
                   )}
                </div>
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-3">WhatsApp Chatbot</label>
                   <div className="flex items-center gap-4 mb-4">
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={settings.whatsappChatbot.enabled}
                          onChange={e => setSettings(prev => prev ? ({ ...prev, whatsappChatbot: { ...prev.whatsappChatbot, enabled: e.target.checked }}) : null)}
                          className="w-5 h-5 accent-amber-500"
                        />
                        <span className="text-xs font-bold uppercase tracking-widest">Enable Chatbot</span>
                     </label>
                   </div>
                   <input 
                     type="text" 
                     value={settings.whatsappChatbot.phoneNumber}
                     onChange={e => setSettings(prev => prev ? ({ ...prev, whatsappChatbot: { ...prev.whatsappChatbot, phoneNumber: e.target.value }}) : null)}
                     className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold mb-3"
                     placeholder="Phone Number (with country code)"
                   />
                </div>
              </div>
            </div>

            {/* SEO Section */}
            <div className="bg-white rounded-[3rem] p-10 border border-neutral-100 shadow-sm">
              <h3 className="font-display font-bold text-2xl mb-8 flex items-center gap-3">
                <Globe className="text-blue-500" /> Search Engine Optimization
              </h3>
              <div className="space-y-6">
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-3">Site Title (Meta Title)</label>
                   <input 
                     type="text" 
                     value={settings.seo.title}
                     onChange={e => setSettings(prev => prev ? ({ ...prev, seo: { ...prev.seo, title: e.target.value }}) : null)}
                     className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                   />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-3">Meta Description</label>
                    <textarea 
                      rows={4}
                      value={settings.seo.description}
                      onChange={e => setSettings(prev => prev ? ({ ...prev, seo: { ...prev.seo, description: e.target.value }}) : null)}
                      className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-3">Keywords (Comma Separated)</label>
                    <textarea 
                      rows={4}
                      value={settings.seo.keywords}
                      onChange={e => setSettings(prev => prev ? ({ ...prev, seo: { ...prev.seo, keywords: e.target.value }}) : null)}
                      className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Founder Section */}
            <div className="bg-white rounded-[3rem] p-10 border border-neutral-100 shadow-sm">
              <h3 className="font-display font-bold text-2xl mb-8 flex items-center gap-3">
                <Users className="text-rose-500" /> Founder's Profile
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-3">Founder Name</label>
                    <input 
                      type="text" 
                      value={settings.founder.name}
                      onChange={e => setSettings(prev => prev ? ({ ...prev, founder: { ...prev.founder, name: e.target.value }}) : null)}
                      className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                    />
                  </div>
                   <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-3">Founder Tagline</label>
                    <input 
                      type="text" 
                      value={settings.founder.tagline}
                      onChange={e => setSettings(prev => prev ? ({ ...prev, founder: { ...prev.founder, tagline: e.target.value }}) : null)}
                      className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-3">Founder Bio / Description</label>
                    <textarea 
                      rows={4}
                      value={settings.founder.description}
                      onChange={e => setSettings(prev => prev ? ({ ...prev, founder: { ...prev.founder, description: e.target.value }}) : null)}
                      className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-3">Founder Photo URL (Drive)</label>
                    <input 
                      type="text" 
                      value={settings.founder.imageUrl}
                      onChange={e => setSettings(prev => prev ? ({ ...prev, founder: { ...prev.founder, imageUrl: e.target.value }}) : null)}
                      className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Image & Asset Management */}
            <div className="bg-white rounded-[3rem] p-10 border border-neutral-100 shadow-sm">
              <h3 className="font-display font-bold text-2xl mb-8 flex items-center gap-3">
                <ImageIcon className="text-amber-500" /> Image Size Management
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-3">Desktop Banner (WxH)</label>
                    <div className="flex gap-2">
                       <input 
                         type="number" 
                         value={settings.imageSettings?.bannerDesktop.width || 1920}
                         onChange={e => setSettings(prev => prev ? ({ ...prev, imageSettings: { ...(prev.imageSettings!), bannerDesktop: { ...prev.imageSettings!.bannerDesktop, width: parseInt(e.target.value) }}}) : null)}
                         className="w-full bg-neutral-50 px-4 py-3 rounded-xl border border-neutral-100 text-sm font-bold"
                       />
                       <input 
                         type="number" 
                         value={settings.imageSettings?.bannerDesktop.height || 700}
                         onChange={e => setSettings(prev => prev ? ({ ...prev, imageSettings: { ...(prev.imageSettings!), bannerDesktop: { ...prev.imageSettings!.bannerDesktop, height: parseInt(e.target.value) }}}) : null)}
                         className="w-full bg-neutral-50 px-4 py-3 rounded-xl border border-neutral-100 text-sm font-bold"
                       />
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-3">Mobile Banner (WxH)</label>
                    <div className="flex gap-2">
                       <input 
                         type="number" 
                         value={settings.imageSettings?.bannerMobile.width || 768}
                         onChange={e => setSettings(prev => prev ? ({ ...prev, imageSettings: { ...(prev.imageSettings!), bannerMobile: { ...prev.imageSettings!.bannerMobile, width: parseInt(e.target.value) }}}) : null)}
                         className="w-full bg-neutral-50 px-4 py-3 rounded-xl border border-neutral-100 text-sm font-bold"
                       />
                       <input 
                         type="number" 
                         value={settings.imageSettings?.bannerMobile.height || 1000}
                         onChange={e => setSettings(prev => prev ? ({ ...prev, imageSettings: { ...(prev.imageSettings!), bannerMobile: { ...prev.imageSettings!.bannerMobile, height: parseInt(e.target.value) }}}) : null)}
                         className="w-full bg-neutral-50 px-4 py-3 rounded-xl border border-neutral-100 text-sm font-bold"
                       />
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-3">Max File Size (MB)</label>
                    <input 
                      type="number" 
                      value={settings.imageSettings?.maxFileSizeMB || 5}
                      onChange={e => setSettings(prev => prev ? ({ ...prev, imageSettings: { ...(prev.imageSettings!), maxFileSizeMB: parseInt(e.target.value) }}) : null)}
                      className="w-full bg-neutral-50 px-6 py-3 rounded-xl border border-neutral-100 text-sm font-bold"
                    />
                 </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white rounded-[3rem] p-10 border border-neutral-100 shadow-sm">
              <h3 className="font-display font-bold text-2xl mb-8 flex items-center gap-3">
                <Share2 className="text-purple-500" /> Social Connectivity
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {Object.keys(settings.socialLinks).map((platform) => (
                    <div key={platform}>
                       <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-3 capitalize">{platform} Handle/Url</label>
                       <input 
                         type="text" 
                         value={(settings.socialLinks as any)[platform] || ''}
                         onChange={e => setSettings(prev => prev ? ({ ...prev, socialLinks: { ...prev.socialLinks, [platform]: e.target.value }}) : null)}
                         className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                       />
                    </div>
                 ))}
              </div>
            </div>

            {/* Razorpay Integration */}
            <div className="bg-white rounded-[3rem] p-10 border border-neutral-100 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full -mr-16 -mt-16" />
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                 <h3 className="font-display font-bold text-2xl flex items-center gap-3 relative z-10">
                   <DollarSign className="text-blue-600" /> Razorpay Payments
                 </h3>
                 <div className="flex items-center gap-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.razorpay?.enabled || false}
                        onChange={e => setSettings(prev => prev ? ({ ...prev, razorpay: { ...(prev.razorpay || {}), enabled: e.target.checked } as any }) : null)}
                        className="w-5 h-5 accent-blue-600"
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Enabled</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div 
                        onClick={() => setSettings(prev => prev ? ({ ...prev, razorpay: { ...(prev.razorpay || {}), testMode: !prev.razorpay?.testMode } as any }) : null)}
                        className={cn(
                          "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                          settings.razorpay?.testMode 
                            ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" 
                            : "bg-green-600 text-white shadow-lg shadow-green-600/20"
                        )}
                      >
                        {settings.razorpay?.testMode ? 'Test Mode' : 'Live Mode'}
                      </div>
                    </label>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                 <div className="space-y-6">
                    <div>
                       <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-3">Razorpay Key ID</label>
                       <input 
                         type="text" 
                         value={settings.razorpay?.keyId || ''}
                         onChange={e => setSettings(prev => prev ? ({ ...prev, razorpay: { ...(prev.razorpay || {}), keyId: e.target.value } as any }) : null)}
                         className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-bold"
                         placeholder="rzp_test_..."
                       />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-3">Key Secret</label>
                       <div className="relative">
                          <input 
                            type="password"
                            value={settings.razorpay?.keySecret || ''}
                            onChange={e => setSettings(prev => prev ? ({ ...prev, razorpay: { ...(prev.razorpay || {}), keySecret: e.target.value } as any }) : null)}
                            className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-bold pr-16"
                            placeholder="••••••••••••••••"
                          />
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-300">
                             <ShieldCheck size={18} />
                          </div>
                       </div>
                    </div>
                 </div>
                 <div className="space-y-6">
                    <div>
                       <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-3">Webhook Secret (Optional)</label>
                       <input 
                         type="text" 
                         value={settings.razorpay?.webhookSecret || ''}
                         onChange={e => setSettings(prev => prev ? ({ ...prev, razorpay: { ...(prev.razorpay || {}), webhookSecret: e.target.value } as any }) : null)}
                         className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-bold"
                         placeholder="Your webhook secret"
                       />
                    </div>
                    <div className="pt-7">
                       <button 
                         type="button"
                         onClick={testRazorpayConnection}
                         className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-white border border-neutral-200 text-neutral-900 rounded-2xl font-display font-bold text-xs uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
                       >
                         <ExternalLink size={16} /> Test API Connection
                       </button>
                    </div>
                 </div>
              </div>
              <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
                    <ShieldCheck size={20} />
                 </div>
                 <div>
                    <p className="text-xs font-bold text-blue-900 mb-1 uppercase tracking-tight">Security Note</p>
                    <p className="text-[10px] text-blue-700/70 leading-relaxed font-sans font-medium">
                       Credentials are encrypted and stored securely in the system. They are only utilized on the server-side to facilitate secure transactions. Never share your Key Secret with anyone.
                    </p>
                 </div>
              </div>
            </div>

            <div className="sticky bottom-8 flex justify-end">
               <button 
                 type="submit"
                 disabled={isSavingSettings}
                 className="bg-neutral-950 text-white px-12 py-5 rounded-2xl font-display font-bold uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
               >
                 <Save size={20} /> {isSavingSettings ? 'Syncing...' : 'Save Site Settings'}
               </button>
            </div>
          </form>
        )}
        {activeTab === 'publications' && (
           <div className="space-y-8 font-sans">
              <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm">
                <div>
                  <h3 className="font-display font-bold text-xl text-neutral-900">Publisher Management</h3>
                  <p className="text-xs text-neutral-400 font-sans uppercase tracking-widest mt-1">Manage physical publishers and publication priorities</p>
                </div>
                <button 
                  onClick={() => {
                    setEditingPublisher({ name: '', description: '' });
                    setIsPublisherModalOpen(true);
                  }}
                  className="flex items-center gap-2 bg-amber-500 text-black px-6 py-3 rounded-xl font-display font-bold text-xs uppercase tracking-widest hover:scale-[1.02] shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  <Plus size={16} /> New Publisher
                </button>
              </div>

              {/* Grid of existing publishers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {publishers.map(p => (
                   <div key={p.id} className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm flex flex-col group relative">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-[#5c0612]/5 text-[#5c0612] rounded-xl flex items-center justify-center font-bold">
                           {p.name[0]?.toUpperCase()}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => { setEditingPublisher(p); setIsPublisherModalOpen(true); }} className="p-1.5 hover:text-[#5c0612] text-neutral-400"><Edit size={16} /></button>
                           <button onClick={() => handleDeletePublisher(p.id)} className="p-1.5 hover:text-rose-500 text-neutral-400"><Trash2 size={16} /></button>
                        </div>
                      </div>
                      <h4 className="font-display font-bold text-lg text-neutral-900 mb-2">{p.name}</h4>
                      <p className="text-xs text-neutral-500 line-clamp-3">{p.description || "No description provided."}</p>
                   </div>
                 ))}
                 {publishers.length === 0 && (
                   <div className="col-span-full py-12 bg-white rounded-[2rem] border border-dashed border-neutral-200 text-center text-neutral-400 text-xs font-bold uppercase tracking-widest">
                      No custom publishers found. Let's add some!
                   </div>
                 )}
              </div>

              {/* Priorities sub-section */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm">
                 <h4 className="font-display font-bold text-lg text-neutral-900 mb-2">Publication Display Priorities</h4>
                 <p className="text-sm text-neutral-500 mb-6">Publications at the top will be prioritised across category pages and search results.</p>
                 
                 <div className="max-w-2xl space-y-3">
                   {(settings?.publicationPriorities || []).map((pub, index) => (
                     <div key={pub} className="flex items-center gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-100 group">
                        <span className="w-7 h-7 flex items-center justify-center bg-amber-500 text-black font-extrabold italic rounded text-xs select-none">{index + 1}</span>
                        <span className="flex-1 font-bold text-sm text-neutral-800">{pub}</span>
                        <div className="flex gap-2">
                           <button 
                             disabled={index === 0}
                             type="button"
                             onClick={() => {
                               const newP = [...(settings?.publicationPriorities || [])];
                               [newP[index - 1], newP[index]] = [newP[index], newP[index - 1]];
                               handleUpdatePublicationPriorities(newP);
                             }}
                             className="p-1.5 bg-white text-neutral-400 hover:text-amber-500 border border-neutral-200 rounded disabled:opacity-35"
                           >↑</button>
                           <button 
                             disabled={index === (settings?.publicationPriorities || []).length - 1}
                             type="button"
                             onClick={() => {
                               const newP = [...(settings?.publicationPriorities || [])];
                               [newP[index + 1], newP[index]] = [newP[index], newP[index + 1]];
                               handleUpdatePublicationPriorities(newP);
                             }}
                             className="p-1.5 bg-white text-neutral-400 hover:text-amber-500 border border-neutral-200 rounded disabled:opacity-35"
                           >↓</button>
                           <button 
                             type="button"
                             onClick={() => {
                               const newP = (settings?.publicationPriorities || []).filter(p => p !== pub);
                               handleUpdatePublicationPriorities(newP);
                             }}
                             className="p-1.5 bg-white text-neutral-400 hover:text-rose-500 border border-neutral-200 rounded"
                           ><Trash2 size={14} /></button>
                        </div>
                     </div>
                   ))}
                   
                   <div className="flex gap-3 pt-4">
                      <input 
                        id="new-pub-priority-input"
                        type="text"
                        placeholder="Add a priority item..."
                        className="flex-1 bg-neutral-50 px-4 py-3 rounded-xl border border-neutral-100 text-xs font-bold"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            const val = e.currentTarget.value.trim();
                            if (val && !settings?.publicationPriorities?.includes(val)) {
                              handleUpdatePublicationPriorities([...(settings?.publicationPriorities || []), val]);
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('new-pub-priority-input') as HTMLInputElement;
                          const val = el?.value.trim();
                          if (val && !settings?.publicationPriorities?.includes(val)) {
                            handleUpdatePublicationPriorities([...(settings?.publicationPriorities || []), val]);
                            el.value = '';
                          }
                        }}
                        className="bg-neutral-900 text-white px-6 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-neutral-800"
                      >Add</button>
                   </div>
                 </div>
              </div>

              {/* Publisher Modal */}
              <AnimatePresence>
                 {isPublisherModalOpen && (
                   <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPublisherModalOpen(false)} className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm" />
                     <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative z-10">
                        <div className="flex justify-between items-center mb-6 font-sans">
                           <h4 className="font-display font-bold text-xl">{editingPublisher?.id ? 'Edit Publisher' : 'New Publisher'}</h4>
                           <button type="button" onClick={() => setIsPublisherModalOpen(false)} className="p-1 hover:bg-neutral-100 rounded-full"><CloseIcon size={20} /></button>
                        </div>
                        <form onSubmit={handlePublisherSubmit} className="space-y-4 font-sans">
                           <div>
                              <label className="block text-[10px] font-black uppercase tracking-widest text-[#5c0612] mb-1.5">Publisher Name</label>
                              <input required type="text" value={editingPublisher?.name || ''} onChange={e => setEditingPublisher(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-neutral-50 px-4 py-3 rounded-xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 font-bold text-sm" />
                           </div>
                           <div>
                              <label className="block text-[10px] font-black uppercase tracking-widest text-[#5c0612] mb-1.5">Description / Bio</label>
                              <textarea rows={3} value={editingPublisher?.description || ''} onChange={e => setEditingPublisher(prev => ({ ...prev, description: e.target.value }))} className="w-full bg-neutral-50 px-4 py-3 rounded-xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 font-bold text-sm" />
                           </div>
                           <button type="submit" className="w-full bg-[#5c0612] text-white py-4 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-[#40040c] transition-colors shadow-lg active:scale-95 leading-none">
                              Save Publisher
                           </button>
                        </form>
                     </motion.div>
                   </div>
                 )}
              </AnimatePresence>
           </div>
         )}

        {activeTab === 'subjects' && (
           <div className="space-y-8">
              <div className="flex justify-between items-center bg-white p-10 rounded-[3rem] border border-neutral-100 shadow-sm">
                 <div>
                    <h3 className="font-display font-bold text-2xl">Subject Management</h3>
                    <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest mt-1">Organize your collection by specific subjects</p>
                 </div>
                 <button 
                   onClick={() => {
                     setEditingSubject({ name: '' });
                     setIsSubjectModalOpen(true);
                   }}
                   className="bg-neutral-950 text-white px-8 py-4 rounded-2xl font-display font-bold text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl"
                 >
                   New Subject
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {subjects.map(s => (
                   <div key={s.id} className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 flex flex-col group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform" />
                      <div className="flex items-center gap-3 mb-4">
                         <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-black font-black italic">
                            {s.name[0]}
                         </div>
                         <h4 className="font-display font-bold text-xl">{s.name}</h4>
                      </div>
                      <p className="text-[10px] text-neutral-400 uppercase font-black tracking-widest mb-6">
                        Mapped to: <span className="text-amber-600">{s.categorySlug}</span>
                      </p>
                      
                      <div className="mt-auto flex gap-2">
                         <button 
                           onClick={() => {
                             setEditingSubject(s);
                             setIsSubjectModalOpen(true);
                           }}
                           className="flex-1 py-3 bg-neutral-50 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-900 hover:text-white transition-all"
                         >
                           Edit
                         </button>
                         <button 
                            onClick={() => handleDeleteSubject(s.id)}
                            className="p-3 bg-rose-50 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                         >
                            <Trash2 size={16} />
                         </button>
                      </div>
                   </div>
                 ))}
              </div>

              {isSubjectModalOpen && (
                 <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      onClick={() => setIsSubjectModalOpen(false)}
                      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="bg-white w-full max-w-lg rounded-[3rem] p-12 relative z-10"
                    >
                       <h3 className="text-2xl font-display font-bold mb-8">{editingSubject?.id ? 'Edit Subject' : 'New Subject'}</h3>
                       <form onSubmit={handleSubjectSubmit} className="space-y-6">
                          <div>
                             <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-3">Subject Name</label>
                             <input 
                               required type="text" value={editingSubject?.name || ''}
                               onChange={e => setEditingSubject(prev => ({ ...prev, name: e.target.value }))}
                               className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold"
                             />
                          </div>
                          <div>
                             <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-3">Parent Category</label>
                             <select 
                               required value={editingSubject?.categorySlug || ''}
                               onChange={e => setEditingSubject(prev => ({ ...prev, categorySlug: e.target.value }))}
                               className="w-full bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold appearance-none"
                             >
                                <option value="">Select Category</option>
                                {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                             </select>
                          </div>
                          <button type="submit" className="w-full bg-neutral-900 text-white py-5 rounded-2xl font-display font-bold uppercase tracking-widest active:scale-95 transition-all shadow-xl">
                             Save Subject
                          </button>
                       </form>
                    </motion.div>
                 </div>
              )}
           </div>
        )}
        {activeTab === 'tiles' && (
           <div className="space-y-8 font-sans">
             <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-neutral-100 shadow-sm">
               <h3 className="font-display font-bold text-2xl mb-2 text-neutral-900">Visual Under-Hero Tiles</h3>
               <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-8">
                 Manage custom visual category blocks rendered right below the home page hero banner on desktop and mobile.
               </p>

               {/* Add Tile Form */}
               <form onSubmit={handleAddTile} className="bg-neutral-50 p-6 md:p-8 rounded-3xl border border-neutral-100/60 max-w-3xl space-y-4">
                 <h4 className="font-display font-extrabold text-sm uppercase tracking-wider text-neutral-900">Add New Visual Tile</h4>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <div className="col-span-1">
                     <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-2">Emoji Icon</label>
                     <input 
                       type="text" 
                       required
                       value={newTile.emoji}
                       onChange={e => setNewTile(prev => ({ ...prev, emoji: e.target.value }))}
                       placeholder="📚"
                       className="w-full bg-white px-4 py-3 rounded-xl border border-neutral-200 text-center text-xl outline-none focus:ring-2 focus:ring-amber-500/20"
                     />
                   </div>
                   <div className="col-span-1 md:col-span-2">
                     <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-2">Tile Label / Title</label>
                     <input 
                       type="text" 
                       required
                       value={newTile.name}
                       onChange={e => setNewTile(prev => ({ ...prev, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                       placeholder="MPSC Special"
                       className="w-full bg-white px-4 py-3 rounded-xl border border-neutral-200 outline-none text-xs font-bold text-neutral-800 placeholder-neutral-400 focus:ring-2 focus:ring-amber-500/20 font-sans"
                     />
                   </div>
                   <div>
                     <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-2">Sort Position</label>
                     <input 
                       type="number" 
                       required
                       value={newTile.order}
                       onChange={e => setNewTile(prev => ({ ...prev, order: Number(e.target.value) }))}
                       placeholder="1"
                       className="w-full bg-white px-4 py-3 rounded-xl border border-neutral-200 outline-none text-xs font-bold text-neutral-800 placeholder-neutral-400 focus:ring-2 focus:ring-amber-500/20 font-sans"
                     />
                   </div>
                 </div>

                 <div>
                   <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-2">Google Drive Image URL (Optional - Overrides Emoji)</label>
                   <input 
                     type="url" 
                     value={newTile.googleDriveUrl}
                     onChange={e => setNewTile(prev => ({ ...prev, googleDriveUrl: e.target.value }))}
                     placeholder="https://drive.google.com/file/d/YOUR_FILE_ID/view"
                     className="w-full bg-white px-4 py-3 rounded-xl border border-neutral-200 outline-none text-xs font-bold text-neutral-800 placeholder-neutral-400 focus:ring-2 focus:ring-amber-500/20 font-sans"
                   />
                   <p className="text-[9px] text-zinc-400 mt-1 font-mono uppercase font-black tracking-tight leading-none">Enter shared Google Drive view link to use custom visual graphics.</p>
                 </div>

                 <div className="flex justify-between items-center pt-2">
                   <p className="text-[10px] text-zinc-400 font-bold">
                     Auto Slug: <span className="text-amber-600 font-mono">/category/{newTile.slug || "---"}</span>
                   </p>
                   <button 
                     type="submit"
                     disabled={isSubmittingTile}
                     className="bg-neutral-950 hover:bg-neutral-900 text-white px-6 py-2.5 rounded-xl font-display font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-md disabled:opacity-50 font-sans"
                   >
                     {isSubmittingTile ? "Adding..." : "+ Create Tile"}
                   </button>
                 </div>
               </form>
             </div>

             {/* Tiles List */}
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
               {tiles.length === 0 ? (
                 <div className="bg-neutral-100/50 p-8 text-center rounded-3xl col-span-full border border-neutral-100 font-sans">
                    <p className="text-xs text-zinc-400 font-black uppercase tracking-wider">No dynamic tiles found. Home page falls back to default category SVGs.</p>
                 </div>
               ) : (
                 tiles.map((tile) => (
                   <div key={tile.id} className="bg-white border border-neutral-150 p-5 rounded-3xl text-center relative flex flex-col justify-between group hover:shadow-lg transition-all h-40">
                     <button 
                       onClick={() => handleDeleteTile(tile.id)}
                       className="absolute top-2 right-2 p-1.5 bg-rose-50 rounded-lg text-rose-500 hover:bg-rose-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                       <CloseIcon size={12} />
                     </button>
                     <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                       {tile.googleDriveUrl || tile.imageUrl ? (
                         <img 
                           src={getDriveImageUrl(tile.googleDriveUrl || tile.imageUrl)} 
                           alt={tile.name} 
                           className="w-full h-full object-contain rounded-lg"
                           referrerPolicy="no-referrer"
                         />
                       ) : (
                         <div className="text-3xl select-none">{tile.emoji || "📚"}</div>
                       )}
                     </div>
                     <p className="font-display font-black text-xs text-neutral-900 leading-snug line-clamp-2">{tile.name}</p>
                     <span className="text-[8px] font-mono font-black text-neutral-400 uppercase tracking-widest mt-1 block">
                       POS: {tile.order} / slug: {tile.slug}
                     </span>
                   </div>
                 ))
               )}
             </div>
           </div>
         )}

         {activeTab === 'koboOffers' && (
            <div className="space-y-8 font-sans">
               <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm font-sans">
                  <div>
                     <h3 className="font-display font-bold text-xl text-[#5c0612] font-sans">Kobo Combo Offers</h3>
                     <p className="text-xs text-neutral-400 font-sans uppercase tracking-widest mt-1">Configure volume discount rules dynamically</p>
                  </div>
                  <button 
                    onClick={() => {
                      setEditingKoboOffer({ name: '', minQuantity: 2, discountAmount: 200, enabled: true, autoApply: true, stackable: false, applicableCategorySlugs: [], applicableBookIds: [] });
                      setIsKoboOfferModalOpen(true);
                    }}
                    className="flex justify-center items-center gap-2 bg-[#5c0612] text-white px-6 py-3 rounded-xl font-display font-bold text-xs uppercase tracking-widest hover:scale-[1.02] shadow-lg shadow-neutral-950/20 active:scale-95 transition-all text-center border-none outline-none leading-none font-sans"
                  >
                     <Plus size={16} /> New Combo Offer
                  </button>
               </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
                   {koboOffers.map(o => (
                      <div key={o.id} className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm flex flex-col group relative overflow-hidden font-sans">
                         <div className="flex justify-between items-start mb-4">
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full",
                              o.enabled ? "bg-emerald-50 text-emerald-600" : "bg-neutral-100 text-neutral-400"
                            )}>
                               {o.enabled ? 'ACTIVE' : 'DISABLED'}
                            </span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => { setEditingKoboOffer(o); setIsKoboOfferModalOpen(true); }} className="p-1.5 hover:text-[#5c0612] text-neutral-400"><Edit size={16} /></button>
                               <button onClick={() => handleDeleteKoboOffer(o.id)} className="p-1.5 hover:text-rose-500 text-neutral-400"><Trash2 size={16} /></button>
                            </div>
                         </div>

                         <h4 className="font-display font-bold text-lg text-neutral-900 mb-1 font-sans">{o.name}</h4>
                         <div className="bg-[#5c0612]/5 text-[#5c0612] p-4 rounded-xl font-bold my-4 text-sm flex justify-between items-center font-sans">
                            <span>Buy {o.minQuantity}+ Books</span>
                            <span className="text-base font-black font-sans font-sans">₹{o.discountAmount} OFF</span>
                         </div>
                         
                         <div className="text-[10px] space-y-1 text-neutral-400 uppercase font-black tracking-widest mt-auto border-t border-neutral-50 pt-4 font-sans font-sans">
                            <div>Auto-Apply: <span className="text-neutral-700 font-extrabold">{o.autoApply ? 'YES' : 'NO'}</span></div>
                            <div>Stackable: <span className="text-neutral-700 font-extrabold">{o.stackable ? 'YES' : 'NO'}</span></div>
                            {o.expiryDate && <div>Expires: <span className="text-amber-600 font-extrabold">{new Date(o.expiryDate).toLocaleDateString()}</span></div>}
                         </div>
                      </div>
                   ))}
                   {koboOffers.length === 0 && (
                      <div className="col-span-full py-16 bg-white rounded-[2rem] border border-dashed border-neutral-200 text-center opacity-60">
                         <Percent size={40} className="mx-auto text-neutral-300 mb-2" />
                         <p className="font-bold text-xs uppercase tracking-widest font-sans">No combo offers found</p>
                      </div>
                   )}
                </div>

                {/* Kobo Offer Modal */}
                <AnimatePresence>
                   {isKoboOfferModalOpen && (
                      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 font-sans">
                         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsKoboOfferModalOpen(false)} className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm" />
                         <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto font-sans">
                            <div className="flex justify-between items-center mb-6">
                               <h4 className="font-display font-bold text-xl">{editingKoboOffer?.id ? 'Edit Combo Offer' : 'New Combo Offer'}</h4>
                               <button type="button" onClick={() => setIsKoboOfferModalOpen(false)} className="p-1 hover:bg-neutral-100 rounded-full"><CloseIcon size={20} /></button>
                            </div>
                            <form onSubmit={handleKoboOfferSubmit} className="space-y-4">
                               <div>
                                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#5c0612] mb-1.5 font-sans">Offer Name</label>
                                  <input required type="text" value={editingKoboOffer?.name || ''} onChange={e => setEditingKoboOffer(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-neutral-50 px-4 py-3 rounded-xl border border-neutral-100 font-bold text-sm font-sans" placeholder="Gold Batch Scheme" />
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                  <div>
                                     <label className="block text-[10px] font-black uppercase tracking-widest text-[#5c0612] mb-1.5 font-sans">Min Quantity</label>
                                     <input required type="number" min={1} value={editingKoboOffer?.minQuantity ?? 2} onChange={e => setEditingKoboOffer(prev => ({ ...prev, minQuantity: Number(e.target.value) }))} className="w-full bg-neutral-50 px-4 py-3 rounded-xl border border-neutral-100 font-bold text-sm" />
                                  </div>
                                  <div>
                                     <label className="block text-[10px] font-black uppercase tracking-widest text-[#5c0612] mb-1.5 font-sans font-black font-sans">Discount Amount (₹)</label>
                                     <input required type="number" min={0} value={editingKoboOffer?.discountAmount ?? 200} onChange={e => setEditingKoboOffer(prev => ({ ...prev, discountAmount: Number(e.target.value) }))} className="w-full bg-neutral-50 px-4 py-3 rounded-xl border border-neutral-100 font-bold text-sm" />
                                  </div>
                               </div>
                               <div>
                                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#5c0612] mb-1.5 font-sans">Expiry Date (Optional)</label>
                                  <input type="date" value={editingKoboOffer?.expiryDate || ''} onChange={e => setEditingKoboOffer(prev => ({ ...prev, expiryDate: e.target.value }))} className="w-full bg-neutral-50 px-4 py-3 rounded-xl border border-neutral-100 font-bold text-sm" />
                               </div>
                               <div className="flex flex-col gap-2 p-4 bg-neutral-50 rounded-xl">
                                  <label className="flex items-center gap-3 font-sans text-xs font-black uppercase tracking-wider text-neutral-600 cursor-pointer">
                                     <input type="checkbox" checked={editingKoboOffer?.enabled ?? true} onChange={e => setEditingKoboOffer(prev => ({ ...prev, enabled: e.target.checked }))} className="w-4 h-4 accent-[#5c0612]" />
                                     Enable Offer
                                  </label>
                                  <label className="flex items-center gap-3 font-sans text-xs font-black uppercase tracking-wider text-neutral-600 cursor-pointer">
                                     <input type="checkbox" checked={editingKoboOffer?.stackable ?? false} onChange={e => setEditingKoboOffer(prev => ({ ...prev, stackable: e.target.checked }))} className="w-4 h-4 accent-[#5c0612]" />
                                     Stackable with coupon codes
                                  </label>
                                  <label className="flex items-center gap-3 font-sans text-xs font-black uppercase tracking-wider text-neutral-600 cursor-pointer">
                                     <input type="checkbox" checked={editingKoboOffer?.autoApply ?? true} onChange={e => setEditingKoboOffer(prev => ({ ...prev, autoApply: e.target.checked }))} className="w-4 h-4 accent-[#5c0612]" />
                                     Auto apply at checkout
                                  </label>
                               </div>

                               <button type="submit" className="w-full bg-[#5c0612] text-white py-4 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-[#40040c]">
                                  Save Offer
                               </button>
                            </form>
                         </motion.div>
                      </div>
                   )}
                </AnimatePresence>
            </div>
         )}

         {activeTab === 'studySets' && (
            <div className="space-y-8 font-sans">
               <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm font-sans font-sans">
                  <div>
                     <h3 className="font-display font-bold text-xl text-[#5c0612] leading-none">Batch-Wise Study Sets</h3>
                     <p className="text-xs text-neutral-400 font-sans uppercase tracking-widest mt-2 font-sans">Bundle individual books into premium high-conversion suites</p>
                  </div>
                  <button 
                    onClick={() => {
                      setEditingStudySet({ title: '', description: '', price: 999, originalPrice: 1500, discount: 35, imageUrl: '', bookIds: [], isFeatured: true, category: 'MPSC', topLabel: 'MPSC SPECIAL SET', statusBadge: 'Popular', stats: '4.8K Students', type: 'batch' });
                      setIsStudySetModalOpen(true);
                    }}
                    className="flex justify-center items-center gap-2 bg-[#5c0612] text-white px-6 py-3 rounded-xl font-display font-bold text-xs uppercase tracking-widest hover:scale-[1.02] shadow-lg shadow-[#5c0612]/20 active:scale-95 transition-all text-center border-none outline-none leading-none font-sans"
                  >
                     <Plus size={16} /> New Study Set
                  </button>
               </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
                   {studySets.map(s => (
                      <div key={s.id} className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm flex flex-col group relative overflow-hidden font-sans">
                         <div className="flex justify-between items-start mb-4">
                            <span className="text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 px-2.5 py-1 rounded">
                               {s.category}
                            </span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity font-sans">
                               <button onClick={() => { setEditingStudySet(s); setIsStudySetModalOpen(true); }} className="p-1.5 hover:text-[#5c0612] text-neutral-400"><Edit size={16} /></button>
                               <button onClick={() => handleDeleteStudySet(s.id)} className="p-1.5 hover:text-rose-500 text-neutral-400"><Trash2 size={16} /></button>
                            </div>
                         </div>

                         {s.imageUrl && (
                            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-100 mb-4 border border-neutral-100 relative">
                               <img src={getDriveImageUrl(s.imageUrl)} className="w-full h-full object-cover animate-none" alt="Bundle preview" referrerPolicy="no-referrer" />
                            </div>
                         )}

                         <h4 className="font-display font-bold text-lg text-neutral-900 mb-1 leading-snug font-sans">{s.title}</h4>
                         <p className="text-xs text-neutral-400 mb-4 line-clamp-2 font-sans">{s.description || 'No description provided.'}</p>
                         
                         <div className="text-lg font-black text-[#5c0612] mb-4 flex items-baseline gap-2 font-sans font-sans">
                            ₹{s.price} 
                            <span className="text-xs font-normal line-through text-neutral-400">₹{s.originalPrice}</span>
                            <span className="text-xs font-bold text-emerald-600 font-sans">({s.discount}% OFF)</span>
                         </div>

                         <div className="text-[10px] space-y-1 text-neutral-500 uppercase font-bold tracking-widest mt-auto border-t border-neutral-50 pt-4 font-sans font-sans">
                            <div>Books in Set: <span className="text-[#5c0612] font-black">{s.bookIds?.length || 0} Books</span></div>
                            <div>Type: <span className="text-[#5c0612] font-black uppercase">{s.type === 'combo' ? 'Combo Offer' : 'Batch Set'}</span></div>
                            <div>Category: <span className="text-neutral-700 font-extrabold">{s.category}</span></div>
                            <div>Label: <span className="text-neutral-700 font-extrabold">{s.topLabel}</span></div>
                         </div>
                      </div>
                   ))}
                   {studySets.length === 0 && (
                      <div className="col-span-full py-16 bg-white rounded-[2rem] border border-dashed border-neutral-200 text-center opacity-60 font-sans font-sans">
                         <Grid size={40} className="mx-auto text-neutral-300 mb-2" />
                         <p className="font-bold text-xs uppercase tracking-widest font-sans font-sans">No custom study sets found</p>
                      </div>
                   )}
                </div>

                {/* Study Set Modal */}
                <AnimatePresence>
                   {isStudySetModalOpen && (
                      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 font-sans">
                         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsStudySetModalOpen(false)} className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm shadow-sm" />
                         <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto font-sans font-sans">
                            <div className="flex justify-between items-center mb-6">
                               <h4 className="font-display font-bold text-xl font-sans">{editingStudySet?.id ? 'Edit Study Set' : 'New Study Set'}</h4>
                               <button type="button" onClick={() => setIsStudySetModalOpen(false)} className="p-1 hover:bg-neutral-100 rounded-full font-sans"><CloseIcon size={20} /></button>
                            </div>
                            <form onSubmit={handleStudySetSubmit} className="space-y-4 font-sans">
                               <div className="grid grid-cols-2 gap-4">
                                  <div>
                                     <label className="block text-[10px] font-black uppercase tracking-widest text-[#5c0612] mb-1.5 font-sans font-black">Set Title</label>
                                     <input required type="text" value={editingStudySet?.title || ''} onChange={e => setEditingStudySet(prev => ({ ...prev, title: e.target.value }))} className="w-full bg-neutral-50 px-4 py-3 rounded-xl border border-neutral-100 font-bold text-sm" />
                                  </div>
                                  <div>
                                     <label className="block text-[10px] font-black uppercase tracking-widest text-[#5c0612] mb-1.5 font-sans font-black">Set Type</label>
                                     <select required value={editingStudySet?.type || 'batch'} onChange={e => setEditingStudySet(prev => ({ ...prev, type: e.target.value as 'combo' | 'batch' }))} className="w-full bg-neutral-50 px-4 py-3 rounded-xl border border-neutral-100 font-bold text-sm font-sans">
                                        <option value="batch">Batch Set</option>
                                        <option value="combo">Combo Offer</option>
                                     </select>
                                  </div>
                                  <div>
                                     <label className="block text-[10px] font-black uppercase tracking-widest text-[#5c0612] mb-1.5 font-sans">Category Tab (e.g. MPSC, UPSC)</label>
                                     <select required value={editingStudySet?.category || ''} onChange={e => setEditingStudySet(prev => ({ ...prev, category: e.target.value }))} className="w-full bg-neutral-50 px-4 py-3 rounded-xl border border-neutral-100 font-bold text-sm font-sans">
                                        <option value="MPSC font-sans">MPSC</option>
                                        <option value="MPPSC font-sans">MPPSC</option>
                                        <option value="UPSC font-sans">UPSC</option>
                                        <option value="Banking font-sans">Banking</option>
                                        <option value="Police Bharti">Police Bharti</option>
                                        <option value="Foundation">Foundation</option>
                                        <option value="Subject-wise">Subject-wise</option>
                                     </select>
                                  </div>
                               </div>

                               <div className="grid grid-cols-3 gap-4 font-sans">
                                  <div>
                                     <label className="block text-[10px] font-black uppercase tracking-widest text-[#5c0612] mb-1.5 font-sans font-black">Price (₹)</label>
                                     <input required type="number" value={editingStudySet?.price ?? 0} onChange={e => {
                                       const p = Number(e.target.value);
                                       const op = editingStudySet?.originalPrice || p;
                                       const disc = op > 0 ? Math.round(((op - p) / op) * 100) : 0;
                                       setEditingStudySet(prev => ({ ...prev, price: p, discount: disc }));
                                     }} className="w-full bg-neutral-50 px-4 py-3 rounded-xl border border-neutral-100 font-bold text-sm" />
                                  </div>
                                  <div>
                                     <label className="block text-[10px] font-black uppercase tracking-widest text-[#5c0612] mb-1.5 font-sans font-black">Original Price (₹)</label>
                                     <input required type="number" value={editingStudySet?.originalPrice ?? 0} onChange={e => {
                                       const op = Number(e.target.value);
                                       const p = editingStudySet?.price ?? op;
                                       const disc = op > 0 ? Math.round(((op - p) / op) * 100) : 0;
                                       setEditingStudySet(prev => ({ ...prev, originalPrice: op, discount: disc }));
                                     }} className="w-full bg-[#fcfcfc] px-4 py-3 rounded-xl border border-neutral-100 font-bold text-sm" />
                                  </div>
                                  <div>
                                     <label className="block text-[10px] font-black uppercase tracking-widest text-[#5c0612] mb-1.5 font-sans font-black">Discount (%)</label>
                                     <input readOnly type="number" value={editingStudySet?.discount ?? 0} className="w-full bg-neutral-100 px-4 py-3 rounded-xl border border-neutral-200 font-bold text-sm text-neutral-400" />
                                  </div>
                               </div>

                               <div className="grid grid-cols-3 gap-4 font-sans text-xs">
                                  <div>
                                     <label className="block text-[10px] font-black uppercase tracking-widest text-[#5c0612] mb-1.5 font-sans">Top Label</label>
                                     <input type="text" value={editingStudySet?.topLabel || ''} onChange={e => setEditingStudySet(prev => ({ ...prev, topLabel: e.target.value }))} className="w-full bg-neutral-50 px-4 py-3 rounded-xl border border-neutral-100 font-bold text-sm font-sans font-sans" placeholder="MPSC SPECIAL SET" />
                                  </div>
                                  <div>
                                     <label className="block text-[10px] font-black uppercase tracking-widest text-[#5c0612] mb-1.5 font-sans font-black font-sans">Status Badge</label>
                                     <input type="text" value={editingStudySet?.statusBadge || ''} onChange={e => setEditingStudySet(prev => ({ ...prev, statusBadge: e.target.value }))} className="w-full bg-neutral-50 px-4 py-3 rounded-xl border border-neutral-100 font-bold text-sm font-sans" placeholder="Best Seller" />
                                  </div>
                                  <div>
                                     <label className="block text-[10px] font-black uppercase tracking-widest text-[#5c0612] mb-1.5 font-sans font-black">Social Stats</label>
                                     <input type="text" value={editingStudySet?.stats || ''} onChange={e => setEditingStudySet(prev => ({ ...prev, stats: e.target.value }))} className="w-full bg-neutral-50 px-4 py-3 rounded-xl border border-neutral-100 font-bold text-sm font-sans font-sans" placeholder="4.8K Students" />
                                  </div>
                               </div>

                               <div>
                                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#5c0612] mb-1.5 font-sans font-black">Description (Max 2 short lines)</label>
                                  <input type="text" value={editingStudySet?.description || ''} onChange={e => setEditingStudySet(prev => ({ ...prev, description: e.target.value }))} className="w-full bg-[#fbfbfb] px-4 py-3 rounded-xl border border-neutral-100 font-bold text-sm font-sans" />
                               </div>

                               <div>
                                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#5c0612] mb-1.5 font-sans font-black">Google Drive Image URL</label>
                                  <input required type="text" value={editingStudySet?.imageUrl || ''} onChange={e => setEditingStudySet(prev => ({ ...prev, imageUrl: e.target.value }))} className="w-full bg-[#fbfbfb] px-4 py-3 rounded-xl border border-[#ececec] font-bold text-sm font-sans" placeholder="Stacked Mockup Drive Link" />
                               </div>

                               <div>
                                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#5c0612] mb-2 font-black font-sans">Select Books in this Set</label>
                                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto bg-[#fafafa] p-4 rounded-xl border border-[#ededed]">
                                     {books.map(b => {
                                       const isChecked = editingStudySet?.bookIds?.includes(b.id) ?? false;
                                       return (
                                         <label key={b.id} className="flex items-center gap-2 text-xs font-bold font-sans cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis">
                                           <input type="checkbox" checked={isChecked} onChange={e => {
                                             const currentIds = editingStudySet?.bookIds || [];
                                             const newIds = e.target.checked 
                                               ? [...currentIds, b.id]
                                               : currentIds.filter(id => id !== b.id);
                                             setEditingStudySet(prev => ({ ...prev, bookIds: newIds }));
                                           }} className="w-4 h-4 accent-[#5c0612]" />
                                           {b.title}
                                         </label>
                                       );
                                     })}
                                     {books.length === 0 && <span className="text-[10px] text-neutral-400 uppercase font-black font-sans font-sans">No products added yet</span>}
                                  </div>
                               </div>

                               <button type="submit" className="w-full bg-[#5c0612] text-white py-4 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-[#40040c]">
                                  Save Study Set
                               </button>
                            </form>
                         </motion.div>
                      </div>
                   )}
                </AnimatePresence>
            </div>
         )}

         {activeTab === 'coupons' && (
           <div className="space-y-8 font-sans">
             <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-neutral-100 shadow-sm">
               <h3 className="font-display font-bold text-2xl mb-2 text-neutral-900">Coupon Codes Manager</h3>
               <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-8">
                 Design and authorize public discounts visible to checkout shoppers, or private codes for direct promotions.
               </p>

               {/* Create Coupon Form */}
               <form onSubmit={handleAddCoupon} className="bg-neutral-50 p-6 md:p-8 rounded-3xl border border-neutral-100/60 max-w-4xl space-y-4">
                 <h4 className="font-display font-extrabold text-sm uppercase tracking-wider text-neutral-900">Add New Coupon Code</h4>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <div>
                     <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-2">Coupon Code</label>
                     <input 
                       type="text" 
                       required
                       value={newCoupon.code}
                       onChange={e => setNewCoupon(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                       placeholder="SACHIN30"
                       className="w-full bg-white px-4 py-3 rounded-xl border border-neutral-200 outline-none text-xs font-bold text-neutral-800 placeholder-neutral-400 uppercase focus:ring-2 focus:ring-amber-500/20"
                     />
                   </div>
                   <div>
                     <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-2 font-sans">Discount Type</label>
                     <select 
                       value={newCoupon.discountType}
                       onChange={e => setNewCoupon(prev => ({ ...prev, discountType: e.target.value }))}
                       className="w-full bg-white px-4 py-3 rounded-xl border border-neutral-200 outline-none text-xs font-bold text-neutral-800 focus:ring-2 focus:ring-amber-500/20 font-sans"
                     >
                       <option value="percentage">Percentage (%)</option>
                       <option value="flat">Flat Discount (₹)</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-2">Value</label>
                     <input 
                       type="number" 
                       required
                       value={newCoupon.discountValue}
                       onChange={e => setNewCoupon(prev => ({ ...prev, discountValue: Number(e.target.value) }))}
                       placeholder="15"
                       className="w-full bg-white px-4 py-3 rounded-xl border border-neutral-200 outline-none text-xs font-bold text-neutral-800 placeholder-neutral-400 focus:ring-2 focus:ring-amber-500/20 font-sans"
                     />
                   </div>
                   <div>
                     <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-2">Minimum Basket ₹</label>
                     <input 
                       type="number" 
                       required
                       value={newCoupon.minCartValue}
                       onChange={e => setNewCoupon(prev => ({ ...prev, minCartValue: Number(e.target.value) }))}
                       placeholder="0"
                       className="w-full bg-white px-4 py-3 rounded-xl border border-neutral-200 outline-none text-xs font-bold text-neutral-800 placeholder-neutral-400 focus:ring-2 focus:ring-amber-500/20 font-sans"
                     />
                   </div>
                 </div>

                 {/* Checkboxes for public and active status */}
                 <div className="flex flex-wrap gap-8 pt-2">
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input 
                       type="checkbox"
                       checked={newCoupon.isPublic}
                       onChange={e => setNewCoupon(prev => ({ ...prev, isPublic: e.target.checked }))}
                       className="rounded border-zinc-300 text-amber-500 focus:ring-amber-500/10 font-sans"
                     />
                     <span className="text-[11px] font-bold text-zinc-600 uppercase">Make Public (Visible in checkout drawer)</span>
                   </label>

                   <label className="flex items-center gap-2 cursor-pointer font-sans">
                     <input 
                       type="checkbox"
                       checked={newCoupon.active}
                       onChange={e => setNewCoupon(prev => ({ ...prev, active: e.target.checked }))}
                       className="rounded border-zinc-300 text-amber-500 focus:ring-amber-500/10"
                     />
                     <span className="text-[11px] font-bold text-zinc-600 uppercase">Is Active / Redeemable</span>
                   </label>
                 </div>

                 <div className="flex justify-end pt-2 border-t border-neutral-100 font-sans">
                   <button 
                     type="submit"
                     disabled={isSubmittingCoupon}
                     className="bg-neutral-950 hover:bg-neutral-900 text-white px-8 py-3 rounded-xl font-display font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-md disabled:opacity-50"
                   >
                     {isSubmittingCoupon ? "Saving..." : "+ Register Coupon"}
                   </button>
                 </div>
               </form>
             </div>

             {/* Coupons Grid */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {coupons.length === 0 ? (
                 <div className="bg-neutral-100/50 p-8 text-center rounded-3xl col-span-full border border-neutral-100">
                    <p className="text-xs text-zinc-400 font-black uppercase tracking-wider font-sans">No Coupons found. Create one above to activate discounts.</p>
                 </div>
               ) : (
                 coupons.map((coupon) => (
                   <div key={coupon.id} className="bg-white border border-neutral-150 p-8 rounded-[2rem] relative flex flex-col justify-between group hover:shadow-xl transition-all h-52">
                     <button 
                       onClick={() => handleDeleteCoupon(coupon.id)}
                       className="absolute top-4 right-4 p-2 bg-rose-50 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity font-sans"
                     >
                       <Trash2 size={14} />
                     </button>
                     
                     <div className="font-sans">
                       <div className="flex gap-2 items-center mb-4">
                         <span className="px-3 py-1 bg-red-950 text-orange-400 font-mono font-extrabold text-xs tracking-wider rounded-lg uppercase">
                           {coupon.code}
                         </span>
                         {coupon.isPublic ? (
                           <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-extrabold rounded-md uppercase">PUBLIC</span>
                         ) : (
                           <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-[9px] font-extrabold rounded-md uppercase font-sans">PRIVATE / HIDDEN</span>
                         )}
                         {!coupon.active && (
                           <span className="px-2 py-0.5 bg-rose-50 text-rose-500 text-[9px] font-extrabold rounded-md uppercase">DISABLED</span>
                         )}
                       </div>

                       <p className="font-display font-black text-2xl text-red-950 leading-none">
                         {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                       </p>
                       <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide mt-2">
                         Min Basket Value: ₹{coupon.minCartValue || 0}
                       </p>
                     </div>
                   </div>
                 ))
               )}
             </div>
           </div>
         )}

        {activeTab === 'overview' && (
           <div className="space-y-10">
              {/* Modern Dashboard Tiles */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { 
                    label: 'Book Wise', 
                    val: books.length, 
                    sub: 'Total Catalog Size', 
                    icon: <Box className="text-white" />, 
                    color: 'bg-blue-600',
                    chart: books.slice(0, 5).map((b, i) => ({ n: i, v: b.stockQuantity })),
                    onClick: () => setActiveTab('books')
                  },
                  { 
                    label: 'Category Wise', 
                    val: categories.length, 
                    sub: 'Active Categories', 
                    icon: <Tag className="text-white" />, 
                    color: 'bg-emerald-600',
                    chart: categories.slice(0, 5).map((c, i) => ({ n: i, v: books.filter(b => b.category === c.slug).length })),
                    onClick: () => setActiveTab('categories')
                  },
                  { 
                    label: 'Subject Wise', 
                    val: subjects.length, 
                    sub: 'Specific Subjects', 
                    icon: <BookOpen className="text-white" />, 
                    color: 'bg-amber-600',
                    chart: subjects.slice(0, 5).map((s, i) => ({ n: i, v: books.filter(b => b.subject === s.slug).length })),
                    onClick: () => setActiveTab('subjects')
                  },
                  { 
                    label: 'Book Types', 
                    val: `${books.filter(b => b.type === 'New').length}/${books.filter(b => b.type === 'Old').length}`, 
                    sub: 'New vs Old Collection', 
                    icon: <TrendingUp className="text-white" />, 
                    color: 'bg-purple-600',
                    chart: [
                      { n: 'New', v: books.filter(b => b.type === 'New').length },
                      { n: 'Old', v: books.filter(b => b.type === 'Old').length }
                    ],
                    onClick: () => setActiveTab('books')
                  }
                ].map((stat, idx) => (
                  <motion.div 
                    key={idx}
                    whileHover={{ y: -10 }}
                    onClick={stat.onClick}
                    className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm hover:shadow-2xl transition-all cursor-pointer overflow-hidden relative group"
                  >
                     <div className={`absolute top-0 right-0 w-32 h-32 ${stat.color} opacity-[0.03] blur-3xl rounded-full -mr-16 -mt-16`} />
                     <div className="flex items-center justify-between mb-8">
                        <div className={`p-4 ${stat.color} rounded-2xl shadow-lg shadow-${stat.color.split('-')[1]}-500/20`}>
                           {stat.icon}
                        </div>
                        <div className="h-10 w-20">
                           <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={stat.chart}>
                                 <Bar dataKey="v" fill="currentColor" className={stat.color.replace('bg-', 'text-')} radius={[2, 2, 0, 0]} />
                              </BarChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-1">{stat.label}</p>
                     <p className="text-4xl font-display font-bold text-neutral-900 mb-2">{stat.val}</p>
                     <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{stat.sub}</p>
                  </motion.div>
                ))}
              </div>

              {/* Data Visualization Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                 <div className="lg:col-span-8 bg-white rounded-[3rem] p-10 border border-neutral-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-10">
                       <div>
                          <h3 className="font-display font-bold text-2xl">Category Distribution</h3>
                          <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest mt-1">Number of books per category</p>
                       </div>
                       <button className="p-3 bg-neutral-50 rounded-xl hover:bg-neutral-900 hover:text-white transition-all">
                          <ExternalLink size={18} />
                       </button>
                    </div>
                    
                    <div className="h-[300px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={categories.map(c => ({ name: c.name, count: books.filter(b => b.category === c.slug).length }))}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                             <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#A3A3A3' }} dy={10} />
                             <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#A3A3A3' }} />
                             <Tooltip 
                               contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                               cursor={{ fill: '#F59E0B', opacity: 0.1 }}
                             />
                             <Bar dataKey="count" fill="#F59E0B" radius={[8, 8, 0, 0]} barSize={40} />
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                 </div>

                 <div className="lg:col-span-4 bg-white rounded-[3rem] p-10 border border-neutral-100 shadow-sm flex flex-col">
                    <h3 className="font-display font-bold text-2xl mb-2">Book Condition</h3>
                    <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest mb-10">Inventory Share</p>
                    
                    <div className="h-[250px] w-full relative">
                       <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                             <Pie
                               data={[
                                 { name: 'New Books', value: books.filter(b => b.type === 'New').length },
                                 { name: 'Old Books', value: books.filter(b => b.type === 'Old').length }
                               ]}
                               innerRadius={60}
                               outerRadius={80}
                               paddingAngle={5}
                               dataKey="value"
                             >
                                <Cell fill="#F59E0B" />
                                <Cell fill="#171717" />
                             </Pie>
                             <Tooltip />
                          </PieChart>
                       </ResponsiveContainer>
                       <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-3xl font-display font-bold">{books.length}</span>
                          <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Total</span>
                       </div>
                    </div>

                    <div className="mt-auto space-y-4">
                       <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl">
                          <div className="flex items-center gap-3">
                             <div className="w-3 h-3 bg-amber-500 rounded-full" />
                             <span className="text-xs font-bold font-display">New Books</span>
                          </div>
                          <span className="font-display font-bold">{books.filter(b => b.type === 'New').length}</span>
                       </div>
                       <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl">
                          <div className="flex items-center gap-3">
                             <div className="w-3 h-3 bg-neutral-900 rounded-full" />
                             <span className="text-xs font-bold font-display">Old Books</span>
                          </div>
                          <span className="font-display font-bold">{books.filter(b => b.type === 'Old').length}</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Recent Orders List */}
              <div className="bg-white rounded-[3rem] p-10 border border-neutral-100 shadow-sm transition-all hover:shadow-xl group">
                 <div className="flex items-center justify-between mb-10">
                    <div>
                       <h3 className="font-display font-bold text-2xl">Sales Activity</h3>
                       <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest mt-1">Last 5 transaction records</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('orders')}
                      className="px-6 py-2 bg-neutral-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-black transition-all"
                    >
                      View All Activity
                    </button>
                 </div>
                 
                 <div className="space-y-4">
                    {orders.slice(0, 5).map(order => (
                      <div key={order.id} className="flex items-center justify-between p-6 bg-neutral-50 rounded-[2rem] border border-transparent hover:border-neutral-200 transition-all cursor-pointer group/row">
                         <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-white border border-neutral-100 flex items-center justify-center font-display font-bold text-xs text-amber-600 shadow-sm group-hover/row:scale-110 transition-transform">
                              #{order.id.substring(0, 4).toUpperCase()}
                            </div>
                            <div>
                               <p className="font-display font-bold text-neutral-900 text-lg group-hover/row:text-amber-600 transition-colors">{order.address?.fullName}</p>
                               <p className="text-[10px] text-neutral-400 uppercase font-black tracking-widest leading-tight mt-1">
                                 {order.items.length} Products • {new Date(order.createdAt).toLocaleDateString()}
                               </p>
                            </div>
                         </div>
                         <div className="flex items-center gap-12">
                            <div className="text-right">
                               <p className="text-xl font-display font-bold">{formatPrice(order.total)}</p>
                               <span className={cn(
                                 "text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded",
                                 order.paymentStatus === 'success' ? "text-green-500" : "text-amber-500"
                               )}>
                                 {order.paymentStatus || 'Pending'}
                               </span>
                            </div>
                            <span className={cn(
                              "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                              order.status === 'delivered' ? "bg-green-100 text-green-700" :
                              order.status === 'cancelled' ? "bg-rose-100 text-rose-700" :
                              "bg-amber-500 text-black"
                            )}>
                              {order.status}
                            </span>
                         </div>
                      </div>
                    ))}
                    {orders.length === 0 && (
                       <div className="py-20 text-center opacity-40">
                          <ShoppingCart size={48} className="mx-auto mb-4 text-neutral-300" />
                          <p className="font-display font-bold uppercase tracking-widest text-[10px]">No sales recorded yet</p>
                       </div>
                    )}
                 </div>
              </div>
           </div>
        )}
      </main>

      {selectedLabelOrder && (
        <CourierLabelModal 
          order={selectedLabelOrder} 
          onClose={() => setSelectedLabelOrder(null)} 
        />
      )}
    </div>
  );
}
