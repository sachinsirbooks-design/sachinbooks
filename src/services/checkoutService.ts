import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order } from '../types';

export const checkoutService = {
  async createOrder(order: Omit<Order, 'id'>) {
    // Sanitize undefined fields to prevent Firestore unsupported field value errors
    const sanitizedOrder = JSON.parse(JSON.stringify(order, (_, val) => {
      return val === undefined ? null : val;
    }));
    const docRef = await addDoc(collection(db, 'orders'), {
      ...sanitizedOrder,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  async getUserOrders(userId: string) {
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
  },

  async getAllOrders() {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
  },

  async updateOrder(id: string, updates: Partial<Order>) {
    const { doc, updateDoc } = await import('firebase/firestore');
    const docRef = doc(db, 'orders', id);
    return await updateDoc(docRef, updates);
  }
};
