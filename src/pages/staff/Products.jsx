import { useState, useEffect } from 'react';
import { Container, Table, Card, Button, Badge, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fa-solid fa-boxes me-2 text-info"></i>
          Products Inventory
        </h2>
        <Button as={Link} to="/staff/dashboard" variant="outline-secondary">
          <i className="fa-solid fa-arrow-left me-2"></i>
          Back to Dashboard
        </Button>
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
          <h5 className="mb-0">All Products ({filteredProducts.length})</h5>
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
                  <th>Cost (₹)</th>
                  <th>Stock</th>
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
                    <td>₹{parseFloat(product.cost).toFixed(2)}</td>
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

export default Products;