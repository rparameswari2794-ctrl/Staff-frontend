import { useSelector } from 'react-redux';
import { Container, Row, Col, Card, Button, Table, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../services/api';

const ManagerDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalProducts: 0,
    todaySales: 0,
    pendingLeaves: 0,
    lowStock: 0,
    todayPurchases: 0,
    totalCustomers: 0,
    todayExpenses: 0,
    pendingExpenses: 0
  });
  const [recentSales, setRecentSales] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Low stock threshold
  const LOW_STOCK_THRESHOLD = 20;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [employeesRes, productsRes, salesRes, purchasesRes, expensesRes] = await Promise.all([
        api.get('/employees/'),
        api.get('/products/'),
        api.get('/sales/'),
        api.get('/purchases/'),
        api.get('/expenses/')
      ]);

      const employees = employeesRes.data;
      const products = productsRes.data;
      const sales = salesRes.data;
      const purchases = purchasesRes.data;
      const expenses = expensesRes.data;

      // Calculate today's sales
      const today = new Date().toDateString();
      const todaySalesTotal = sales
        .filter(sale => new Date(sale.date).toDateString() === today)
        .reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0);

      // Count low stock products (quantity < threshold)
      const lowStockCount = products.filter(p => (p.quantity || 0) < LOW_STOCK_THRESHOLD && p.quantity > 0).length;

      // Calculate today's purchases
      const todayPurchasesTotal = purchases
        .filter(purchase => new Date(purchase.date).toDateString() === today)
        .reduce((sum, purchase) => sum + parseFloat(purchase.total_cost || 0), 0);

      // Calculate today's expenses
      const todayExpensesTotal = expenses
        .filter(expense => new Date(expense.date).toDateString() === today)
        .reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);

      // Count pending expenses (if status field exists)
      const pendingExpensesCount = expenses.filter(e => e.status === 'pending').length;

      setStats({
        totalEmployees: employees.length,
        totalProducts: products.length,
        todaySales: todaySalesTotal,
        lowStock: lowStockCount,
        todayPurchases: todayPurchasesTotal,
        todayExpenses: todayExpensesTotal,
        pendingExpenses: pendingExpensesCount
      });

      setRecentSales(sales.slice(0, 5));
      setRecentPurchases(purchases.slice(0, 5));
      setRecentExpenses(expenses.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  return (
    <Container style={{ marginTop: '80px' }}>
      <h2>Welcome, {user?.first_name || user?.username}!</h2>
      <p className="text-muted">Manager Dashboard</p>

      {/* Stats Cards - Row 1 */}
      <Row className="mt-4">
        <Col md={3} className="mb-3">
          <Card bg="primary" text="white" className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6>Total Employees</h6>
                  <h3>{stats.totalEmployees}</h3>
                </div>
                <i className="fa-solid fa-users fa-2x"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card bg="success" text="white" className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6>Today's Sales</h6>
                  <h3>₹{stats.todaySales.toFixed(2)}</h3>
                </div>
                <i className="fa-solid fa-chart-line fa-2x"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card bg="info" text="white" className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6>Total Products</h6>
                  <h3>{stats.totalProducts}</h3>
                </div>
                <i className="fa-solid fa-boxes fa-2x"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card bg="danger" text="white" className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6>Low Stock Items</h6>
                  <h3>{stats.lowStock}</h3>
                </div>
                <i className="fa-solid fa-exclamation-triangle fa-2x"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Stats Cards - Row 2 */}
      <Row>
        <Col md={3} className="mb-3">
          <Card bg="dark" text="white" className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6>Today's Purchases</h6>
                  <h3>₹{stats.todayPurchases.toFixed(2)}</h3>
                </div>
                <i className="fa-solid fa-cart-shopping fa-2x"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card bg="danger" text="white" className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6>Today's Expenses</h6>
                  <h3>₹{stats.todayExpenses.toFixed(2)}</h3>
                </div>
                <i className="fa-solid fa-money-bill-wave fa-2x"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card bg="warning" text="dark" className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6>Pending Expenses</h6>
                  <h3>{stats.pendingExpenses}</h3>
                </div>
                <i className="fa-solid fa-clock fa-2x"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card bg="success" text="white" className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6>Net Today</h6>
                  <h3>₹{(stats.todaySales - stats.todayPurchases - stats.todayExpenses).toFixed(2)}</h3>
                </div>
                <i className="fa-solid fa-calculator fa-2x"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions - Management Cards */}
      <h4 className="mt-4 mb-3">Quick Actions</h4>
      <Row>
        <Col md={2} className="mb-3">
          <Card className="h-100 shadow-sm border-primary">
            <Card.Body className="text-center">
              <i className="fa-solid fa-cart-plus fa-2x text-primary mb-2"></i>
              <Card.Title className="fs-6">Purchase</Card.Title>
              <Button as={Link} to="/purchases" variant="primary" size="sm">Go</Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={2} className="mb-3">
          <Card className="h-100 shadow-sm border-success">
            <Card.Body className="text-center">
              <i className="fa-solid fa-chart-simple fa-2x text-success mb-2"></i>
              <Card.Title className="fs-6">Emp Sales</Card.Title>
              <Button as={Link} to="/employee-sales" variant="success" size="sm">Go</Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={2} className="mb-3">
          <Card className="h-100 shadow-sm border-info">
            <Card.Body className="text-center">
              <i className="fa-solid fa-boxes-stacked fa-2x text-info mb-2"></i>
              <Card.Title className="fs-6">Stock</Card.Title>
              <Button as={Link} to="/stock-details" variant="info" size="sm">Go</Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={2} className="mb-3">
          <Card className="h-100 shadow-sm border-warning">
            <Card.Body className="text-center">
              <i className="fa-solid fa-users fa-2x text-warning mb-2"></i>
              <Card.Title className="fs-6">Customers</Card.Title>
              <Button as={Link} to="/customers" variant="warning" size="sm">Go</Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={2} className="mb-3">
          <Card className="h-100 shadow-sm border-danger">
            <Card.Body className="text-center">
              <i className="fa-solid fa-money-bill-wave fa-2x text-danger mb-2"></i>
              <Card.Title className="fs-6">Expenses</Card.Title>
              <Button as={Link} to="/expenses" variant="danger" size="sm">Go</Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={2} className="mb-3">
          <Card className="h-100 shadow-sm border-success">
            <Card.Body className="text-center">
              <i className="fa-solid fa-chart-pie fa-2x text-success mb-2"></i>
              <Card.Title className="fs-6">Reports</Card.Title>
              <Button as={Link} to="/daily-reports" variant="success" size="sm">Go</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Employee Self Service Row */}
      <h4 className="mt-4 mb-3">My Self Service</h4>
      <Row>
        <Col md={2} className="mb-3">
          <Card className="h-100 shadow-sm border-secondary">
            <Card.Body className="text-center">
              <i className="fa-solid fa-calendar-check fa-2x text-secondary mb-2"></i>
              <Card.Title className="fs-6">Attendance</Card.Title>
              <Button as={Link} to="/my-attendance" variant="outline-secondary" size="sm">Go</Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={2} className="mb-3">
          <Card className="h-100 shadow-sm border-secondary">
            <Card.Body className="text-center">
              <i className="fa-solid fa-umbrella-beach fa-2x text-secondary mb-2"></i>
              <Card.Title className="fs-6">Leaves</Card.Title>
              <Button as={Link} to="/my-leaves" variant="outline-secondary" size="sm">Go</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Activities Row */}
      <Row className="mt-4">
        <Col md={4}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-success text-white">
              <h6 className="mb-0">Recent Sales</h6>
            </Card.Header>
            <Card.Body style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <Table striped hover size="sm">
                <thead>
                  <tr>
                    <th>Bill</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map(sale => (
                    <tr key={sale.id}>
                      <td><small>{sale.bill_number}</small></td>
                      <td><small>₹{parseFloat(sale.total_amount || 0).toFixed(2)}</small></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-dark text-white">
              <h6 className="mb-0">Recent Purchases</h6>
            </Card.Header>
            <Card.Body style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <Table striped hover size="sm">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPurchases.map(purchase => (
                    <tr key={purchase.id}>
                      <td><small>{purchase.product_name || 'Unknown'}</small></td>
                      <td><small>₹{parseFloat(purchase.total_cost || 0).toFixed(2)}</small></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-danger text-white">
              <h6 className="mb-0">Recent Expenses</h6>
            </Card.Header>
            <Card.Body style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <Table striped hover size="sm">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentExpenses.map(expense => (
                    <tr key={expense.id}>
                      <td><small>{expense.description || expense.category || 'Unknown'}</small></td>
                      <td><small>₹{parseFloat(expense.amount || 0).toFixed(2)}</small></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ManagerDashboard;