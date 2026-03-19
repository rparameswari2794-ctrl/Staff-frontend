import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Container, Row, Col, Card, Table, Badge, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [dashboardData, setDashboardData] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
    fetchInvestments();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard/');
      console.log('Dashboard data:', response.data);
      setDashboardData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const fetchInvestments = async () => {
    try {
      const response = await api.get('/admin/investments/');
      const investmentsData = response.data.results || response.data || [];
      setInvestments(investmentsData);
    } catch (error) {
      console.error('Error fetching investments:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Calculate investment summary
  const investmentSummary = investments.reduce((acc, inv) => {
    acc.total += parseFloat(inv.amount || 0);
    acc.count += 1;
    
    // Group by type
    const type = inv.investment_type_display || inv.investment_type;
    acc.byType[type] = (acc.byType[type] || 0) + parseFloat(inv.amount);
    
    return acc;
  }, { total: 0, count: 0, byType: {} });

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  if (!dashboardData) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">No dashboard data available</Alert>
      </Container>
    );
  }

  const { stats, recent_sales, recent_purchases, recent_expenses, recent_leaves } = dashboardData;

  return (
    <Container style={{ marginTop: '80px' }} fluid>
      <h2>Admin Dashboard</h2>
      <p className="text-muted">Welcome back, {user?.username}</p>

      {/* Stats Cards - Row 1 */}
      <Row className="mb-4">
        <Col md={3}>
          <Card bg="primary" text="white" className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6>Total Employees</h6>
                  <h3>{stats.total_employees}</h3>
                </div>
                <i className="fa-solid fa-users fa-2x"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card bg="success" text="white" className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6>Total Products</h6>
                  <h3>{stats.total_products}</h3>
                </div>
                <i className="fa-solid fa-boxes fa-2x"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card bg="info" text="white" className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6>Departments</h6>
                  <h3>{stats.total_departments}</h3>
                </div>
                <i className="fa-solid fa-building fa-2x"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card bg="warning" text="dark" className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6>Customers</h6>
                  <h3>{stats.total_customers}</h3>
                </div>
                <i className="fa-solid fa-user-group fa-2x"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Stats Cards - Row 2 (Today's Stats) */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="shadow-sm border-success">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6>Today's Sales</h6>
                  <h3 className="text-success">{formatCurrency(stats.today_sales)}</h3>
                  <small>{stats.today_sales_count} transactions</small>
                </div>
                <i className="fa-solid fa-chart-line fa-3x text-success opacity-50"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm border-danger">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6>Today's Purchases</h6>
                  <h3 className="text-danger">{formatCurrency(stats.today_purchases)}</h3>
                  <small>{stats.today_purchases_count} purchases</small>
                </div>
                <i className="fa-solid fa-cart-shopping fa-3x text-danger opacity-50"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm border-warning">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6>Today's Expenses</h6>
                  <h3 className="text-warning">{formatCurrency(stats.today_expenses)}</h3>
                  <small>{stats.today_expenses_count} expenses</small>
                </div>
                <i className="fa-solid fa-money-bill-wave fa-3x text-warning opacity-50"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm border-primary">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6>Total Investments</h6>
                  <h3 className="text-primary">{formatCurrency(investmentSummary.total)}</h3>
                  <small>{investmentSummary.count} investments</small>
                </div>
                <i className="fa-solid fa-chart-line fa-3x text-primary opacity-50"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Stats Cards - Row 3 (Monthly Stats) */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="shadow-sm">
            <Card.Body>
              <h6>Monthly Sales</h6>
              <h4>{formatCurrency(stats.monthly_sales)}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm">
            <Card.Body>
              <h6>Monthly Purchases</h6>
              <h4>{formatCurrency(stats.monthly_purchases)}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm">
            <Card.Body>
              <h6>Monthly Expenses</h6>
              <h4>{formatCurrency(stats.monthly_expenses)}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className={`shadow-sm ${stats.net_profit >= 0 ? 'border-success' : 'border-danger'}`}>
            <Card.Body>
              <h6>Net Profit</h6>
              <h4 className={stats.net_profit >= 0 ? 'text-success' : 'text-danger'}>
                {formatCurrency(stats.net_profit)}
              </h4>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Pending Approvals */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="shadow-sm border-warning">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6>Pending Leaves</h6>
                  <h3>{stats.pending_leaves}</h3>
                </div>
                <Button as={Link} to="/admin/leaves" variant="outline-warning" size="sm">
                  Review
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm border-warning">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6>Pending Expenses</h6>
                  <h3>{stats.pending_expenses}</h3>
                </div>
                <Button as={Link} to="/admin/expenses" variant="outline-warning" size="sm">
                  Review
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm border-danger">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6>Low Stock Items</h6>
                  <h3>{stats.low_stock}</h3>
                </div>
                <Button as={Link} to="/admin/products" variant="outline-danger" size="sm">
                  View
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Investment Summary Card */}
      {investmentSummary.count > 0 && (
        <Row className="mb-4">
          <Col md={12}>
            <Card className="shadow-sm border-primary">
              <Card.Header className="bg-primary text-white">
                <h6 className="mb-0">
                  <i className="fa-solid fa-chart-line me-2"></i>
                  Investment Summary
                </h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  {Object.entries(investmentSummary.byType).map(([type, amount]) => (
                    <Col md={3} key={type} className="mb-2">
                      <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                        <Badge bg="info" pill>{type}</Badge>
                        <strong className="text-primary">{formatCurrency(amount)}</strong>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Quick Access Cards - Updated with Investments */}
      <h4 className="mt-4 mb-3">Management Sections</h4>
      <Row className="mb-4">
        <Col md={2}>
          <Card className="text-center h-100 shadow-sm border-primary">
            <Card.Body>
              <i className="fa-solid fa-users fa-3x text-primary mb-3"></i>
              <Card.Title>Employees</Card.Title>
              <Button as={Link} to="/admin/employees" variant="primary" size="sm">Manage</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center h-100 shadow-sm border-success">
            <Card.Body>
              <i className="fa-solid fa-building fa-3x text-success mb-3"></i>
              <Card.Title>Departments</Card.Title>
              <Button as={Link} to="/admin/departments" variant="success" size="sm">Manage</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center h-100 shadow-sm border-info">
            <Card.Body>
              <i className="fa-solid fa-calendar-check fa-3x text-info mb-3"></i>
              <Card.Title>Attendance</Card.Title>
              <Button as={Link} to="/admin/attendance" variant="info" size="sm">View</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center h-100 shadow-sm border-warning">
            <Card.Body>
              <i className="fa-solid fa-umbrella-beach fa-3x text-warning mb-3"></i>
              <Card.Title>Leaves</Card.Title>
              <Button as={Link} to="/admin/leaves" variant="warning" size="sm">Manage</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center h-100 shadow-sm border-danger">
            <Card.Body>
              <i className="fa-solid fa-boxes fa-3x text-danger mb-3"></i>
              <Card.Title>Products</Card.Title>
              <Button as={Link} to="/admin/products" variant="danger" size="sm">Manage</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center h-100 shadow-sm border-secondary">
            <Card.Body>
              <i className="fa-solid fa-cart-shopping fa-3x text-secondary mb-3"></i>
              <Card.Title>Purchases</Card.Title>
              <Button as={Link} to="/admin/purchases" variant="secondary" size="sm">Manage</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={2}>
          <Card className="text-center h-100 shadow-sm border-primary">
            <Card.Body>
              <i className="fa-solid fa-money-bill-wave fa-3x text-primary mb-3"></i>
              <Card.Title>Expenses</Card.Title>
              <Button as={Link} to="/admin/expenses" variant="primary" size="sm">Manage</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center h-100 shadow-sm border-success">
            <Card.Body>
              <i className="fa-solid fa-chart-line fa-3x text-success mb-3"></i>
              <Card.Title>Sales</Card.Title>
              <Button as={Link} to="/admin/sales" variant="success" size="sm">View</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center h-100 shadow-sm border-info">
            <Card.Body>
              <i className="fa-solid fa-chart-pie fa-3x text-info mb-3"></i>
              <Card.Title>Reports</Card.Title>
              <Button as={Link} to="/admin/reports" variant="info" size="sm">View</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center h-100 shadow-sm border-warning">
            <Card.Body>
              <i className="fa-solid fa-user-group fa-3x text-warning mb-3"></i>
              <Card.Title>Customers</Card.Title>
              <Button as={Link} to="/admin/customers" variant="warning" size="sm">View</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center h-100 shadow-sm border-primary" style={{ backgroundColor: '#f0f8ff' }}>
            <Card.Body>
              <i className="fa-solid fa-chart-line fa-3x text-primary mb-3"></i>
              <Card.Title>Investments</Card.Title>
              <Button as={Link} to="/admin/investments" variant="primary" size="sm">Manage</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Activities */}
      <h4 className="mt-4 mb-3">Recent Activities</h4>
      <Row>
        <Col md={6}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-success text-white">
              <h6 className="mb-0">Recent Sales</h6>
            </Card.Header>
            <Card.Body style={{ maxHeight: '250px', overflowY: 'auto' }}>
              <Table striped hover size="sm">
                <thead>
                  <tr>
                    <th>Bill No.</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Cashier</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_sales.map(sale => (
                    <tr key={sale.id}>
                      <td>{sale.bill_number}</td>
                      <td>{sale.customer_name || 'Walk-in'}</td>
                      <td>{formatCurrency(sale.total_amount)}</td>
                      <td>{sale.cashier_username || 'System'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-danger text-white">
              <h6 className="mb-0">Recent Purchases</h6>
            </Card.Header>
            <Card.Body style={{ maxHeight: '250px', overflowY: 'auto' }}>
              <Table striped hover size="sm">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Supplier</th>
                    <th>Quantity</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_purchases.map(purchase => (
                    <tr key={purchase.id}>
                      <td>{purchase.product_name}</td>
                      <td>{purchase.supplier}</td>
                      <td>{purchase.quantity}</td>
                      <td>{formatCurrency(purchase.total_cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-warning">
              <h6 className="mb-0">Recent Expenses</h6>
            </Card.Header>
            <Card.Body style={{ maxHeight: '250px', overflowY: 'auto' }}>
              <Table striped hover size="sm">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_expenses.map(expense => (
                    <tr key={expense.id}>
                      <td>{expense.description}</td>
                      <td>{expense.category}</td>
                      <td>{formatCurrency(expense.amount)}</td>
                      <td>
                        <Badge bg={
                          expense.status === 'approved' ? 'success' :
                          expense.status === 'pending' ? 'warning' : 'secondary'
                        }>
                          {expense.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-info text-white">
              <h6 className="mb-0">Recent Leaves</h6>
            </Card.Header>
            <Card.Body style={{ maxHeight: '250px', overflowY: 'auto' }}>
              <Table striped hover size="sm">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_leaves.map(leave => (
                    <tr key={leave.id}>
                      <td>{leave.employee_name}</td>
                      <td>{leave.leave_type}</td>
                      <td>{new Date(leave.start_date).toLocaleDateString()}</td>
                      <td>{new Date(leave.end_date).toLocaleDateString()}</td>
                      <td>
                        <Badge bg={
                          leave.status === 'approved' ? 'success' :
                          leave.status === 'pending' ? 'warning' : 'danger'
                        }>
                          {leave.status}
                        </Badge>
                      </td>
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

export default AdminDashboard;