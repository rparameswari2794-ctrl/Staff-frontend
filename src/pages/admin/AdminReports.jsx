import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Alert, Spinner, Modal, Form } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { toast } from 'react-toastify';

const DailyReports = () => {
  const { user, role } = useSelector((state) => state.auth);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvalComment, setApprovalComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/reports/');
      console.log('Reports:', response.data);
      
      // Handle different response structures
      const reportsData = response.data.results || response.data || [];
      setReports(reportsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError(error.response?.data?.message || 'Failed to load reports');
      setLoading(false);
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
      fetchReports();
      setActionLoading(false);
    } catch (error) {
      console.error('Error approving report:', error);
      toast.error('Failed to approve report');
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
      fetchReports();
      setActionLoading(false);
    } catch (error) {
      console.error('Error rejecting report:', error);
      toast.error('Failed to reject report');
      setActionLoading(false);
    }
  };

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

  if (loading) {
    return (
      <Container className="text-center py-5" style={{ marginTop: '80px' }}>
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Loading reports...</p>
      </Container>
    );
  }

  return (
    <Container style={{ marginTop: '80px' }} fluid>
      <h2 className="mb-4">Daily Reports</h2>
      <p className="text-muted mb-4">
        {role === 'admin' 
          ? 'Review and approve reports submitted by managers' 
          : 'View your submitted reports'}
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
            <Button variant="outline-danger" onClick={fetchReports}>
              <i className="fa-solid fa-rotate-right me-2"></i>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {/* Reports Table */}
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">
            <i className="fa-solid fa-file-lines me-2"></i>
            Manager Submitted Reports
          </h5>
        </Card.Header>
        <Card.Body>
          <div style={{ overflowX: 'auto' }}>
            <Table striped bordered hover responsive className="align-middle">
              <thead className="bg-light">
                <tr>
                  <th>Date</th>
                  <th className="text-end">Total Sales (₹)</th>
                  <th className="text-end">Total Purchases (₹)</th>
                  <th className="text-end">Total Expenses (₹)</th>
                  <th className="text-end">Net Profit (₹)</th>
                  <th>Status</th>
                  <th>Submitted By</th>
                  <th>Submitted At</th>
                  {role === 'admin' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {reports.length > 0 ? (
                  reports.map((report) => (
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
                      {role === 'admin' && (
                        <td>
                          {report.status === 'pending' ? (
                            <>
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => {
                                  setSelectedReport(report);
                                  setShowApproveModal(true);
                                }}
                                className="me-1"
                                title="Approve"
                              >
                                <i className="fa-solid fa-check"></i>
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => {
                                  setSelectedReport(report);
                                  setShowApproveModal(true);
                                }}
                                title="Reject"
                              >
                                <i className="fa-solid fa-times"></i>
                              </Button>
                            </>
                          ) : (
                            <Badge bg="secondary" pill>No action needed</Badge>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={role === 'admin' ? 8 : 7} className="text-center py-4">
                      <i className="fa-solid fa-file-lines fa-2x text-muted mb-2"></i>
                      <p className="text-muted">No reports found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Approval/Rejection Modal */}
      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)} centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="fa-solid fa-check-circle me-2"></i>
            Review Report
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReport && (
            <>
              <Card className="mb-3">
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <strong>Date:</strong> {formatDate(selectedReport.date)}
                    </Col>
                    <Col md={6}>
                      <strong>Current Status:</strong> {getStatusBadge(selectedReport.status)}
                    </Col>
                  </Row>
                  <hr />
                  <Row>
                    <Col md={6}>
                      <small className="text-muted">Total Sales</small>
                      <h6 className="text-success">₹{formatCurrency(selectedReport.total_sales)}</h6>
                    </Col>
                    <Col md={6}>
                      <small className="text-muted">Total Purchases</small>
                      <h6 className="text-danger">₹{formatCurrency(selectedReport.total_purchases)}</h6>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <small className="text-muted">Total Expenses</small>
                      <h6 className="text-warning">₹{formatCurrency(selectedReport.total_expenses)}</h6>
                    </Col>
                    <Col md={6}>
                      <small className="text-muted">Net Profit</small>
                      <h6 className={selectedReport.net_profit >= 0 ? 'text-success' : 'text-danger'}>
                        ₹{formatCurrency(selectedReport.net_profit)}
                      </h6>
                    </Col>
                  </Row>
                  {selectedReport.submitted_by_username && (
                    <div className="mt-2">
                      <small className="text-muted">
                        Submitted by: {selectedReport.submitted_by_username} on {formatDateTime(selectedReport.submitted_at)}
                      </small>
                    </div>
                  )}
                </Card.Body>
              </Card>

              <Form.Group className="mb-3">
                <Form.Label>Comments (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder="Add comments for approval or rejection..."
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApproveModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={rejectReport}
            disabled={actionLoading}
          >
            {actionLoading ? <Spinner size="sm" animation="border" /> : 'Reject'}
          </Button>
          <Button 
            variant="success" 
            onClick={approveReport}
            disabled={actionLoading}
          >
            {actionLoading ? <Spinner size="sm" animation="border" /> : 'Approve'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default DailyReports;