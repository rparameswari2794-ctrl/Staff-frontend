import { useState, useEffect } from 'react';
import { Container, Table, Card, Badge, Form, Row, Col } from 'react-bootstrap';
import api from '../../services/api';

const AdminExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchExpenses();
  }, [dateRange]);

  const fetchExpenses = async () => {
    try {
      const response = await api.get('/admin/expenses/', {
        params: {
          date_from: dateRange.from,
          date_to: dateRange.to
        }
      });
      setExpenses(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching expenses:', error);
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
      <h2>Expense Management</h2>
      <p className="text-muted">Admin View - View all expenses</p>
      
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
          <h5 className="mb-0">Expense Records</h5>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Created By</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(expense => (
                <tr key={expense.id}>
                  <td>{new Date(expense.date).toLocaleDateString()}</td>
                  <td>{expense.description}</td>
                  <td><Badge bg="secondary">{expense.category}</Badge></td>
                  <td>₹{parseFloat(expense.amount).toFixed(2)}</td>
                  <td>
                    <Badge bg={
                      expense.payment_method === 'cash' ? 'success' :
                      expense.payment_method === 'card' ? 'primary' : 'warning'
                    }>
                      {expense.payment_method?.toUpperCase()}
                    </Badge>
                  </td>
                  <td>{expense.created_by_username}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminExpenses;