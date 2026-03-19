import { useState, useEffect } from 'react';
import { Container, Table, Card, Badge, Button, Form, Row, Col } from 'react-bootstrap';
import api from '../../services/api';

const AdminLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const fetchLeaves = async () => {
    try {
      const response = await api.get('/admin/leaves/', {
        params: statusFilter !== 'all' ? { status: statusFilter } : {}
      });
      setLeaves(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching leaves:', error);
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/admin/leaves/${id}/approve/`);
      fetchLeaves();
    } catch (error) {
      console.error('Error approving leave:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/admin/leaves/${id}/reject/`);
      fetchLeaves();
    } catch (error) {
      console.error('Error rejecting leave:', error);
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
      <h2>Leave Management</h2>
      <p className="text-muted">Admin View - Approve or reject leave requests</p>
      
      <Row className="mb-3">
        <Col md={4}>
          <Form.Group>
            <Form.Label>Filter by Status</Form.Label>
            <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Leaves</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Card>
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Leave Requests</h5>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map(leave => (
                <tr key={leave.id}>
                  <td>{leave.employee_name}</td>
                  <td>{leave.leave_type}</td>
                  <td>{new Date(leave.start_date).toLocaleDateString()}</td>
                  <td>{new Date(leave.end_date).toLocaleDateString()}</td>
                  <td>{leave.leave_days}</td>
                  <td>{leave.reason}</td>
                  <td>
                    <Badge bg={
                      leave.status === 'approved' ? 'success' :
                      leave.status === 'pending' ? 'warning' : 'danger'
                    }>
                      {leave.status}
                    </Badge>
                  </td>
                  <td>
                    {leave.status === 'pending' && (
                      <>
                        <Button size="sm" variant="success" onClick={() => handleApprove(leave.id)} className="me-2">
                          <i className="fa-solid fa-check"></i>
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleReject(leave.id)}>
                          <i className="fa-solid fa-times"></i>
                        </Button>
                      </>
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

export default AdminLeaves;