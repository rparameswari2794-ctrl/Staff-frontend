import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Form, Button, Modal, Badge, Alert } from 'react-bootstrap';
import api from '../../services/api';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [dailyTotals, setDailyTotals] = useState({});
  const [newExpense, setNewExpense] = useState({
    category: 'other',
    description: '',
    amount: '',
    payment_method: 'cash',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Hardcoded expense categories from your model
  const expenseCategories = [
    { value: 'utilities', label: 'Utilities' },
    { value: 'rent', label: 'Rent' },
    { value: 'salary', label: 'Salary' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [dateRange]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/expenses/', {
        params: {
          date_from: dateRange.from,
          date_to: dateRange.to
        }
      });
      console.log('Expenses loaded:', response.data);
      setExpenses(response.data);
      
      // Calculate daily totals
      calculateDailyTotals(response.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('Failed to load expenses');
      setLoading(false);
    }
  };

  const calculateDailyTotals = (expensesData) => {
    const totals = {};
    
    expensesData.forEach(expense => {
      const date = new Date(expense.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const amount = parseFloat(expense.amount || 0);
      totals[date] = (totals[date] || 0) + amount;
    });
    
    setDailyTotals(totals);
  };

  const handleInputChange = (e) => {
    setNewExpense({
      ...newExpense,
      [e.target.name]: e.target.value
    });
  };

  const handleAddExpense = async () => {
    try {
      setError('');
      
      if (!newExpense.description || !newExpense.amount) {
        setError('Please fill all required fields');
        return;
      }

      const expenseData = {
        category: newExpense.category,
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        payment_method: newExpense.payment_method,
        date: newExpense.date,
        notes: newExpense.notes
      };
      
      console.log('Submitting expense:', expenseData);
      
      const response = await api.post('/expenses/', expenseData);
      console.log('Expense created:', response.data);
      
      await fetchExpenses();
      
      setSuccess('Expense added successfully!');
      setShowAddModal(false);
      resetForm();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error adding expense:', error);
      setError(error.response?.data?.message || 'Failed to add expense');
    }
  };

  const resetForm = () => {
    setNewExpense({
      category: 'other',
      description: '',
      amount: '',
      payment_method: 'cash',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const getCategoryLabel = (categoryValue) => {
    const category = expenseCategories.find(c => c.value === categoryValue);
    return category ? category.label : categoryValue;
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

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
            <i className="fa-solid fa-money-bill-wave me-2 text-danger"></i>
            Expense Management
          </h2>
          <p className="text-muted">Track and manage business expenses</p>
        </Col>
        <Col className="text-end">
          <Button variant="danger" onClick={() => setShowAddModal(true)}>
            <i className="fa-solid fa-plus me-2"></i>Add Expense
          </Button>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess('')} dismissible>
          {success}
        </Alert>
      )}

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={4}>
          <Card bg="danger" text="white" className="shadow-sm">
            <Card.Body className="text-center">
              <h6>Total Expenses</h6>
              <h3>₹{totalExpenses.toFixed(2)}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card bg="info" text="white" className="shadow-sm">
            <Card.Body className="text-center">
              <h6>Number of Expenses</h6>
              <h3>{expenses.length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card bg="success" text="white" className="shadow-sm">
            <Card.Body className="text-center">
              <h6>Categories</h6>
              <h3>{expenseCategories.length}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Daily Totals */}
      {Object.keys(dailyTotals).length > 0 && (
        <Card className="mb-4">
          <Card.Header className="bg-secondary text-white">
            <h5 className="mb-0">
              <i className="fa-solid fa-calendar-day me-2"></i>
              Daily Expense Totals
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {Object.entries(dailyTotals).map(([date, total]) => (
                <Col key={date} md={3} className="mb-3">
                  <Card bg="light" className="text-center h-100">
                    <Card.Body>
                      <small className="text-muted d-block mb-2">{date}</small>
                      <h4 className="text-danger mb-0">₹{total.toFixed(2)}</h4>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

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

      {/* Expenses Table */}
      <Card className="shadow-sm">
        <Card.Header className="bg-danger text-white">
          <h5 className="mb-0">
            <i className="fa-solid fa-list me-2"></i>
            Expenses List
          </h5>
        </Card.Header>
        <Card.Body>
          {expenses.length === 0 ? (
            <div className="text-center py-5">
              <i className="fa-solid fa-receipt fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No Expenses Yet</h5>
              <p className="text-muted">Click the "Add Expense" button to add your first expense.</p>
              <Button variant="danger" onClick={() => setShowAddModal(true)}>
                <i className="fa-solid fa-plus me-2"></i>Add First Expense
              </Button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(expense => (
                    <tr key={expense.id}>
                      <td>{new Date(expense.date).toLocaleDateString()}</td>
                      <td>
                        <Badge bg="secondary">
                          {getCategoryLabel(expense.category)}
                        </Badge>
                      </td>
                      <td>{expense.description}</td>
                      <td>
                        <strong className="text-danger">₹{parseFloat(expense.amount).toFixed(2)}</strong>
                      </td>
                      <td>
                        <Badge bg={
                          expense.payment_method === 'cash' ? 'success' :
                          expense.payment_method === 'card' ? 'primary' : 'warning'
                        }>
                          {expense.payment_method?.toUpperCase()}
                        </Badge>
                      </td>
                      <td>
                        <small className="text-muted">{expense.notes || '-'}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-light">
                  <tr>
                    <th colSpan="3" className="text-end">Total:</th>
                    <th className="text-danger">₹{totalExpenses.toFixed(2)}</th>
                    <th colSpan="2"></th>
                  </tr>
                </tfoot>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add Expense Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Expense</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Category <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="category"
                value={newExpense.category}
                onChange={handleInputChange}
                required
              >
                {expenseCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="description"
                value={newExpense.description}
                onChange={handleInputChange}
                required
                placeholder="Enter expense description"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Amount (₹) <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                name="amount"
                value={newExpense.amount}
                onChange={handleInputChange}
                required
                min="0"
                placeholder="Enter amount"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Payment Method</Form.Label>
              <Form.Select
                name="payment_method"
                value={newExpense.payment_method}
                onChange={handleInputChange}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                name="date"
                value={newExpense.date}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="notes"
                value={newExpense.notes}
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
            variant="danger" 
            onClick={handleAddExpense}
            disabled={!newExpense.description || !newExpense.amount}
          >
            Add Expense
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Expenses;