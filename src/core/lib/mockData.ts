// Mock data for FASI Mobile - identical to web platform

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  purchasePrice: number;
  salePrice: number;
  currentStock: number;
  minStock: number;
  maxStock: number;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
}

export interface Customer {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  creditLimit: number;
  riskScore: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string;
  productId: string;
  branchId: string;
  customerId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Alert {
  id: string;
  type: 'low_stock' | 'high_sales' | 'risk' | 'overdue' | 'sales_drop' | 'exchange_rate' | 'seasonal';
  severity: 'low' | 'medium' | 'critical';
  productId?: string;
  branchId?: string;
  customerId?: string;
  message: string;
  date: string;
  daysActive: number;
  status: 'pending' | 'resolved';
  aiExplanation?: string;
}

export const products: Product[] = [
  { id: '1', name: 'Laptop Dell XPS 15', sku: 'LAP-001', category: 'Electronics', purchasePrice: 1200, salePrice: 1599, currentStock: 45, minStock: 10, maxStock: 100 },
  { id: '2', name: 'iPhone 15 Pro', sku: 'PHN-001', category: 'Electronics', purchasePrice: 900, salePrice: 1199, currentStock: 23, minStock: 15, maxStock: 80 },
  { id: '3', name: 'Samsung Galaxy S24', sku: 'PHN-002', category: 'Electronics', purchasePrice: 750, salePrice: 999, currentStock: 67, minStock: 20, maxStock: 100 },
  { id: '4', name: 'MacBook Pro 16"', sku: 'LAP-002', category: 'Electronics', purchasePrice: 2200, salePrice: 2799, currentStock: 12, minStock: 5, maxStock: 50 },
  { id: '5', name: 'iPad Air', sku: 'TAB-001', category: 'Electronics', purchasePrice: 500, salePrice: 649, currentStock: 34, minStock: 10, maxStock: 60 },
  { id: '6', name: 'AirPods Pro', sku: 'AUD-001', category: 'Accessories', purchasePrice: 180, salePrice: 249, currentStock: 156, minStock: 50, maxStock: 200 },
  { id: '7', name: 'Sony WH-1000XM5', sku: 'AUD-002', category: 'Accessories', purchasePrice: 300, salePrice: 399, currentStock: 89, minStock: 30, maxStock: 150 },
  { id: '8', name: 'LG OLED TV 55"', sku: 'TV-001', category: 'Electronics', purchasePrice: 1100, salePrice: 1499, currentStock: 8, minStock: 5, maxStock: 30 },
  { id: '9', name: 'Desk Office Chair', sku: 'FRN-001', category: 'Furniture', purchasePrice: 200, salePrice: 299, currentStock: 5, minStock: 8, maxStock: 50 },
  { id: '10', name: 'Standing Desk', sku: 'FRN-002', category: 'Furniture', purchasePrice: 350, salePrice: 499, currentStock: 15, minStock: 10, maxStock: 40 },
];

export const branches: Branch[] = [
  { id: 'B1', name: 'North Branch', location: 'Downtown' },
  { id: 'B2', name: 'South Branch', location: 'Suburbs' },
  { id: 'B3', name: 'East Branch', location: 'Mall' },
  { id: 'B4', name: 'West Branch', location: 'Business District' },
];

export const customers: Customer[] = [
  { id: 'C1', name: 'Tech Solutions Inc', code: 'TSI-001', email: 'contact@techsolutions.com', phone: '+1-555-0101', creditLimit: 50000, riskScore: 85 },
  { id: 'C2', name: 'Digital Services LLC', code: 'DS-002', email: 'info@digitalservices.com', phone: '+1-555-0102', creditLimit: 30000, riskScore: 42 },
  { id: 'C3', name: 'Global Trade Corp', code: 'GTC-003', email: 'trade@globalcorp.com', phone: '+1-555-0103', creditLimit: 100000, riskScore: 91 },
  { id: 'C4', name: 'Smart Retail Group', code: 'SRG-004', email: 'purchasing@smartretail.com', phone: '+1-555-0104', creditLimit: 75000, riskScore: 68 },
  { id: 'C5', name: 'Mega Electronics', code: 'ME-005', email: 'orders@megaelectronics.com', phone: '+1-555-0105', creditLimit: 120000, riskScore: 77 },
];

export const salesByMonth = [
  { month: 'Jan', sales: 245000, purchases: 180000 },
  { month: 'Feb', sales: 280000, purchases: 195000 },
  { month: 'Mar', sales: 320000, purchases: 220000 },
  { month: 'Apr', sales: 295000, purchases: 210000 },
  { month: 'May', sales: 350000, purchases: 240000 },
  { month: 'Jun', sales: 380000, purchases: 260000 },
  { month: 'Jul', sales: 420000, purchases: 285000 },
  { month: 'Aug', sales: 445000, purchases: 300000 },
  { month: 'Sep', sales: 395000, purchases: 270000 },
  { month: 'Oct', sales: 360000, purchases: 248000 },
  { month: 'Nov', sales: 410000, purchases: 278000 },
  { month: 'Dec', sales: 480000, purchases: 320000 },
];

export const alerts: Alert[] = [
  { id: 'A1', type: 'low_stock', severity: 'critical', productId: '9', branchId: 'B1', message: 'Desk Office Chair stock below minimum threshold', date: '2025-11-15', daysActive: 3, status: 'pending', aiExplanation: 'Current stock (5 units) is below minimum threshold (8 units). Reorder immediately to avoid stockout.' },
  { id: 'A2', type: 'overdue', severity: 'critical', customerId: 'C2', message: 'Digital Services LLC has overdue payment of $45,000', date: '2025-11-14', daysActive: 5, status: 'pending', aiExplanation: 'This customer has exceeded payment terms by 45 days. Risk of default detected.' },
  { id: 'A3', type: 'high_sales', severity: 'low', productId: '6', message: 'AirPods Pro sales increased by 300%', date: '2025-11-13', daysActive: 2, status: 'pending', aiExplanation: 'Seasonal trend detected. Consider increasing stock levels to meet demand.' },
  { id: 'A4', type: 'sales_drop', severity: 'medium', branchId: 'B2', message: 'South Branch sales dropped 20% vs last week', date: '2025-11-12', daysActive: 7, status: 'pending', aiExplanation: 'Competitor activity detected in area. Recommend targeted promotion.' },
  { id: 'A5', type: 'risk', severity: 'medium', customerId: 'C3', message: 'Global Trade Corp approaching credit limit', date: '2025-11-11', daysActive: 1, status: 'resolved', aiExplanation: 'Customer has used 92% of credit limit. Review credit terms.' },
];

export const kpis = {
  totalInvoices: 1247,
  totalSales: 3845000,
  stockValue: 892000,
  totalReceivables: 456000,
  avgDaysToCollect: 32,
  grossMargin: 34.5,
  inventoryTurnover: 8.2,
  topProductRevenue: 485000,
};

export const agingReceivables = [
  { id: 'AR1', customer: 'Tech Solutions Inc', invoiceNumber: 'INV-2025-001', invoiceDate: '2025-09-15', dueDate: '2025-10-15', totalAmount: 85000, paidAmount: 40000, remainingBalance: 45000, daysOverdue: 31 },
  { id: 'AR2', customer: 'Digital Services LLC', invoiceNumber: 'INV-2025-002', invoiceDate: '2025-08-20', dueDate: '2025-09-20', totalAmount: 62000, paidAmount: 17000, remainingBalance: 45000, daysOverdue: 56 },
  { id: 'AR3', customer: 'Smart Retail Group', invoiceNumber: 'INV-2025-003', invoiceDate: '2025-10-01', dueDate: '2025-11-01', totalAmount: 120000, paidAmount: 120000, remainingBalance: 0, daysOverdue: 0 },
  { id: 'AR4', customer: 'Mega Electronics', invoiceNumber: 'INV-2025-004', invoiceDate: '2025-07-10', dueDate: '2025-08-10', totalAmount: 95000, paidAmount: 30000, remainingBalance: 65000, daysOverdue: 97 },
];

export const recentTransactions = [
  { id: 'T1', type: 'sale', date: '2025-11-15', invoiceNumber: 'INV-2025-247', product: 'Laptop Dell XPS 15', branch: 'North Branch', customer: 'Tech Solutions Inc', quantity: 5, unitPrice: 1599, total: 7995 },
  { id: 'T2', type: 'sale', date: '2025-11-14', invoiceNumber: 'INV-2025-246', product: 'iPhone 15 Pro', branch: 'East Branch', customer: 'Smart Retail Group', quantity: 10, unitPrice: 1199, total: 11990 },
  { id: 'T3', type: 'purchase', date: '2025-11-13', invoiceNumber: 'PO-2025-089', product: 'AirPods Pro', branch: 'North Branch', customer: null, quantity: 50, unitPrice: 180, total: 9000 },
  { id: 'T4', type: 'sale', date: '2025-11-12', invoiceNumber: 'INV-2025-245', product: 'MacBook Pro 16"', branch: 'West Branch', customer: 'Mega Electronics', quantity: 3, unitPrice: 2799, total: 8397 },
  { id: 'T5', type: 'sale', date: '2025-11-11', invoiceNumber: 'INV-2025-244', product: 'Samsung Galaxy S24', branch: 'South Branch', customer: 'Digital Services LLC', quantity: 8, unitPrice: 999, total: 7992 },
];
