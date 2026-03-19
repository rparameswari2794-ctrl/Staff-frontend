import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Form, Button, Modal, Badge, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const Purchases = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [dailyTotals, setDailyTotals] = useState({});
  const [newPurchase, setNewPurchase] = useState({
    product: '',
    quantity: '',
    unit_cost: '',
    supplier: '',
    invoice_number: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchPurchases();
    }
  }, [dateRange]);

  const checkAuthAndFetchData = async () => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    
    if (!token) {
      setError('Please login to access purchase management');
      setTimeout(() => navigate('/login'), 2000);
      setLoading(false);
      return;
    }

    await fetchData();
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch products
      console.log('Fetching products...');
      const productsRes = await api.get('/products/');
      console.log('Products loaded:', productsRes.data.length);
      setProducts(productsRes.data);

      // Fetch purchases
      await fetchPurchases();

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      
      if (error.response?.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('access_token');
        localStorage.removeItem('token');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Failed to load data. Please try again.');
      }
      
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    try {
      const purchasesRes = await api.get('/purchases/', {
        params: {
          date_from: dateRange.from,
          date_to: dateRange.to
        }
      });
      console.log('Purchases loaded:', purchasesRes.data.length);
      setPurchases(purchasesRes.data);
      
      // Calculate daily totals
      calculateDailyTotals(purchasesRes.data);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    }
  };

  const calculateDailyTotals = (purchasesData) => {
    const totals = {};
    
    purchasesData.forEach(purchase => {
      const date = new Date(purchase.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const amount = parseFloat(purchase.total_cost || 0);
      totals[date] = (totals[date] || 0) + amount;
    });
    
    setDailyTotals(totals);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPurchase(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddPurchase = async () => {
    try {
      setError('');
      
      if (!newPurchase.product || !newPurchase.quantity || !newPurchase.unit_cost) {
        setError('Please fill all required fields');
        return;
      }

      const purchaseData = {
        product: parseInt(newPurchase.product),
        quantity: parseInt(newPurchase.quantity),
        unit_cost: parseFloat(newPurchase.unit_cost),
        supplier: newPurchase.supplier || '',
        invoice_number: newPurchase.invoice_number || '',
        notes: newPurchase.notes || '',
        date: newPurchase.date
      };
      
      console.log('Submitting purchase:', purchaseData);
      
      const response = await api.post('/purchases/', purchaseData);
      console.log('Purchase created:', response.data);
      
      await fetchPurchases(); // Refresh the list
      
      setSuccess('Purchase added successfully!');
      setShowAddModal(false);
      resetForm();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error adding purchase:', error);
      setError(error.response?.data?.message || 'Failed to add purchase');
    }
  };

  const resetForm = () => {
    setNewPurchase({
      product: '',
      quantity: '',
      unit_cost: '',
      supplier: '',
      invoice_number: '',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const calculateTotal = () => {
    const qty = parseFloat(newPurchase.quantity) || 0;
    const cost = parseFloat(newPurchase.unit_cost) || 0;
    return (qty * cost).toFixed(2);
  };

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown Product';
  };

  const totalPurchaseAmount = purchases.reduce((sum, p) => sum + parseFloat(p.total_cost || 0), 0);
  const totalQuantity = purchases.reduce((sum, p) => sum + p.quantity, 0);

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
      <Row className="mb-4">
        <Col>
          <h2>
            <i className="fa-solid fa-cart-shopping me-2 text-primary"></i>
            Purchase Management
          </h2>
          <p className="text-muted">Add new purchases and view purchase history</p>
        </Col>
        <Col className="text-end">
          <Button 
            variant="primary" 
            onClick={() => setShowAddModal(true)}
            disabled={products.length === 0}
          >
            <i className="fa-solid fa-plus me-2"></i>New Purchase
          </Button>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          <i className="fa-solid fa-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess('')} dismissible>
          {success}
        </Alert>
      )}

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card bg="primary" text="white" className="shadow-sm">
            <Card.Body className="text-center">
              <h6>Total Purchases</h6>
              <h3>{purchases.length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card bg="success" text="white" className="shadow-sm">
            <Card.Body className="text-center">
              <h6>Total Amount</h6>
              <h3>₹{totalPurchaseAmount.toFixed(2)}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card bg="info" text="white" className="shadow-sm">
            <Card.Body className="text-center">
              <h6>Total Items</h6>
              <h3>{totalQuantity}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card bg="warning" text="dark" className="shadow-sm">
            <Card.Body className="text-center">
              <h6>Avg per Purchase</h6>
              <h3>₹{(totalPurchaseAmount / (purchases.length || 1)).toFixed(2)}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Date Filter */}
      <Row className="mb-3">
        <Col md={3}>
          <Form.Group>
            <Form.Label>From Date</Form.Label>
            <Form.Control
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label>To Date</Form.Label>
            <Form.Control
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Daily Purchase Totals */}
      {Object.keys(dailyTotals).length > 0 && (
        <Card className="mb-4">
          <Card.Header className="bg-secondary text-white">
            <h5 className="mb-0">
              <i className="fa-solid fa-calendar-day me-2"></i>
              Daily Purchase Totals
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {Object.entries(dailyTotals).map(([date, total]) => (
                <Col key={date} md={3} className="mb-3">
                  <Card bg="light" className="text-center h-100">
                    <Card.Body>
                      <small className="text-muted d-block mb-2">{date}</small>
                      <h4 className="text-success mb-0">₹{total.toFixed(2)}</h4>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Purchases Table */}
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">
            <i className="fa-solid fa-list me-2"></i>
            Purchase History
          </h5>
        </Card.Header>
        <Card.Body>
          {purchases.length === 0 ? (
            <div className="text-center py-5">
              <i className="fa-solid fa-cart-shopping fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No Purchases Yet</h5>
              <p className="text-muted">Click the "New Purchase" button to add your first purchase.</p>
              <Button 
                variant="primary" 
                onClick={() => setShowAddModal(true)}
                disabled={products.length === 0}
              >
                <i className="fa-solid fa-plus me-2"></i>Add First Purchase
              </Button>
            </div>
          ) : (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit Cost</th>
                  <th>Total Cost</th>
                  <th>Supplier</th>
                  <th>Invoice</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(purchase => (
                  <tr key={purchase.id}>
                    <td>
                      <strong>{getProductName(purchase.product)}</strong>
                    </td>
                    <td className="text-center">
                      <Badge bg="secondary">{purchase.quantity}</Badge>
                    </td>
                    <td>₹{parseFloat(purchase.unit_cost).toFixed(2)}</td>
                    <td>
                      <strong className="text-success">₹{parseFloat(purchase.total_cost).toFixed(2)}</strong>
                    </td>
                    <td>{purchase.supplier || '-'}</td>
                    <td>{purchase.invoice_number || '-'}</td>
                    <td>{new Date(purchase.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-light">
                <tr>
                  <th colSpan="3" className="text-end">Totals:</th>
                  <th>₹{totalPurchaseAmount.toFixed(2)}</th>
                  <th colSpan="3"></th>
                </tr>
              </tfoot>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add Purchase Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Purchase</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Product <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="product"
                    value={newPurchase.product}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">-- Select Product --</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} (Current Stock: {product.quantity})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Supplier</Form.Label>
                  <Form.Control
                    type="text"
                    name="supplier"
                    value={newPurchase.supplier}
                    onChange={handleInputChange}
                    placeholder="Enter supplier name"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Quantity <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    name="quantity"
                    value={newPurchase.quantity}
                    onChange={handleInputChange}
                    required
                    min="1"
                    placeholder="Enter quantity"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Unit Cost (₹) <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="unit_cost"
                    value={newPurchase.unit_cost}
                    onChange={handleInputChange}
                    required
                    min="0"
                    placeholder="Enter cost"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Total Cost</Form.Label>
                  <Form.Control
                    type="text"
                    value={`₹${calculateTotal()}`}
                    disabled
                    className="bg-light fw-bold text-success"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Invoice Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="invoice_number"
                    value={newPurchase.invoice_number}
                    onChange={handleInputChange}
                    placeholder="Enter invoice #"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Purchase Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={newPurchase.date}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="notes"
                value={newPurchase.notes}
                onChange={handleInputChange}
                placeholder="Additional notes..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddPurchase}
            disabled={!newPurchase.product || !newPurchase.quantity || !newPurchase.unit_cost}
          >
            Add Purchase
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Purchases;