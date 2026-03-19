import { useState, useEffect } from 'react';
import { Container, Table, Card, Badge, InputGroup, Form, Button, Modal, Row, Col } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import api from '../../services/api';

const MyBills = () => {
  const { user } = useSelector((state) => state.auth);
  const [bills, setBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);

  useEffect(() => {
    fetchMyBills();
  }, []);

  const fetchMyBills = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sales/', {
        params: {
          cashier: user?.id,
          ordering: '-date'
        }
      });
      
      console.log('API Response:', response.data);
      setBills(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bills:', error);
      setLoading(false);
    }
  };

  const viewBillDetails = (bill) => {
    setSelectedBill(bill);
    setShowBillModal(true);
  };

  const filteredBills = bills.filter(bill =>
    bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bill.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bill.customer_phone || '').includes(searchTerm)
  );

  // Function to safely get items count
  const getItemCount = (bill) => {
    if (bill.items && Array.isArray(bill.items)) {
      return bill.items.length;
    }
    if (bill.item_count) {
      return bill.item_count;
    }
    return 0;
  };

  // Function to safely get items array
  const getItems = (bill) => {
    if (bill.items && Array.isArray(bill.items)) {
      return bill.items;
    }
    return [];
  };

  // Format currency
  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toFixed(2);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateString;
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
      <h2>My Bills</h2>
      <p className="text-muted">All bills created by you</p>

      <InputGroup className="mb-3 mt-3">
        <InputGroup.Text>
          <i className="fa-solid fa-search"></i>
        </InputGroup.Text>
        <Form.Control
          placeholder="Search by bill number or customer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </InputGroup>

      <Card className="shadow-sm">
        <Card.Body>
          <p className="text-muted mb-3">
            <i className="fa-solid fa-receipt me-2"></i>
            Total Bills: {filteredBills.length}
          </p>
          
          <div style={{ overflowX: 'auto' }}>
            <Table striped bordered hover responsive>
              <thead className="bg-light">
                <tr>
                  <th>Bill No.</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map(bill => {
                  const itemCount = getItemCount(bill);
                  const items = getItems(bill);
                  
                  return (
                    <tr 
                      key={bill.id} 
                      onClick={() => viewBillDetails(bill)}
                      style={{ cursor: 'pointer' }}
                      className="table-row-hover"
                    >
                      <td>
                        <strong>{bill.bill_number}</strong>
                      </td>
                      <td>{formatDate(bill.date)}</td>
                      <td>
                        <small className="text-muted">{formatTime(bill.date)}</small>
                      </td>
                      <td>
                        <strong>{bill.customer_name || 'Walk-in Customer'}</strong>
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
                        <Badge 
                          bg="info" 
                          pill
                          style={{ cursor: 'pointer' }}
                        >
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </Badge>
                        {items.length > 0 && (
                          <div className="mt-1">
                            <small className="text-muted">
                              {items[0]?.product_name || 'Product'}
                              {items.length > 1 && ` +${items.length - 1} more`}
                            </small>
                          </div>
                        )}
                      </td>
                      <td>
                        <Badge bg={
                          bill.payment_method === 'cash' ? 'success' :
                          bill.payment_method === 'card' ? 'primary' : 
                          bill.payment_method === 'upi' ? 'info' : 'secondary'
                        } pill>
                          {bill.payment_method?.toUpperCase() || 'CASH'}
                        </Badge>
                      </td>
                      <td className="text-end">
                        <strong className="text-success">₹{formatCurrency(bill.total_amount)}</strong>
                      </td>
                    </tr>
                  );
                })}
                {filteredBills.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-4">
                      <i className="fa-solid fa-receipt fa-2x mb-2"></i>
                      <p>No bills yet. Create your first bill!</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Bill Details Modal */}
      <Modal show={showBillModal} onHide={() => setShowBillModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="fa-solid fa-receipt me-2"></i>
            Bill #{selectedBill?.bill_number}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBill && (
            <>
              {/* Bill Header Info */}
              <Row className="mb-4">
                <Col md={3}>
                  <Card bg="light" className="text-center p-3 h-100">
                    <small className="text-muted">Date</small>
                    <strong className="mt-2">{formatDate(selectedBill.date)}</strong>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card bg="light" className="text-center p-3 h-100">
                    <small className="text-muted">Time</small>
                    <strong className="mt-2">{formatTime(selectedBill.date)}</strong>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card bg="light" className="text-center p-3 h-100">
                    <small className="text-muted">Payment Method</small>
                    <div className="mt-2">
                      <Badge bg={
                        selectedBill.payment_method === 'cash' ? 'success' :
                        selectedBill.payment_method === 'card' ? 'primary' : 
                        selectedBill.payment_method === 'upi' ? 'info' : 'secondary'
                      } pill style={{ fontSize: '1rem' }}>
                        {selectedBill.payment_method?.toUpperCase() || 'CASH'}
                      </Badge>
                    </div>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card bg="light" className="text-center p-3 h-100">
                    <small className="text-muted">Total Amount</small>
                    <strong className="text-success mt-2">₹{formatCurrency(selectedBill.total_amount)}</strong>
                  </Card>
                </Col>
              </Row>
              
              {/* Customer Info */}
              <Card className="mb-4">
                <Card.Header className="bg-primary text-white">
                  <i className="fa-solid fa-user me-2"></i>
                  Customer Details
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <strong>Name:</strong> {selectedBill.customer_name || 'Walk-in Customer'}
                    </Col>
                    {selectedBill.customer_phone && (
                      <Col md={6}>
                        <strong>Phone:</strong>{' '}
                        <Badge bg="info" pill>
                          <i className="fa-solid fa-phone me-1"></i>
                          {selectedBill.customer_phone}
                        </Badge>
                      </Col>
                    )}
                  </Row>
                </Card.Body>
              </Card>

              {/* Items List */}
              <Card>
                <Card.Header className="bg-info text-white">
                  <i className="fa-solid fa-box me-2"></i>
                  Items Purchased ({getItemCount(selectedBill)} items)
                </Card.Header>
                <Card.Body>
                  <Table striped bordered hover size="sm" className="align-middle">
                    <thead className="bg-light">
                      <tr>
                        <th>#</th>
                        <th>Product</th>
                        <th className="text-center">Quantity</th>
                        <th className="text-end">Unit Price (₹)</th>
                        <th className="text-end">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getItems(selectedBill).length > 0 ? (
                        getItems(selectedBill).map((item, index) => (
                          <tr key={item.id || index}>
                            <td>{index + 1}</td>
                            <td>
                              <strong>{item.product_name || `Product #${item.product}`}</strong>
                            </td>
                            <td className="text-center">
                              <Badge bg="secondary" pill>
                                {item.quantity}
                              </Badge>
                            </td>
                            <td className="text-end">
                              ₹{formatCurrency(item.unit_price)}
                            </td>
                            <td className="text-end">
                              <strong className="text-success">₹{formatCurrency(item.total)}</strong>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center text-muted py-4">
                            <i className="fa-solid fa-box-open fa-2x mb-2"></i>
                            <p>No items found in this bill</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-light">
                      <tr>
                        <th colSpan="4" className="text-end">Total Amount:</th>
                        <th className="text-end text-success">₹{formatCurrency(selectedBill.total_amount)}</th>
                      </tr>
                    </tfoot>
                  </Table>
                </Card.Body>
              </Card>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBillModal(false)}>
            <i className="fa-solid fa-times me-1"></i> Close
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
            <i className="fa-solid fa-print me-1"></i> Print Bill
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .table-row-hover:hover {
          background-color: rgba(0, 123, 255, 0.1) !important;
          transition: background-color 0.2s ease;
        }
      `}</style>
    </Container>
  );
};

export default MyBills;