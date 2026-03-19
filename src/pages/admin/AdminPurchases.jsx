import { useState, useEffect } from 'react';
import { Container, Table, Card, Badge, Form, Row, Col } from 'react-bootstrap';
import api from '../../services/api';

const AdminPurchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchPurchases();
  }, [dateRange]);

  const fetchPurchases = async () => {
    try {
      const response = await api.get('/admin/purchases/', {
        params: {
          date_from: dateRange.from,
          date_to: dateRange.to
        }
      });
      setPurchases(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <div className="spinner-border text-primary" role="status" />
      </Container>
    );
  }

  return (
    <Container style={{ marginTop: '80px' }}>
      <h2>Purchase Management</h2>
      <p className="text-muted">Admin View - View all purchases</p>
      
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

      <Card>
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Purchase Records</h5>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Supplier</th>
                <th>Quantity</th>
                <th>Unit Cost</th>
                <th>Total Cost</th>
                <th>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map(purchase => (
                <tr key={purchase.id}>
                  <td>{new Date(purchase.date).toLocaleDateString()}</td>
                  <td>{purchase.product_name}</td>
                  <td>{purchase.supplier}</td>
                  <td>{purchase.quantity}</td>
                  <td>₹{parseFloat(purchase.unit_cost).toFixed(2)}</td>
                  <td>₹{parseFloat(purchase.total_cost).toFixed(2)}</td>
                  <td>{purchase.invoice_number || '-'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminPurchases;