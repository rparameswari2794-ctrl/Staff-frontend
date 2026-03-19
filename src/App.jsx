import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import Departments from './pages/admin/Departments';
import AdminEmployees from './pages/admin/AdminEmployees';
import AdminAttendance from './pages/admin/AdminAttendance';
import AdminLeaves from './pages/admin/AdminLeaves';
import AdminProducts from './pages/admin/AdminProducts';
import AdminPurchases from './pages/admin/AdminPurchases';
import AdminExpenses from './pages/admin/AdminExpenses';
import AdminSales from './pages/admin/AdminSales';
import AdminReports from './pages/admin/AdminReports';
import AdminInvestments from './pages/admin/AdminInvestments';
import EndOfDayReport from './pages/admin/EndOfDayReport';
import AdminSalary from './pages/admin/AdminSalary';
import AdminSalaryAdvances from './pages/admin/AdminSalaryAdvances';

// Manager pages
import ManagerDashboard from './pages/manager/ManagerDashboard';
import Employees from './pages/manager/Employees';
import EmployeeSales from './pages/manager/EmployeeSales';
import StockDetails from './pages/manager/StockDetails';
import Purchases from './pages/manager/Purchases';
import Expenses from './pages/manager/Expenses';
import DailyReports from './pages/manager/DailyReports';
import MyAttendance from './pages/manager/MyAttendance';
import MyLeaves from './pages/manager/MyLeaves';
import ManagerAdvance from './pages/manager/ManagerAdvance';


// Staff pages
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffAttendance from './pages/staff/Attendance';
import StaffLeaves from './pages/staff/Leaves';
import StaffBilling from './pages/staff/Billing';
import MyBills from './pages/staff/AllBills';
import Products from './pages/staff/Products';
import SalaryAdvance from './pages/staff/SalaryAdvance';

// Salary pages with role-based rendering
import MySalaryWrapper from './pages/MySalaryWrapper';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Role‑based dashboard selector
const DashboardRouter = () => {
  const { role } = useSelector((state) => state.auth);
  console.log('DashboardRouter role:', role);
  if (role === 'admin') return <AdminDashboard />;
  if (role === 'manager') return <ManagerDashboard />;
  return <StaffDashboard />;
};

function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        style={{ top: '70px' }}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Navbar />
      <div style={{
        paddingTop: '70px',
        minHeight: 'calc(100vh - 70px)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ flex: 1 }}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes - Dashboard */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin/departments"
              element={
                <ProtectedRoute>
                  <Departments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/employees"
              element={
                <ProtectedRoute>
                  <AdminEmployees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/attendance"
              element={
                <ProtectedRoute>
                  <AdminAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/leaves"
              element={
                <ProtectedRoute>
                  <AdminLeaves />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute>
                  <AdminProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/purchases"
              element={
                <ProtectedRoute>
                  <AdminPurchases />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/expenses"
              element={
                <ProtectedRoute>
                  <AdminExpenses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sales"
              element={
                <ProtectedRoute>
                  <AdminSales />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute>
                  <AdminReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/investments"
              element={
                <ProtectedRoute>
                  <AdminInvestments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/end-of-day-report"
              element={
                <ProtectedRoute>
                  <EndOfDayReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/salary"
              element={
                <ProtectedRoute>
                  <AdminSalary />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/salary-advances"
              element={
                <ProtectedRoute>
                  <AdminSalaryAdvances />
                </ProtectedRoute>
              }
            />

            {/* Manager routes */}
            <Route
              path="/employees"
              element={
                <ProtectedRoute>
                  <Employees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee-sales"
              element={
                <ProtectedRoute>
                  <EmployeeSales />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stock-details"
              element={
                <ProtectedRoute>
                  <StockDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchases"
              element={
                <ProtectedRoute>
                  <Purchases />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <Expenses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/daily-reports"
              element={
                <ProtectedRoute>
                  <DailyReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-attendance"
              element={
                <ProtectedRoute>
                  <MyAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-leaves"
              element={
                <ProtectedRoute>
                  <MyLeaves />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/advance"
              element={
                <ProtectedRoute>
                  <ManagerAdvance />
                </ProtectedRoute>
              }
            />

            {/* Staff routes */}
            <Route
              path="/attendance"
              element={
                <ProtectedRoute>
                  <StaffAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaves"
              element={
                <ProtectedRoute>
                  <StaffLeaves />
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing"
              element={
                <ProtectedRoute>
                  <StaffBilling />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <Products />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bills"
              element={
                <ProtectedRoute>
                  <MyBills />
                </ProtectedRoute>
              }
            />
            <Route
              path="/salary-advance"
              element={
                <ProtectedRoute>
                  <SalaryAdvance />
                </ProtectedRoute>
              }
            />

            {/* Role-based Salary Route - Single route for both manager and staff */}
            <Route
              path="/my-salary"
              element={
                <ProtectedRoute>
                  <MySalaryWrapper />
                </ProtectedRoute>
              }
            />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </>
  );
}

export default App;