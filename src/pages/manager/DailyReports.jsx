import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Badge, Alert, Spinner, Modal } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { toast } from 'react-toastify';

const DailyReports = () => {
  const { user, role } = useSelector((state) => state.auth);
  
  // Set default date to yesterday (since today might not have data)
  const getYesterdayDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };
  
  const [reportDate, setReportDate] = useState(getYesterdayDate());
  const [reportData, setReportData] = useState({
    sales: [],
    purchases: [],
    expenses: []
  });
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalPurchases: 0,
    totalExpenses: 0,
    profit: 0,
    salesCount: 0,
    purchasesCount: 0,
    expensesCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittedReports, setSubmittedReports] = useState([]);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showReportDetails, setShowReportDetails] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    fetchDailyReport();
    if (role === 'admin' || role === 'manager') {
      fetchSubmittedReports();
    }
  }, [reportDate, role]);

  const fetchDailyReport = async () => {
    try {
      setLoading(true);
      setError(null);
      setPermissionError(false);
      
      console.log('Fetching data for date:', reportDate);
      
      const params = { date: reportDate };
      
      const [salesRes, purchasesRes, expensesRes] = await Promise.all([
        api.get('/sales/', { params }),
        api.get('/purchases/', { params }),
        api.get('/expenses/', { params })
      ]);

      const sales = salesRes.data.results || salesRes.data || [];
      const purchases = purchasesRes.data.results || purchasesRes.data || [];
      const expenses = expensesRes.data.results || expensesRes.data || [];

      const totalSales = sales.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0);
      const totalPurchases = purchases.reduce((sum, p) => sum + (parseFloat(p.total_cost) || 0), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

      setReportData({ sales, purchases, expenses });
      setSummary({
        totalSales,
        totalPurchases,
        totalExpenses,
        profit: totalSales - totalPurchases - totalExpenses,
        salesCount: sales.length,
        purchasesCount: purchases.length,
        expensesCount: expenses.length
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching report:', error);
      setError(error.response?.data?.message || 'Failed to load report data');
      setLoading(false);
    }
  };

  const fetchSubmittedReports = async () => {
    try {
      setPermissionError(false);
      console.log('Fetching submitted reports...');
      const response = await api.get('/reports/');
      console.log('All submitted reports:', response.data);
      setSubmittedReports(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching submitted reports:', error);
      if (error.response?.status === 403) {
        setPermissionError(true);
        toast.warning('You do not have permission to view reports');
      }
    }
  };

  const submitReport = async () => {
  try {
    setActionLoading(true);
    
    // Check if there are any transactions to report
    if (summary.salesCount === 0 && summary.purchasesCount === 0 && summary.expensesCount === 0) {
      toast.warning('No transactions to report for this date');
      setActionLoading(false);
      return;
    }

    // Check if report already exists
    if (todayReport) {
      toast.info(`A report for ${formatDate(reportDate)} already exists with status: ${todayReport.status}`);
      setActionLoading(false);
      return;
    }

    // Send ONLY the date - backend will calculate everything
    const reportDataToSubmit = {
      date: reportDate
    };

    console.log('Submitting report for date:', reportDataToSubmit);

    const response = await api.post('/reports/', reportDataToSubmit);
    
    console.log('Submit response:', response.data);
    toast.success('Report submitted successfully for approval');
    fetchSubmittedReports();
    setActionLoading(false);
  } catch (error) {
    console.error('Error submitting report:', error);
    
    if (error.response) {
      console.error('Server error details:', error.response.data);
      
      if (error.response.status === 500) {
        // Check if it's the TypeError about fields
        if (error.response.data?.includes('TypeError')) {
          toast.error('Backend serializer error. Please check your DailyReportSerializer configuration.');
        } else {
          toast.error(`Server error: ${error.response.status}`);
        }
      } else if (error.response.status === 403) {
        toast.error('You do not have permission to submit reports');
      } else {
        const errorData = error.response.data;
        if (errorData.date && errorData.date[0]?.includes('already exists')) {
          toast.info(`A report for ${formatDate(reportDate)} has already been submitted`);
          fetchSubmittedReports();
        } else {
          toast.error(`Failed to submit: ${JSON.stringify(errorData)}`);
        }
      }
    } else if (error.request) {
      toast.error('No response from server. Check your network.');
    } else {
      toast.error(`Error: ${error.message}`);
    }
    
    setActionLoading(false);
  }
};

  const approveReport = async () => {
    if (!selectedReport) return;
    
    try {
      setActionLoading(true);
      
      await api.post(`/reports/${selectedReport.id}/approve/`, {
        comments: approvalComment
      });
      
      toast.success('Report approved successfully');
      setShowApproveModal(false);
      setSelectedReport(null);
      setApprovalComment('');
      fetchSubmittedReports();
      setActionLoading(false);
    } catch (error) {
      console.error('Error approving report:', error);
      if (error.response?.status === 403) {
        toast.error('Only administrators can approve reports');
      } else {
        toast.error('Failed to approve report');
      }
      setActionLoading(false);
    }
  };

  const rejectReport = async () => {
    if (!selectedReport) return;
    
    try {
      setActionLoading(true);
      
      await api.post(`/reports/${selectedReport.id}/reject/`, {
        comments: approvalComment
      });
      
      toast.success('Report rejected');
      setShowApproveModal(false);
      setSelectedReport(null);
      setApprovalComment('');
      fetchSubmittedReports();
      setActionLoading(false);
    } catch (error) {
      console.error('Error rejecting report:', error);
      if (error.response?.status === 403) {
        toast.error('Only administrators can reject reports');
      } else {
        toast.error('Failed to reject report');
      }
      setActionLoading(false);
    }
  };

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

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount || 0);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const getStatusBadge = (status) => {
    const variants = {
      'pending': 'warning',
      'approved': 'success',
      'rejected': 'danger'
    };
    
    return (
      <Badge bg={variants[status?.toLowerCase()] || 'secondary'} pill>
        {status?.toUpperCase() || 'PENDING'}
      </Badge>
    );
  };

  const todayReport = submittedReports.find(r => r.date === reportDate);

  if (loading) {
    return (
      <Container className="text-center py-5" style={{ marginTop: '80px' }}>
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Loading daily report...</p>
      </Container>
    );
  }

  return (
    <Container style={{ marginTop: '80px' }} fluid>
      <h2 className="mb-4">Daily Reports</h2>
      <p className="text-muted mb-4">
        {role === 'admin' ? 'Review and approve daily reports' : 'Submit daily reports for approval'}
      </p>

      {error && (
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>
            <i className="fa-solid fa-circle-exclamation me-2"></i>
            Error
          </Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button variant="outline-danger" onClick={fetchDailyReport}>
              <i className="fa-solid fa-rotate-right me-2"></i>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {permissionError && (
        <Alert variant="warning" className="mb-4">
          <Alert.Heading>
            <i className="fa-solid fa-lock me-2"></i>
            Permission Denied
          </Alert.Heading>
          <p>You don't have permission to view submitted reports. Please contact an administrator.</p>
        </Alert>
      )}

      {/* Date Selector and Actions */}
      <Row className="mb-4">
        <Col md={8}>
          <Form.Group>
            <Form.Label>Select Date</Form.Label>
            <div className="d-flex">
              <Form.Control
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="me-2"
                style={{ maxWidth: '300px' }}
                max={new Date().toISOString().split('T')[0]}
              />
              <Button variant="primary" onClick={fetchDailyReport} disabled={loading}>
                {loading ? <Spinner size="sm" animation="border" /> : <i className="fa-solid fa-sync-alt"></i>}
              </Button>
            </div>
          </Form.Group>
        </Col>
      </Row>

      {/* Single Line Summary Card */}
      <Card className="shadow-sm mb-4 border-primary">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={2}>
              <h5 className="mb-0">{formatDate(reportDate)}</h5>
            </Col>
            <Col md={2} className="text-success">
              <small>Sales</small>
              <br />
              <strong>₹{formatCurrency(summary.totalSales)}</strong>
              <br />
              <small className="text-muted">{summary.salesCount} bills</small>
            </Col>
            <Col md={2} className="text-danger">
              <small>Purchases</small>
              <br />
              <strong>₹{formatCurrency(summary.totalPurchases)}</strong>
              <br />
              <small className="text-muted">{summary.purchasesCount} purchases</small>
            </Col>
            <Col md={2} className="text-warning">
              <small>Expenses</small>
              <br />
              <strong>₹{formatCurrency(summary.totalExpenses)}</strong>
              <br />
              <small className="text-muted">{summary.expensesCount} expenses</small>
            </Col>
            <Col md={2}>
              <small>Net Profit</small>
              <br />
              <strong className={summary.profit >= 0 ? 'text-success' : 'text-danger'}>
                ₹{formatCurrency(summary.profit)}
              </strong>
            </Col>
            <Col md={2} className="text-center">
              {todayReport ? (
                <div>
                  {getStatusBadge(todayReport.status)}
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      setSelectedReport(todayReport);
                      setShowReportDetails(true);
                    }}
                    className="ms-2"
                  >
                    <i className="fa-solid fa-eye"></i>
                  </Button>
                </div>
              ) : (
                <Button
                  variant="success"
                  size="sm"
                  onClick={submitReport}
                  disabled={actionLoading || (summary.salesCount === 0 && summary.purchasesCount === 0 && summary.expensesCount === 0)}
                >
                  {actionLoading ? <Spinner size="sm" animation="border" /> : 'Submit Report'}
                </Button>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* All Reports Table - Only visible if user has permission */}
      {!permissionError && (
        <Card className="shadow-sm">
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0">
              <i className="fa-solid fa-history me-2"></i>
              Report History
            </h5>
          </Card.Header>
          <Card.Body>
            <div style={{ overflowX: 'auto' }}>
              <Table striped bordered hover responsive className="align-middle">
                <thead className="bg-light">
                  <tr>
                    <th>Date</th>
                    <th className="text-end">Sales (₹)</th>
                    <th className="text-end">Purchases (₹)</th>
                    <th className="text-end">Expenses (₹)</th>
                    <th className="text-end">Net Profit (₹)</th>
                    <th>Status</th>
                    <th>Submitted By</th>
                    <th>Submitted At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submittedReports.length > 0 ? (
                    submittedReports.map((report) => (
                      <tr key={report.id}>
                        <td>
                          <strong>{formatDate(report.date)}</strong>
                        </td>
                        <td className="text-end text-success">
                          ₹{formatCurrency(report.total_sales)}
                        </td>
                        <td className="text-end text-danger">
                          ₹{formatCurrency(report.total_purchases)}
                        </td>
                        <td className="text-end text-warning">
                          ₹{formatCurrency(report.total_expenses)}
                        </td>
                        <td className="text-end">
                          <span className={report.net_profit >= 0 ? 'text-success' : 'text-danger'}>
                            ₹{formatCurrency(report.net_profit)}
                          </span>
                        </td>
                        <td>{getStatusBadge(report.status)}</td>
                        <td>{report.submitted_by_username || 'Unknown'}</td>
                        <td>
                          <small>{formatDateTime(report.submitted_at)}</small>
                        </td>
                        <td>
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => {
                              setSelectedReport(report);
                              setShowReportDetails(true);
                            }}
                            className="me-1"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </Button>
                          {role === 'admin' && report.status === 'pending' && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => {
                                setSelectedReport(report);
                                setShowApproveModal(true);
                              }}
                            >
                              <i className="fa-solid fa-check-circle"></i>
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center py-4">
                        <i className="fa-solid fa-file-lines fa-2x text-muted mb-2"></i>
                        <p className="text-muted">No reports submitted yet</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}
      
      {/* Rest of the modals remain the same... */}
      {/* View Report Details Modal */}
      <Modal show={showReportDetails} onHide={() => setShowReportDetails(false)} size="lg" centered>
        {/* ... modal content remains the same ... */}
      </Modal>

      {/* Approval Modal */}
      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)} centered>
        {/* ... modal content remains the same ... */}
      </Modal>
    </Container>
  );
};

export default DailyReports;