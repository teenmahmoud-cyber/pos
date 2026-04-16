import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings, CartItem, Product, Customer } from './types';

interface AppState {
  settings: AppSettings;
  cart: CartItem[];
  selectedCustomer: Customer | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userRole: 'admin' | 'cashier' | null;
  setSettings: (settings: Partial<AppSettings>) => void;
  toggleTheme: () => void;
  toggleLanguage: () => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateCartQuantity: (productId: number, quantity: number) => void;
  updateCartDiscount: (productId: number, discount: number) => void;
  clearCart: () => void;
  setSelectedCustomer: (customer: Customer | null) => void;
  setLoading: (loading: boolean) => void;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  getCartSubtotal: () => number;
  getCartTotal: (vatRate: number) => { subtotal: number; vat: number; total: number };
}

const defaultSettings: AppSettings = {
  language: 'ar',
  theme: 'light',
  currency: 'OMR',
  vatRate: 5,
  shopName: 'متجر النجاح',
  shopPhone: '+96812345678',
  shopAddress: 'مسقط، سلطنة عمان',
};

const users = {
  admin: { password: 'admin123', role: 'admin' as const },
  cashier: { password: '1234', role: 'cashier' as const },
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      cart: [],
      selectedCustomer: null,
      isLoading: false,
      isAuthenticated: false, // Changed: require login by default
      userRole: null,

      setSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      toggleTheme: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            theme: state.settings.theme === 'light' ? 'dark' : 'light',
          },
        })),

      toggleLanguage: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            language: state.settings.language === 'ar' ? 'en' : 'ar',
          },
        })),

      addToCart: (product) =>
        set((state) => {
          const existingItem = state.cart.find((item) => item.product.id === product.id);
          if (existingItem) {
            return {
              cart: state.cart.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }
          return {
            cart: [...state.cart, { product, quantity: 1, discount: 0 }],
          };
        }),

      removeFromCart: (productId) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.product.id !== productId),
        })),

      updateCartQuantity: (productId, quantity) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item.product.id === productId
              ? { ...item, quantity: Math.max(0, quantity) }
              : item
          ),
        })),

      updateCartDiscount: (productId, discount) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item.product.id === productId ? { ...item, discount } : item
          ),
        })),

      clearCart: () => set({ cart: [], selectedCustomer: null }),

      setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),

      setLoading: (loading) => set({ isLoading: loading }),

      login: (username, password) => {
        const user = users[username as keyof typeof users];
        if (user && user.password === password) {
          set({ isAuthenticated: true, userRole: user.role as 'admin' | 'cashier' });
          return true;
        }
        return false;
      },

      logout: () =>
        set({ isAuthenticated: false, userRole: null, cart: [], selectedCustomer: null }),

      getCartSubtotal: () => {
        const { cart } = get();
        return cart.reduce(
          (sum, item) => sum + item.product.price * item.quantity - item.discount,
          0
        );
      },

      getCartTotal: (vatRate) => {
        const subtotal = get().getCartSubtotal();
        const vat = subtotal * (vatRate / 100);
        const total = subtotal + vat;
        return { subtotal, vat, total };
      },
    }),
    {
      name: 'oman-pos-storage',
      partialize: (state) => ({ 
        settings: state.settings,
        isAuthenticated: state.isAuthenticated,
        userRole: state.userRole,
      }),
    }
  )
);

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  visible: boolean;
}

interface ToastStore {
  toast: ToastState;
  showToast: (message: string, type?: ToastState['type']) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toast: { message: '', type: 'info', visible: false },
  showToast: (message, type = 'info') =>
    set({ toast: { message, type, visible: true } }),
  hideToast: () =>
    set((state) => ({ toast: { ...state.toast, visible: false } })),
}));
