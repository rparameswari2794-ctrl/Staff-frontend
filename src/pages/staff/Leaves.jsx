import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Container, Table, Button, Card, Form, Modal, Badge } from 'react-bootstrap';
import api from '../../services/api';

const StaffLeaves = () => {
  const { user } = useSelector((state) => state.auth);
  const [leaves, setLeaves] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: ''
  });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const response = await api.get('/leaves/');
      setLeaves(response.data);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  console.log('Submitting data:', formData);
  
  try {
    const response = await api.post('/leaves/', formData);
    console.log('Success:', response.data);
    setShowModal(false);
    setFormData({ leave_type: 'annual', start_date: '', end_date: '', reason: '' });
    fetchLeaves();
  } catch (error) {
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    alert(JSON.stringify(error.response?.data, null, 2));
  }
};

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
      cancelled: 'secondary'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center">
        <h2>My Leaves</h2>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          Apply for Leave
        </Button>
      </div>

      <Card className="mt-4">
        <Card.Body>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Applied On</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => (
                <tr key={leave.id}>
                  <td>{leave.leave_type}</td>
                  <td>{leave.start_date}</td>
                  <td>{leave.end_date}</td>
                  <td>{leave.leave_days}</td>
                  <td>{leave.reason}</td>
                  <td>{getStatusBadge(leave.status)}</td>
                  <td>{new Date(leave.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {leaves.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center">No leave records found</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Apply Leave Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Apply for Leave</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Leave Type</Form.Label>
              <Form.Select 
                value={formData.leave_type}
                onChange={(e) => setFormData({...formData, leave_type: e.target.value})}
                required
              >
                <option value="annual">Annual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="personal">Personal Leave</option>
                <option value="unpaid">Unpaid Leave</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>End Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Reason</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Submit
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default StaffLeaves;