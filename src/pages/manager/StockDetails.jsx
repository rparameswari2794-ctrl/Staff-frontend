import { useState, useEffect } from 'react';
import { Container, Table, Card, Button, Badge, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const StockDetails = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Low stock threshold
  const LOW_STOCK_THRESHOLD = 20;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products/');
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.product_code && product.product_code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate stats based on LOW_STOCK_THRESHOLD
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.quantity < LOW_STOCK_THRESHOLD && p.quantity > 0).length;
  const outOfStockCount = products.filter(p => p.quantity === 0).length;
  const totalValue = filteredProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  return (
    <Container style={{ marginTop: '80px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fa-solid fa-chart-line me-2 text-info"></i>
          Stock Details
        </h2>
        <Button as={Link} to="/manager/dashboard" variant="outline-secondary">
          <i className="fa-solid fa-arrow-left me-2"></i>
          Back to Dashboard
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="d-flex gap-3 mb-4">
        <Card bg="primary" text="white" className="shadow-sm flex-fill">
          <Card.Body className="text-center">
            <h6>Total Products</h6>
            <h3>{totalProducts}</h3>
          </Card.Body>
        </Card>
        <Card bg="success" text="white" className="shadow-sm flex-fill">
          <Card.Body className="text-center">
            <h6>Total Value</h6>
            <h3>₹{totalValue.toFixed(2)}</h3>
          </Card.Body>
        </Card>
        <Card bg="warning" text="dark" className="shadow-sm flex-fill">
          <Card.Body className="text-center">
            <h6>Low Stock (&lt;{LOW_STOCK_THRESHOLD})</h6>
            <h3>{lowStockCount}</h3>
          </Card.Body>
        </Card>
        <Card bg="danger" text="white" className="shadow-sm flex-fill">
          <Card.Body className="text-center">
            <h6>Out of Stock</h6>
            <h3>{outOfStockCount}</h3>
          </Card.Body>
        </Card>
      </div>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <InputGroup>
            <InputGroup.Text>
              <i className="fa-solid fa-search"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by product name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Header className="bg-info text-white">
          <h5 className="mb-0">Stock List ({filteredProducts.length})</h5>
        </Card.Header>
        <Card.Body>
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <Table striped bordered hover>
              <thead className="sticky-top bg-white">
                <tr>
                  <th>#</th>
                  <th>Product Code</th>
                  <th>Product Name</th>
                  <th>Price (₹)</th>
                  <th>Stock</th>
                  <th>Value (₹)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, index) => (
                  <tr key={product.id}>
                    <td>{index + 1}</td>
                    <td>
                      <Badge bg="secondary">{product.product_code || '-'}</Badge>
                    </td>
                    <td>{product.name}</td>
                    <td>₹{parseFloat(product.price).toFixed(2)}</td>
                    <td>
                      <Badge 
                        bg={
                          product.quantity === 0 ? 'danger' :
                          product.quantity < LOW_STOCK_THRESHOLD ? 'warning' : 'success'
                        }
                      >
                        {product.quantity}
                      </Badge>
                    </td>
                    <td>₹{(product.price * product.quantity).toFixed(2)}</td>
                    <td>
                      {product.quantity === 0 ? (
                        <Badge bg="danger">Out of Stock</Badge>
                      ) : product.quantity < LOW_STOCK_THRESHOLD ? (
                        <Badge bg="warning">Low Stock</Badge>
                      ) : (
                        <Badge bg="success">In Stock</Badge>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      No products found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default StockDetails;