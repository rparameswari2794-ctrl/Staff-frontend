import { useState, useEffect } from 'react';
import {
  Container, Table, Button, Card, Row, Col,
  Modal, Form, Alert, Spinner, Badge
} from 'react-bootstrap';
import { useSelector } from 'react-redux';
import api from '../../services/api';

const Departments = () => {
  const { user } = useSelector((state) => state.auth);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentDept, setCurrentDept] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/departments/');
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ name: '', description: '' });
    setCurrentDept(null);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (dept) => {
    setModalMode('edit');
    setFormData({
      name: dept.name,
      description: dept.description || ''
    });
    setCurrentDept(dept);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Department name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (modalMode === 'add') {
        await api.post('/departments/', formData);
        setSuccess('Department created successfully!');
      } else {
        await api.put(`/departments/${currentDept.id}/`, formData);
        setSuccess('Department updated successfully!');
      }
      
      setShowModal(false);
      fetchDepartments();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving department:', error);
      setError(error.response?.data?.error || 'Failed to save department');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department? This may affect employees in this department.')) {
      return;
    }

    setLoading(true);
    try {
      await api.delete(`/departments/${id}/`);
      setSuccess('Department deleted successfully!');
      fetchDepartments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting department:', error);
      setError(error.response?.data?.error || 'Failed to delete department');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="mt-4">
      {/* Header */}
      <Row className="mb-4 align-items-center">
        <Col>
          <h2>
            <i className="fa-solid fa-building me-2"></i>
            Departments Management
          </h2>
          <p className="text-muted">
            Manage departments, view employee counts, and organize your workforce
          </p>
        </Col>
        <Col className="text-end">
          <Button variant="success" onClick={openAddModal}>
            <i className="fa-solid fa-plus me-2"></i>
            Add New Department
          </Button>
        </Col>
      </Row>

      {/* Success/Error Messages */}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          <i className="fa-solid fa-check-circle me-2"></i>
          {success}
        </Alert>
      )}
      
      {error && !showModal && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          <i className="fa-solid fa-exclamation-circle me-2"></i>
          {error}
        </Alert>
      )}

      {/* Departments Table */}
      <Card>
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">
            <i className="fa-solid fa-list me-2"></i>
            Departments List
          </h5>
        </Card.Header>
        <Card.Body>
          {loading && departments.length === 0 ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading departments...</p>
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Department Name</th>
                  <th>Description</th>
                  <th>Employees</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept, index) => (
                  <tr key={dept.id}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{dept.name}</strong>
                    </td>
                    <td>{dept.description || '-'}</td>
                    <td>
                      <Badge bg="info" pill>
                        {dept.employee_count || 0} Employees
                      </Badge>
                    </td>
                    <td>
                      {new Date(dept.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => openEditModal(dept)}
                        className="me-2"
                      >
                        <i className="fa-solid fa-edit"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(dept.id)}
                      >
                        <i className="fa-solid fa-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
                {departments.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <i className="fa-solid fa-building fa-3x text-muted mb-3"></i>
                      <p>No departments found. Click "Add New Department" to create one.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Department Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'add' ? (
              <>
                <i className="fa-solid fa-plus-circle me-2 text-success"></i>
                Add New Department
              </>
            ) : (
              <>
                <i className="fa-solid fa-edit me-2 text-primary"></i>
                Edit Department
              </>
            )}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && (
              <Alert variant="danger" className="mb-3">
                <i className="fa-solid fa-exclamation-circle me-2"></i>
                {error}
              </Alert>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label>
                <i className="fa-solid fa-tag me-2"></i>
                Department Name <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Human Resources, IT, Sales"
                required
              />
              <Form.Text className="text-muted">
                Enter a unique name for the department
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                <i className="fa-solid fa-align-left me-2"></i>
                Description
              </Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter department description, responsibilities, etc."
                rows={3}
              />
            </Form.Group>

            {/* Preview Card */}
            {(formData.name || formData.description) && (
              <Card className="bg-light mt-3">
                <Card.Body>
                  <Card.Title className="h6">Preview</Card.Title>
                  <Row>
                    <Col md={3}>
                      <strong>Name:</strong>
                    </Col>
                    <Col md={9}>
                      {formData.name || <span className="text-muted">Not set</span>}
                    </Col>
                  </Row>
                  <Row className="mt-2">
                    <Col md={3}>
                      <strong>Description:</strong>
                    </Col>
                    <Col md={9}>
                      {formData.description || <span className="text-muted">Not set</span>}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              <i className="fa-solid fa-times me-2"></i>
              Cancel
            </Button>
            <Button 
              variant={modalMode === 'add' ? 'success' : 'primary'} 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Saving...
                </>
              ) : (
                <>
                  <i className={`fa-solid ${modalMode === 'add' ? 'fa-plus' : 'fa-save'} me-2`}></i>
                  {modalMode === 'add' ? 'Create Department' : 'Update Department'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Quick Stats Card */}
      <Row className="mt-4">
        <Col md={4}>
          <Card bg="light" className="text-center">
            <Card.Body>
              <i className="fa-solid fa-building fa-2x text-primary mb-2"></i>
              <h3>{departments.length}</h3>
              <Card.Title>Total Departments</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card bg="light" className="text-center">
            <Card.Body>
              <i className="fa-solid fa-users fa-2x text-success mb-2"></i>
              <h3>
                {departments.reduce((sum, dept) => sum + (dept.employee_count || 0), 0)}
              </h3>
              <Card.Title>Total Employees</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card bg="light" className="text-center">
            <Card.Body>
              <i className="fa-solid fa-calendar fa-2x text-info mb-2"></i>
              <h3>
                {new Date().toLocaleDateString('en-IN', { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </h3>
              <Card.Title>Current Date</Card.Title>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Departments;