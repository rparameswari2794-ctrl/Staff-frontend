// src/pages/admin/CustomerSales.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Container, Table, Card, Badge, Form, Row, Col, 
  InputGroup, Button, Pagination, Alert, Spinner 
} from 'react-bootstrap';
import api from '../../services/api';

// Custom debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const CustomerSales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0
  });
  const [summary, setSummary] = useState({
    totalAmount: 0,
    totalSales: 0
  });

  // Fetch sales data
  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        date_from: dateRange.from,
        date_to: dateRange.to,
        page: pagination.currentPage,
        page_size: pagination.itemsPerPage
      };

      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      console.log('Fetching sales with params:', params);
      const response = await api.get('/sales/', { params });

      console.log('Sales data received:', response.data);

      // Handle response structure
      let salesData = [];
      let totalCount = 0;
      let totalAmount = 0;

      if (response.data.results) {
        salesData = response.data.results;
        totalCount = response.data.count || response.data.total_count || salesData.length;
        totalAmount = response.data.total_amount || 0;
      } else if (Array.isArray(response.data)) {
        salesData = response.data;
        totalCount = salesData.length;
        totalAmount = salesData.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0);
      }

      setSales(salesData);
      setSummary({
        totalAmount,
        totalSales: totalCount
      });
      setPagination(prev => ({
        ...prev,
        totalItems: totalCount
      }));
      
    } catch (error) {
      console.error('Error fetching sales:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to, pagination.currentPage, pagination.itemsPerPage, debouncedSearchTerm]);

  // Handle API errors
  const handleApiError = (error) => {
    if (error.response) {
      setError(
        error.response.data?.message || 
        error.response.data?.error || 
        error.response.data?.detail ||
        `Server error (${error.response.status}): ${error.response.statusText}`
      );
    } else if (error.request) {
      setError('No response from server. Please check your network connection.');
    } else {
      setError(error.message || 'Failed to load sales data. Please try again.');
    }
  };

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Filter sales based on search term
  const filteredSales = useMemo(() => {
    if (!debouncedSearchTerm.trim() || sales.length === 0) return sales;
    
    const search = debouncedSearchTerm.toLowerCase().trim();
    return sales.filter(sale => {
      try {
        return (
          (sale.bill_number?.toLowerCase() || '').includes(search) ||
          (sale.customer_name?.toLowerCase() || '').includes(search) ||
          (sale.customer_phone?.toLowerCase() || '').includes(search) ||
          (getCustomerDisplay(sale).toLowerCase().includes(search)) ||
          (sale.cashier_username?.toLowerCase() || '').includes(search) ||
          (sale.payment_method?.toLowerCase() || '').includes(search)
        );
      } catch (err) {
        return false;
      }
    });
  }, [sales, debouncedSearchTerm]);

  const displaySales = filteredSales;

  // Pagination logic
  const paginatedSales = useMemo(() => {
    try {
      if (displaySales.length === 0) return [];
      const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
      const endIndex = Math.min(startIndex + pagination.itemsPerPage, displaySales.length);
      return displaySales.slice(startIndex, endIndex);
    } catch (err) {
      console.error('Error paginating sales:', err);
      return [];
    }
  }, [displaySales, pagination.currentPage, pagination.itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(displaySales.length / pagination.itemsPerPage));

  // Helper functions
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).replace(' at', '');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    try {
      const num = parseFloat(amount || 0);
      return isNaN(num) ? '0.00' : num.toFixed(2);
    } catch {
      return '0.00';
    }
  };

  const getCustomerDisplay = (sale) => {
    // Use customer_display if available from backend
    if (sale.customer_display) {
      return sale.customer_display;
    }
    
    // Otherwise combine name and phone
    const name = sale.customer_name || 'Walk-in Customer';
    const phone = sale.customer_phone;
    
    if (phone && phone !== 'null' && phone !== 'undefined') {
      return `${name} - ${phone}`;
    }
    
    return name;
  };

  const getCashierDisplay = (sale) => {
    return sale.cashier_username || 'System';
  };

  const getPaymentMethodBadge = (method) => {
    const methodStr = method?.toLowerCase() || 'cash';
    const variants = {
      cash: 'success',
      card: 'primary',
      upi: 'info'
    };
    
    const displayMethod = method?.toUpperCase() || 'CASH';
    
    return (
      <Badge bg={variants[methodStr] || 'secondary'} pill>
        {displayMethod}
      </Badge>
    );
  };

  const handlePageChange = (pageNumber) => {
    setPagination(prev => ({
      ...prev,
      currentPage: pageNumber
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const retryFetch = () => {
    fetchSales();
  };

  const exportToCSV = () => {
    try {
      const headers = ['Bill Number', 'Customer', 'Phone', 'Cashier', 'Total Amount', 'Payment Method', 'Date'];
      const csvRows = [];
      
      csvRows.push(headers.join(','));
      
      displaySales.forEach(sale => {
        try {
          const customerName = sale.customer_name || 'Walk-in Customer';
          const customerPhone = sale.customer_phone || '';
          
          const row = [
            `"${(sale.bill_number || '').replace(/"/g, '""')}"`,
            `"${customerName.replace(/"/g, '""')}"`,
            `"${customerPhone.replace(/"/g, '""')}"`,
            `"${getCashierDisplay(sale).replace(/"/g, '""')}"`,
            formatCurrency(sale.total_amount),
            `"${(sale.payment_method || 'CASH').replace(/"/g, '""')}"`,
            `"${formatDateTime(sale.date).replace(/"/g, '""')}"`
          ];
          csvRows.push(row.join(','));
        } catch (err) {
          console.error('Error processing sale for CSV:', err);
        }
      });
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `customer_sales_${dateRange.from}_to_${dateRange.to}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      setError('Failed to export data. Please try again.');
    }
  };

  // Render pagination
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
      items.push(<Pagination.First key="first" onClick={() => handlePageChange(1)} />);
    }
    
    items.push(
      <Pagination.Prev 
        key="prev" 
        onClick={() => handlePageChange(pagination.currentPage - 1)}
        disabled={pagination.currentPage === 1}
      />
    );
    
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item 
          key={i} 
          active={i === pagination.currentPage}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }
    
    items.push(
      <Pagination.Next 
        key="next" 
        onClick={() => handlePageChange(pagination.currentPage + 1)}
        disabled={pagination.currentPage === totalPages}
      />
    );
    
    if (endPage < totalPages) {
      items.push(<Pagination.Last key="last" onClick={() => handlePageChange(totalPages)} />);
    }
    
    return items;
  };

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
      <h2 className="mb-4">Customer Sales</h2>
      <p className="text-muted mb-4">View all sales with customer details</p>

      {error && (
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>
            <i className="fa-solid fa-circle-exclamation me-2"></i>
            Error Loading Data
          </Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button variant="outline-danger" onClick={retryFetch}>
              <i className="fa-solid fa-rotate-right me-2"></i>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>From Date</Form.Label>
                <Form.Control
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => handleDateChange('from', e.target.value)}
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
                  onChange={(e) => handleDateChange('to', e.target.value)}
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
                    placeholder="Search by bill, customer name, phone, cashier..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={2} className="d-flex align-items-end">
              <Button 
                variant="primary" 
                onClick={fetchSales} 
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
        </Card.Body>
      </Card>

      {/* Summary Stats */}
      <Row className="mb-4">
        <Col md={6}>
          <Card bg="primary" text="white" className="shadow-sm">
            <Card.Body className="text-center">
              <h6>Total Sales</h6>
              <h3>{summary.totalSales}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card bg="success" text="white" className="shadow-sm">
            <Card.Body className="text-center">
              <h6>Total Amount</h6>
              <h3>₹{formatCurrency(summary.totalAmount)}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Export Button */}
      <Row className="mb-3">
        <Col className="text-end">
          <Button 
            variant="success" 
            onClick={exportToCSV}
            disabled={displaySales.length === 0}
          >
            <i className="fa-solid fa-download me-2"></i>
            Export CSV ({displaySales.length} records)
          </Button>
        </Col>
      </Row>

      {/* Sales Table */}
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="fa-solid fa-receipt me-2"></i>
            Sales List
          </h5>
          <Badge bg="light" text="dark" pill>
            Showing {paginatedSales.length} of {displaySales.length}
          </Badge>
        </Card.Header>
        <Card.Body>
          <div style={{ overflowX: 'auto' }}>
            <Table striped bordered hover responsive className="align-middle">
              <thead className="bg-light">
                <tr>
                  <th>Bill Number</th>
                  <th>Customer</th>
                  <th>Cashier</th>
                  <th className="text-end">Amount (₹)</th>
                  <th>Payment</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSales.length > 0 ? (
                  paginatedSales.map((sale, index) => (
                    <tr key={sale.id || sale.bill_number || index}>
                      <td>
                        <strong>{sale.bill_number || '-'}</strong>
                      </td>
                      <td>
                        {getCustomerDisplay(sale)}
                      </td>
                      <td>
                        <Badge bg="secondary" pill>
                          <i className="fa-solid fa-user me-1"></i>
                          {getCashierDisplay(sale)}
                        </Badge>
                      </td>
                      <td className="text-end">
                        <strong className="text-success">
                          ₹{formatCurrency(sale.total_amount)}
                        </strong>
                      </td>
                      <td>
                        {getPaymentMethodBadge(sale.payment_method)}
                      </td>
                      <td>
                        <small>
                          <i className="fa-regular fa-calendar me-1"></i>
                          {formatDateTime(sale.date)}
                        </small>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
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

          {/* Pagination */}
          {displaySales.length > pagination.itemsPerPage && (
            <Row className="mt-3">
              <Col className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-muted">
                    Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                    {Math.min(pagination.currentPage * pagination.itemsPerPage, displaySales.length)} of{' '}
                    {displaySales.length}
                  </span>
                </div>
                <Pagination>
                  {renderPagination()}
                </Pagination>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CustomerSales;