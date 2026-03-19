import { useState, useEffect } from 'react';
import { Container, Table, Card, Badge, Button, Form, InputGroup, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const AdminEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/admin/employees/');
      setEmployees(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <div className="spinner-border text-primary" role="status" />
      </Container>
    );
  }

  return (
    <Container style={{ marginTop: '80px' }}>
      <h2>Employee Management</h2>
      <p className="text-muted">Admin View - Manage all employees</p>
      
      <InputGroup className="mb-3">
        <InputGroup.Text>
          <i className="fa-solid fa-search"></i>
        </InputGroup.Text>
        <Form.Control
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </InputGroup>

      <Card>
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">All Employees ({filteredEmployees.length})</h5>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Department</th>
                <th>Position</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => (
                <tr key={emp.id}>
                  <td>{emp.id}</td>
                  <td><Badge bg="secondary">{emp.employee_id}</Badge></td>
                  <td>{emp.user?.first_name} {emp.user?.last_name}</td>
                  <td>{emp.user?.email}</td>
                  <td>{emp.phone}</td>
                  <td>{emp.department?.name || '-'}</td>
                  <td>{emp.position}</td>
                  <td><Badge bg="info">{emp.role}</Badge></td>
                  <td>
                    <Badge bg={emp.employment_status === 'active' ? 'success' : 'danger'}>
                      {emp.employment_status}
                    </Badge>
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

export default AdminEmployees;