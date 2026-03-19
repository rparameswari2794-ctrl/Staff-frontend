import { useState, useEffect, useMemo } from 'react';
import { Container, Table, Card, Badge, InputGroup, Form, Button, Modal, Row, Col, Alert, Spinner } from 'react-bootstrap';
import api from '../../services/api';

const EmployeeSales = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [dailyTotals, setDailyTotals] = useState({});
  const [employeeTotals, setEmployeeTotals] = useState({});

  useEffect(() => {
    fetchAllSales();
  }, [dateRange]);

  const fetchAllSales = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/sales/', {
        params: {
          date_from: dateRange.from,
          date_to: dateRange.to,
          ordering: '-date'
        }
      });
      
      console.log('Sales data:', response.data);
      
      // Handle different response structures
      let salesData = [];
      if (response.data.results) {
        salesData = response.data.results;
      } else if (Array.isArray(response.data)) {
        salesData = response.data;
      }
      
      setSales(salesData);
      setFilteredSales(salesData);
      
      // Calculate daily totals
      const totals = {};
      const empTotals = {};
      
      salesData.forEach(sale => {
        const date = new Date(sale.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        totals[date] = (totals[date] || 0) + parseFloat(sale.total_amount || 0);
        
        // Calculate employee totals
        const cashier = getCashierName(sale);
        empTotals[cashier] = (empTotals[cashier] || 0) + parseFloat(sale.total_amount || 0);
      });
      
      setDailyTotals(totals);
      setEmployeeTotals(empTotals);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sales:', error);
      setError(error.response?.data?.message || 'Failed to load sales data');
      setLoading(false);
    }
  };

  const viewBillDetails = (bill) => {
    setSelectedBill(bill);
    setShowBillModal(true);
  };

  // Format customer display with name and phone
  const formatCustomer = (bill) => {
    // Try different possible fields
    if (bill.customer_display) {
      return bill.customer_display;
    }
    
    const name = bill.customer_name || bill.customer?.name || 'Walk-in Customer';
    const phone = bill.customer_phone || bill.customer?.phone || '';
    
    if (phone && phone !== 'null' && phone !== 'undefined') {
      return `${name} - ${phone}`;
    }
    
    return name;
  };

  // Get cashier name from various possible fields
  const getCashierName = (bill) => {
    if (bill.cashier_username) {
      return bill.cashier_username;
    }
    if (bill.user) {
      return bill.user;
    }
    if (bill.cashier) {
      if (typeof bill.cashier === 'object') {
        return bill.cashier.username || 'Staff';
      }
      return bill.cashier;
    }
    if (bill.cashier_name) {
      return bill.cashier_name;
    }
    return 'System';
  };

  // Get payment method badge color
  const getPaymentMethodBadge = (method) => {
    const methodLower = method?.toLowerCase() || 'cash';
    const variants = {
      cash: 'success',
      card: 'primary',
      upi: 'info',
      credit: 'warning',
      debit: 'secondary'
    };
    
    return variants[methodLower] || 'secondary';
  };

  // Safely get items count
  const getItemCount = (bill) => {
    if (bill.items && Array.isArray(bill.items)) {
      return bill.items.length;
    }
    if (bill.item_count) {
      return bill.item_count;
    }
    return 0;
  };

  // Safely get items array
  const getItems = (bill) => {
    if (bill.items && Array.isArray(bill.items)) {
      return bill.items;
    }
    return [];
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Format time for display
  const formatTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
    } catch {
      return '';
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    const num = parseFloat(amount || 0);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // Filter sales by search term
  const filteredBySearch = useMemo(() => {
    if (!searchTerm.trim()) return filteredSales;
    
    const search = searchTerm.toLowerCase().trim();
    return filteredSales.filter(bill => {
      const customerDisplay = formatCustomer(bill).toLowerCase();
      const cashierName = getCashierName(bill).toLowerCase();
      
      return (
        (bill.bill_number?.toLowerCase() || '').includes(search) ||
        customerDisplay.includes(search) ||
        cashierName.includes(search) ||
        (bill.payment_method?.toLowerCase() || '').includes(search)
      );
    });
  }, [filteredSales, searchTerm]);

  // Calculate totals
  const totalAmount = filteredBySearch.reduce((sum, bill) => 
    sum + parseFloat(bill.total_amount || 0), 0
  );
  
  const totalItems = filteredBySearch.reduce((sum, bill) => 
    sum + getItemCount(bill), 0
  );

  if (loading && sales.length === 0) {
    return (
      <Container className="text-center py-5" style={{ marginTop: '80px' }}>
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Loading sales data...</p>
      </Container>
    );
  }

  return (
    <Container style={{ marginTop: '80px' }} fluid>
      <h2 className="mb-4">Employee Sales Report</h2>
      <p className="text-muted mb-4">View all sales with employee-wise totals</p>

      {error && (
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>
            <i className="fa-solid fa-circle-exclamation me-2"></i>
            Error
          </Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button variant="outline-danger" onClick={fetchAllSales}>
              <i className="fa-solid fa-rotate-right me-2"></i>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {/* Date Filter */}
      <Row className="mb-4">
        <Col md={3}>
          <Form.Group>
            <Form.Label>From Date</Form.Label>
            <Form.Control
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
              max={dateRange.to}
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
              min={dateRange.from}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Search</Form.Label>
            <InputGroup>
              <InputGroup.Text>
                <i className="fa-solid fa-search"></i>
              </InputGroup.Text>
              <Form.Control
                placeholder="Search by bill, customer, cashier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </Form.Group>
        </Col>
        <Col md={2} className="d-flex align-items-end">
          <Button 
            variant="primary" 
            onClick={fetchAllSales} 
            className="w-100"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
                Loading...
              </>
            ) : (
              <>
                <i className="fa-solid fa-filter me-2"></i>
                Apply
              </>
            )}
          </Button>
        </Col>
      </Row>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card bg="info" text="white" className="shadow-sm">
            <Card.Body className="text-center">
              <h6>Total Bills</h6>
              <h3>{filteredBySearch.length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card bg="success" text="white" className="shadow-sm">
            <Card.Body className="text-center">
              <h6>Total Amount</h6>
              <h3>₹{formatCurrency(totalAmount)}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card bg="primary" text="white" className="shadow-sm">
            <Card.Body className="text-center">
              <h6>Total Items</h6>
              <h3>{totalItems}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card bg="warning" text="white" className="shadow-sm">
            <Card.Body className="text-center">
              <h6>Avg. Bill Value</h6>
              <h3>₹{filteredBySearch.length ? formatCurrency(totalAmount / filteredBySearch.length) : '0.00'}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Employee-wise Totals */}
      {Object.keys(employeeTotals).length > 0 && (
        <Card className="mb-4 shadow-sm">
          <Card.Header className="bg-secondary text-white">
            <h5 className="mb-0">
              <i className="fa-solid fa-users me-2"></i>
              Employee-wise Sales Totals
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {Object.entries(employeeTotals).map(([employee, total]) => (
                <Col key={employee} md={3} className="mb-3">
                  <Card bg="light" className="text-center h-100">
                    <Card.Body>
                      <Badge bg="info" pill className="mb-2">
                        <i className="fa-solid fa-user me-1"></i>
                        {employee}
                      </Badge>
                      <h5 className="text-success mt-2">₹{formatCurrency(total)}</h5>
                      <small className="text-muted">
                        {filteredBySearch.filter(b => getCashierName(b) === employee).length} bills
                      </small>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Daily Totals */}
      {Object.keys(dailyTotals).length > 0 && (
        <Card className="mb-4 shadow-sm">
          <Card.Header className="bg-secondary text-white">
            <h5 className="mb-0">
              <i className="fa-regular fa-calendar me-2"></i>
              Daily Totals
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {Object.entries(dailyTotals).map(([date, total]) => (
                <Col key={date} md={3} className="mb-3">
                  <Card bg="light" className="text-center h-100">
                    <Card.Body>
                      <small className="text-muted">{date}</small>
                      <h5 className="text-success mt-2">₹{formatCurrency(total)}</h5>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Sales Table */}
      <Card className="shadow-sm">
        <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="fa-solid fa-receipt me-2"></i>
            Sales Details
          </h5>
          <Badge bg="light" text="dark" pill>
            {filteredBySearch.length} records
          </Badge>
        </Card.Header>
        <Card.Body>
          <div style={{ overflowX: 'auto' }}>
            <Table striped bordered hover responsive className="align-middle">
              <thead className="bg-light">
                <tr>
                  <th>#</th>
                  <th>Bill No.</th>
                  <th>Customer</th>
                  <th>Cashier</th>
                  <th className="text-end">Amount (₹)</th>
                  <th>Payment</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBySearch.length > 0 ? (
                  filteredBySearch.map((bill, index) => (
                    <tr key={bill.id || bill.bill_number || index}>
                      <td>
                        <small className="text-muted">{index + 1}</small>
                      </td>
                      <td>
                        <strong className="text-primary">{bill.bill_number || '-'}</strong>
                      </td>
                      <td>
                        {formatCustomer(bill)}
                      </td>
                      <td>
                        <Badge bg="info" pill>
                          <i className="fa-solid fa-user me-1"></i>
                          {getCashierName(bill)}
                        </Badge>
                      </td>
                      <td className="text-end">
                        <strong className="text-success">
                          ₹{formatCurrency(bill.total_amount)}
                        </strong>
                      </td>
                      <td>
                        <Badge bg={getPaymentMethodBadge(bill.payment_method)} pill>
                          {bill.payment_method?.toUpperCase() || 'CASH'}
                        </Badge>
                      </td>
                      <td>
                        <small>{formatDate(bill.date)}</small>
                      </td>
                      <td>
                        <small className="text-muted">{formatTime(bill.date)}</small>
                      </td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => viewBillDetails(bill)}
                          title="View Bill Details"
                        >
                          <i className="fa-solid fa-eye"></i>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center py-5">
                      <i className="fa-solid fa-receipt fa-3x text-muted mb-3"></i>
                      <h5 className="text-muted">No sales found</h5>
                      <p className="text-muted mb-0">
                        {searchTerm ? 'Try adjusting your search' : 'Try adjusting your date range'}
                      </p>
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
              <Row className="mb-4">
                <Col md={3}>
                  <Card bg="light" className="text-center p-3 h-100">
                    <small className="text-muted">Cashier</small>
                    <strong className="mt-2">
                      <Badge bg="info" pill>
                        {getCashierName(selectedBill)}
                      </Badge>
                    </strong>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card bg="light" className="text-center p-3 h-100">
                    <small className="text-muted">Date & Time</small>
                    <strong className="mt-2">{formatDate(selectedBill.date)}</strong>
                    <small className="text-muted">{formatTime(selectedBill.date)}</small>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card bg="light" className="text-center p-3 h-100">
                    <small className="text-muted">Payment Method</small>
                    <div className="mt-2">
                      <Badge bg={getPaymentMethodBadge(selectedBill.payment_method)} pill>
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
                        <strong>Phone:</strong> 
                        <Badge bg="info" pill className="ms-2">
                          <i className="fa-solid fa-phone me-1"></i>
                          {selectedBill.customer_phone}
                        </Badge>
                      </Col>
                    )}
                  </Row>
                </Card.Body>
              </Card>

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
                              <strong>₹{formatCurrency(item.total)}</strong>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center py-4">
                            <i className="fa-solid fa-box-open fa-2x text-muted mb-2"></i>
                            <p className="text-muted">No items found</p>
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
            <i className="fa-solid fa-times me-1"></i>
            Close
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
            <i className="fa-solid fa-print me-1"></i>
            Print Bill
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EmployeeSales;