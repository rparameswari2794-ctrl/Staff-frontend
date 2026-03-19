// src/pages/staff/StaffDashboard.jsx
import { useSelector } from 'react-redux';
import { Container, Row, Col, Card, Button, Table, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../services/api';

const StaffDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [todaySales, setTodaySales] = useState(0);
  const [products, setProducts] = useState([]);
  const [recentBills, setRecentBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get the current staff user's ID
      const currentUserId = user?.id;

      if (!currentUserId) {
        console.error('No user ID found');
        setLoading(false);
        return;
      }

      // Fetch sales - filter by current cashier
      const salesResponse = await api.get('/sales/', {
        params: {
          cashier: currentUserId  // Filter by current staff
        }
      });
      const sales = salesResponse.data;
      console.log('My sales:', sales); // Debug log

      // Calculate today's sales for this staff only
      const today = new Date().toDateString();
      const todaySalesTotal = sales
        .filter(sale => new Date(sale.date).toDateString() === today)
        .reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
      setTodaySales(todaySalesTotal);

      // Get recent bills (only this staff's bills)
      setRecentBills(sales.slice(0, 5));

      // Fetch products (all products - staff can see all products)
      const productsResponse = await api.get('/products/');
      setProducts(productsResponse.data);

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
    <Container className="mt-4">
      <h2>Welcome, {user?.first_name || user?.username} {user?.last_name || ''}!</h2>
      <p className="text-muted">Staff Dashboard</p>

      {/* Action Cards */}
      <Row className="mt-4">
        <Col md={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <Card.Title>
                <i className="fa-solid fa-cash-register me-2 text-success"></i>
                Billing
              </Card.Title>
              <Card.Text>
                Create new bills, manage sales, and print receipts for customers
              </Card.Text>
              <Button as={Link} to="/billing" variant="success">
                Go to Billing <i className="fa-solid fa-arrow-right ms-1"></i>
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <Card.Title>
                <i className="fa-solid fa-calendar-check me-2 text-primary"></i>
                My Attendance
              </Card.Title>
              <Card.Text>
                View your attendance records and check in/out
              </Card.Text>
              <Button as={Link} to="/attendance" variant="primary">
                View Attendance <i className="fa-solid fa-arrow-right ms-1"></i>
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <Card.Title>
                <i className="fa-solid fa-umbrella-beach me-2 text-warning"></i>
                My Leaves
              </Card.Title>
              <Card.Text>
                Apply for leave and check leave status
              </Card.Text>
              <Button as={Link} to="/leaves" variant="warning">
                Manage Leaves <i className="fa-solid fa-arrow-right ms-1"></i>
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Stats */}
      <Row className="mt-4">
        <Col md={6}>
          <Card bg="light" className="text-center">
            <Card.Body>
              <Card.Title className="h6">
                <i className="fa-solid fa-chart-line me-2 text-success"></i>
                Today's Sales
              </Card.Title>
              <h3 className="text-success">₹{todaySales.toFixed(2)}</h3>
              <small className="text-muted">
                {todaySales > 0 ? 'Sales recorded today' : 'No sales yet today'}
              </small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card bg="light" className="text-center">
            <Card.Body>
              <Card.Title className="h6">
                <i className="fa-solid fa-boxes me-2 text-info"></i>
                Total Products
              </Card.Title>
              <h3 className="text-info">{products.length}</h3>
              <Button variant="outline-info" size="sm" as={Link} to="/products">
                View All Products <i className="fa-solid fa-arrow-right ms-1"></i>
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Products Stock List */}
      <Row className="mt-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">
                <i className="fa-solid fa-boxes me-2"></i>
                Products Stock List
              </h5>
            </Card.Header>
            <Card.Body>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <Table striped bordered hover size="sm">
                  <thead className="sticky-top bg-white">
                    <tr>
                      <th>Product Code</th>
                      <th>Product Name</th>
                      <th>Price (₹)</th>
                      <th>Stock</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id}>
                        <td>
                          <Badge bg="secondary">{product.product_code || '-'}</Badge>
                        </td>
                        <td>{product.name}</td>
                        <td>₹{parseFloat(product.price).toFixed(2)}</td>
                        <td>
                          <Badge bg={product.quantity > 10 ? 'success' : product.quantity > 0 ? 'warning' : 'danger'}>
                            {product.quantity}
                          </Badge>
                        </td>
                        <td>
                          {product.quantity > 10 ? (
                            <Badge bg="success">In Stock</Badge>
                          ) : product.quantity > 0 ? (
                            <Badge bg="warning">Low Stock</Badge>
                          ) : (
                            <Badge bg="danger">Out of Stock</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center text-muted">
                          No products found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
              <div className="text-end mt-3">
                <Button variant="outline-info" size="sm" as={Link} to="/products">
                  View All Products <i className="fa-solid fa-arrow-right ms-1"></i>
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Bills */}
      <Row className="mt-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">
                <i className="fa-solid fa-receipt me-2"></i>
                Recent Bills
              </h5>
            </Card.Header>
            <Card.Body>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <Table striped hover size="sm">
                  <thead className="sticky-top bg-white">
                    <tr>
                      <th>Bill No.</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Phone</th>
                      <th>Items</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBills.map(bill => (
                      <tr key={bill.id}>
                        <td>
                          <strong>{bill.bill_number}</strong>
                        </td>
                        <td>
                          {new Date(bill.date).toLocaleDateString()}
                          <br />
                          <small className="text-muted">
                            {new Date(bill.date).toLocaleTimeString()}
                          </small>
                        </td>
                        <td>
                          {bill.customer_name || 'Walk-in Customer'}
                        </td>
                        <td>
                          {bill.customer_phone ? (
                            <Badge bg="info" pill>
                              <i className="fa-solid fa-phone me-1"></i>
                              {bill.customer_phone}
                            </Badge>
                          ) : '-'}
                        </td>
                        <td>
                          <Badge bg="info" pill>
                            {bill.item_count || 0} items
                          </Badge>
                        </td>
                        <td>
                          <strong className="text-success">
                            ₹{parseFloat(bill.total_amount).toFixed(2)}
                          </strong>
                        </td>
                      </tr>
                    ))}
                    {recentBills.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center text-muted">
                          No bills yet. Create your first bill!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
              <div className="text-end mt-3">
                <Button variant="outline-success" size="sm" as={Link} to="/bills">
                  View All Bills <i className="fa-solid fa-arrow-right ms-1"></i>
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default StaffDashboard;