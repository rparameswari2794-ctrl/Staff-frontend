import { useState, useEffect } from 'react';
import { Container, Table, Card, Badge, Button, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/admin/products/');
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const filteredProducts = products
    .filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.product_code?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(product => lowStockOnly ? product.quantity < 10 : true);

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <div className="spinner-border text-primary" role="status" />
      </Container>
    );
  }

  return (
    <Container style={{ marginTop: '80px' }}>
      <h2>Product Management</h2>
      <p className="text-muted">Admin View - Manage all products</p>
      
      <Row className="mb-3">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>
              <i className="fa-solid fa-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={3}>
          <Form.Check
            type="checkbox"
            label="Show low stock only (&lt;10)"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
          />
        </Col>
      </Row>

      <Card>
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">All Products ({filteredProducts.length})</h5>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>#</th>
                <th>Product Code</th>
                <th>Name</th>
                <th>Price</th>
                <th>Cost</th>
                <th>Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => (
                <tr key={product.id}>
                  <td>{index + 1}</td>
                  <td><Badge bg="secondary">{product.product_code || '-'}</Badge></td>
                  <td>{product.name}</td>
                  <td>₹{parseFloat(product.price).toFixed(2)}</td>
                  <td>₹{parseFloat(product.cost).toFixed(2)}</td>
                  <td>
                    <Badge bg={
                      product.quantity > 10 ? 'success' :
                      product.quantity > 0 ? 'warning' : 'danger'
                    }>
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
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminProducts;