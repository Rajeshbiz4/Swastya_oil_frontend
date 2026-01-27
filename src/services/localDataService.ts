// Local Data Service - Manages all local data storage for Booking and Procurement

// Types
export interface TankerBooking {
  _id: string;
  bookingDate: string;
  tankerCapacity: number;
  rate: number;
  bookingAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: 'Pending' | 'PartiallyPaid' | 'Completed';
  remarks?: string;
  createdAt: string;
}

export interface OilPurchase {
  _id: string;
  bookingId?: string;
  supplierName: string;
  quantity: number;
  ratePerLiter: number;
  totalAmount: number;
  paymentMode: string;
  invoiceNumber: string;
  invoiceDate: string;
  deliveryDate: string;
  isPaid: boolean;
  createdAt: string;
}

// LocalStorage keys
const BOOKINGS_STORAGE_KEY = 'tanker_bookings';
const OIL_PURCHASES_STORAGE_KEY = 'oil_purchases';

// ==================== BOOKINGS ====================

// Get all bookings
export const getAllBookings = (): TankerBooking[] => {
  try {
    const stored = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    const bookings = stored ? JSON.parse(stored) : [];
    // Sort by booking date descending (newest first)
    return bookings.sort((a: TankerBooking, b: TankerBooking) => 
      new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime()
    );
  } catch {
    return [];
  }
};

// Get pending bookings (status is 'Pending' or 'PartiallyPaid')
export const getPendingBookings = (): TankerBooking[] => {
  const allBookings = getAllBookings();
  return allBookings.filter(b => b.status === 'Pending' || b.status === 'PartiallyPaid');
};

// Get bookings filtered by date range
export const getBookingsByDateRange = (
  startDate?: string, 
  endDate?: string
): TankerBooking[] => {
  const allBookings = getAllBookings();
  
  if (!startDate && !endDate) {
    return allBookings;
  }

  return allBookings.filter(booking => {
    const bookingDateStr = booking.bookingDate.split('T')[0];
    
    if (startDate && endDate) {
      return bookingDateStr >= startDate && bookingDateStr <= endDate;
    } else if (startDate) {
      return bookingDateStr >= startDate;
    } else if (endDate) {
      return bookingDateStr <= endDate;
    }
    return true;
  });
};

// Get booking by ID
export const getBookingById = (id: string): TankerBooking | undefined => {
  const allBookings = getAllBookings();
  return allBookings.find(b => b._id === id);
};

// Create a new booking
export const createBooking = (bookingData: {
  bookingDate: string;
  tankerCapacity: number;
  rate: number;
  bookingAmount: number;
  remarks?: string;
}): TankerBooking => {
  // Use the provided bookingAmount (default to 0 if not provided)
  const amount = bookingData.bookingAmount || 0;
  
  const newBooking: TankerBooking = {
    _id: generateId('booking'),
    bookingDate: bookingData.bookingDate,
    tankerCapacity: bookingData.tankerCapacity,
    rate: bookingData.rate,
    bookingAmount: amount,
    paidAmount: 0,
    pendingAmount: amount, // pendingAmount equals bookingAmount initially
    status: 'Pending',
    remarks: bookingData.remarks || undefined,
    createdAt: new Date().toISOString(),
  };
  
  const existingBookings = getAllBookings();
  const updatedBookings = [newBooking, ...existingBookings];
  localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updatedBookings));
  
  return newBooking;
};

// Update booking (used when oil purchase is made against a booking)
export const updateBookingPayment = (
  bookingId: string, 
  paymentAmount: number
): TankerBooking | null => {
  const allBookings = getAllBookings();
  const bookingIndex = allBookings.findIndex(b => b._id === bookingId);
  
  if (bookingIndex === -1) {
    return null;
  }
  
  const booking = allBookings[bookingIndex];
  const newPaidAmount = (booking.paidAmount || 0) + paymentAmount;
  const newPendingAmount = booking.bookingAmount - newPaidAmount;
  
  const updatedBooking: TankerBooking = {
    ...booking,
    paidAmount: newPaidAmount,
    pendingAmount: Math.max(0, newPendingAmount),
    status: newPendingAmount <= 0 ? 'Completed' : 'PartiallyPaid',
  };
  
  allBookings[bookingIndex] = updatedBooking;
  localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(allBookings));
  
  return updatedBooking;
};

// ==================== OIL PURCHASES ====================

// Get all oil purchases
export const getAllOilPurchases = (): OilPurchase[] => {
  try {
    const stored = localStorage.getItem(OIL_PURCHASES_STORAGE_KEY);
    const purchases = stored ? JSON.parse(stored) : [];
    // Sort by delivery date descending (newest first)
    return purchases.sort((a: OilPurchase, b: OilPurchase) => 
      new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime()
    );
  } catch {
    return [];
  }
};

// Get oil purchases filtered by date range
export const getOilPurchasesByDateRange = (
  startDate?: string, 
  endDate?: string
): OilPurchase[] => {
  const allPurchases = getAllOilPurchases();
  
  if (!startDate && !endDate) {
    return allPurchases;
  }

  return allPurchases.filter(purchase => {
    const deliveryDateStr = purchase.deliveryDate.split('T')[0];
    
    if (startDate && endDate) {
      return deliveryDateStr >= startDate && deliveryDateStr <= endDate;
    } else if (startDate) {
      return deliveryDateStr >= startDate;
    } else if (endDate) {
      return deliveryDateStr <= endDate;
    }
    return true;
  });
};

// Check if invoice number already exists
export const isInvoiceNumberExists = (invoiceNumber: string): boolean => {
  const allPurchases = getAllOilPurchases();
  return allPurchases.some(p => p.invoiceNumber === invoiceNumber.trim());
};

// Create a new oil purchase
export const createOilPurchase = (purchaseData: {
  bookingId?: string;
  supplierName: string;
  quantity: number;
  ratePerLiter: number;
  paymentMode: string;
  invoiceNumber: string;
  invoiceDate: string;
  deliveryDate: string;
}): OilPurchase => {
  const totalAmount = purchaseData.quantity * purchaseData.ratePerLiter;
  
  const newPurchase: OilPurchase = {
    _id: generateId('purchase'),
    bookingId: purchaseData.bookingId || undefined,
    supplierName: purchaseData.supplierName.trim(),
    quantity: purchaseData.quantity,
    ratePerLiter: purchaseData.ratePerLiter,
    totalAmount: totalAmount,
    paymentMode: purchaseData.paymentMode,
    invoiceNumber: purchaseData.invoiceNumber.trim(),
    invoiceDate: purchaseData.invoiceDate,
    deliveryDate: purchaseData.deliveryDate,
    isPaid: purchaseData.paymentMode === 'Cash',
    createdAt: new Date().toISOString(),
  };
  
  const existingPurchases = getAllOilPurchases();
  const updatedPurchases = [newPurchase, ...existingPurchases];
  localStorage.setItem(OIL_PURCHASES_STORAGE_KEY, JSON.stringify(updatedPurchases));
  
  // Update booking if linked
  if (purchaseData.bookingId) {
    updateBookingPayment(purchaseData.bookingId, totalAmount);
  }
  
  return newPurchase;
};

// ==================== UTILITY FUNCTIONS ====================

// Generate unique ID
const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get today's date in YYYY-MM-DD format
export const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Calculate date range for presets
export const getPresetDateRange = (preset: string): { startDate: string; endDate: string } => {
  const end = new Date();
  const start = new Date();
  
  switch (preset) {
    case 'today':
      return {
        startDate: end.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    case '7days':
      start.setDate(end.getDate() - 7);
      break;
    case '30days':
      start.setDate(end.getDate() - 30);
      break;
    case '90days':
      start.setDate(end.getDate() - 90);
      break;
    case 'thisMonth':
      start.setDate(1);
      break;
    default:
      start.setDate(end.getDate() - 30);
  }
  
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
};

// Export default object with all functions
const localDataService = {
  // Bookings
  getAllBookings,
  getPendingBookings,
  getBookingsByDateRange,
  getBookingById,
  createBooking,
  updateBookingPayment,
  
  // Oil Purchases
  getAllOilPurchases,
  getOilPurchasesByDateRange,
  isInvoiceNumberExists,
  createOilPurchase,
  
  // Utilities
  getTodayDate,
  getPresetDateRange,
};

export default localDataService;
