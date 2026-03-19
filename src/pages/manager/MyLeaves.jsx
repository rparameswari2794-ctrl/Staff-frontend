import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Form, Alert } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import api from '../../services/api';

const MyLeaves = () => {
  const { user } = useSelector((state) => state.auth);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newLeave, setNewLeave] = useState({
    leave_type: 'annual',  // Changed from 'sick' to 'annual' as default
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  });

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  useEffect(() => {
    if (leaves.length > 0) {
      calculateStats();
    }
  }, [leaves]);

  const fetchMyLeaves = async () => {
    try {
      setLoading(true);
      const response = await api.get('/leaves/', {
        params: {
          employee: user?.id
        }
      });
      console.log('API Response:', response.data);
      
      setLeaves(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching leaves:', error);
      setError('Failed to load leave data');
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const stats = {
      total: leaves.length,
      approved: 0,
      pending: 0,
      rejected: 0
    };

    leaves.forEach(leave => {
      if (leave.status === 'approved') stats.approved++;
      else if (leave.status === 'pending') stats.pending++;
      else if (leave.status === 'rejected') stats.rejected++;
    });

    setStats(stats);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewLeave(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyLeave = async () => {
    try {
      setError('');
      
      // Validate dates
      if (!newLeave.start_date || !newLeave.end_date) {
        setError('Please select both from and to dates');
        return;
      }

      if (!newLeave.reason.trim()) {
        setError('Please provide a reason for leave');
        return;
      }

      // Validate that start_date is not in the past
      const today = new Date().toISOString().split('T')[0];
      if (newLeave.start_date < today) {
        setError('From date cannot be in the past');
        return;
      }

      // Validate that end_date is not before start_date
      if (newLeave.end_date < newLeave.start_date) {
        setError('To date cannot be before from date');
        return;
      }

      // Use correct field names that match the backend model
      const leaveData = {
        leave_type: newLeave.leave_type,
        start_date: newLeave.start_date,
        end_date: newLeave.end_date,
        reason: newLeave.reason,
        employee: user?.id,
        status: 'pending'
      };
      
      console.log('Submitting leave data:', leaveData);
      
      const response = await api.post('/leaves/', leaveData);
      console.log('Submit response:', response.data);
      
      // Add the new leave to the list
      setLeaves([response.data, ...leaves]);
      
      // Show success message
      setSuccess('Leave application submitted successfully!');
      
      // Close modal and reset form
      setShowApplyModal(false);
      setNewLeave({
        leave_type: 'annual',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        reason: ''
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('Full error:', error);
      
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
        
        // Show the actual error message from server
        const serverError = error.response.data;
        let errorMessage = 'Failed to apply for leave.';
        
        if (typeof serverError === 'string') {
          errorMessage = serverError;
        } else if (serverError.message) {
          errorMessage = serverError.message;
        } else if (serverError.error) {
          errorMessage = serverError.error;
        } else if (serverError.detail) {
          errorMessage = serverError.detail;
        } else if (serverError.non_field_errors) {
          errorMessage = serverError.non_field_errors.join(', ');
        } else {
          // Try to get field-specific errors
          const fieldErrors = [];
          for (const [field, errors] of Object.entries(serverError)) {
            fieldErrors.push(`${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`);
          }
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join('; ');
          } else {
            errorMessage = `Server error: ${JSON.stringify(serverError)}`;
          }
        }
        
        setError(errorMessage);
      } else if (error.request) {
        setError('No response from server. Check if backend is running.');
      } else {
        setError(`Error: ${error.message}`);
      }
    }
  };

  const getLeaveTypeBadge = (type) => {
    const types = {
      annual: { bg: 'success', text: 'Annual Leave' },
      sick: { bg: 'warning', text: 'Sick Leave' },
      personal: { bg: 'info', text: 'Personal Leave' },
      unpaid: { bg: 'secondary', text: 'Unpaid Leave' }
    };
    const t = types[type?.toLowerCase()] || { bg: 'secondary', text: type || 'Leave' };
    return <Badge bg={t.bg}>{t.text}</Badge>;
  };

  const getStatusBadge = (status) => {
    const statuses = {
      approved: { bg: 'success', text: 'Approved' },
      pending: { bg: 'warning', text: 'Pending' },
      rejected: { bg: 'danger', text: 'Rejected' }
    };
    const s = statuses[status?.toLowerCase()] || { bg: 'secondary', text: status || 'Unknown' };
    return <Badge bg={s.bg}>{s.text}</Badge>;
  };

  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 0;
      }
      
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      return diffDays;
    } catch (error) {
      console.error('Error calculating days:', error);
      return 0;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return '-';
    }
  };

  // Calculate days for the new leave application (preview)
  const previewDays = calculateDays(newLeave.start_date, newLeave.end_date);

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
    <Container>
      {/* Success/Error Messages */}
      {success && (
        <Alert variant="success" onClose={() => setSuccess('')} dismissible>
          <i className="fa-solid fa-check-circle me-2"></i>
          {success}
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          <i className="fa-solid fa-exclamation-circle me-2"></i>
          {error}
        </Alert>
      )}

      <Row className="mb-4">
        <Col>
          <h2>
            <i className="fa-solid fa-umbrella-beach me-2 text-warning"></i>
            My Leaves
          </h2>
          <p className="text-muted">View your leave history and apply for new leaves</p>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={() => setShowApplyModal(true)}>
            <i className="fa-solid fa-plus me-2"></i>Apply for Leave
          </Button>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card bg="primary" text="white" className="shadow-sm">
            <Card.Body className="text-center">
              <h6>Total Leaves</h6>
              <h3>{stats.total}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card bg="success" text="white" className="shadow-sm">
            <Card.Body className="text-center">
              <h6>Approved</h6>
              <h3>{stats.approved}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card bg="warning" text="dark" className="shadow-sm">
            <Card.Body className="text-center">
              <h6>Pending</h6>
              <h3>{stats.pending}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card bg="danger" text="white" className="shadow-sm">
            <Card.Body className="text-center">
              <h6>Rejected</h6>
              <h3>{stats.rejected}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Leaves Table - No Action Column */}
      <Card className="shadow-sm">
        <Card.Header className="bg-warning">
          <h5 className="mb-0">Leave History</h5>
        </Card.Header>
        <Card.Body>
          <div style={{ overflowX: 'auto' }}>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>From Date</th>
                  <th>To Date</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Applied On</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map(leave => {
                  const days = calculateDays(leave.start_date, leave.end_date);
                  return (
                    <tr key={leave.id}>
                      <td>{getLeaveTypeBadge(leave.leave_type)}</td>
                      <td>{formatDate(leave.start_date)}</td>
                      <td>{formatDate(leave.end_date)}</td>
                      <td className="text-center">
                        <Badge bg="secondary">
                          {days} {days === 1 ? 'day' : 'days'}
                        </Badge>
                      </td>
                      <td>{leave.reason || '-'}</td>
                      <td>{getStatusBadge(leave.status)}</td>
                      <td>{formatDate(leave.created_at)}</td>
                    </tr>
                  );
                })}
                {leaves.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      <i className="fa-solid fa-calendar-xmark fa-2x mb-2"></i>
                      <p>No leave records found</p>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => setShowApplyModal(true)}
                      >
                        Apply for your first leave
                      </Button>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Apply Leave Modal */}
      <Modal show={showApplyModal} onHide={() => setShowApplyModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fa-solid fa-pen me-2 text-primary"></i>
            Apply for Leave
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Leave Type</Form.Label>
              <Form.Select
                name="leave_type"
                value={newLeave.leave_type}
                onChange={handleInputChange}
              >
                <option value="annual">Annual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="personal">Personal Leave</option>
                <option value="unpaid">Unpaid Leave</option>
              </Form.Select>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>From Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="start_date"
                    value={newLeave.start_date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>To Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="end_date"
                    value={newLeave.end_date}
                    onChange={handleInputChange}
                    min={newLeave.start_date}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Days Preview */}
            <div className="bg-light p-2 rounded mb-3 text-center">
              <strong>Total Days: </strong>
              <Badge bg="info" className="ms-2 p-2">
                {previewDays} {previewDays === 1 ? 'day' : 'days'}
              </Badge>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Reason</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="reason"
                value={newLeave.reason}
                onChange={handleInputChange}
                placeholder="Please provide reason for leave..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApplyModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleApplyLeave}
            disabled={!newLeave.reason.trim() || !newLeave.start_date || !newLeave.end_date}
          >
            <i className="fa-solid fa-paper-plane me-2"></i>
            Submit Application
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MyLeaves;