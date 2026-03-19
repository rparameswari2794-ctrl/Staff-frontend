import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Form, InputGroup, Badge, Button } from 'react-bootstrap';
import api from '../../services/api';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchEmployees();
  }, [refreshKey]); // Re-fetch when refreshKey changes

  const fetchEmployees = async () => {
  try {
    setLoading(true);
    // Add timestamp to bypass cache
    const response = await api.get('/employees/?_=' + new Date().getTime());
    
    console.log('RAW API RESPONSE:', response.data);
    
    // Log detailed user info for each employee
    response.data.forEach(emp => {
      console.log(`Employee ${emp.id}:`, {
        employee_id: emp.employee_id,
        user: emp.user,
        user_id: emp.user?.id,
        username: emp.user?.username,
        is_active: emp.user?.is_active,
        user_object: JSON.stringify(emp.user, null, 2)
      });
    });
    
    // Filter out admin
    const filteredEmployees = response.data.filter(emp => 
      emp.user && emp.user.username !== 'admin'
    );
    
    setEmployees(filteredEmployees);
    setLoading(false);
  } catch (error) {
    console.error('Error fetching employees:', error);
    setLoading(false);
  }
};

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1); // Trigger re-fetch
  };

  const getEmployeeName = (emp) => {
    const firstName = emp.user?.first_name || '';
    const lastName = emp.user?.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown';
  };

  const getEmployeeEmail = (emp) => {
    return emp.user?.email || '-';
  };

  const getEmployeeRole = (emp) => {
    if (emp.position) return emp.position;
    
    // Check user role if available
    if (emp.user?.role === 'manager') return 'Manager';
    if (emp.user?.role === 'staff') return 'Staff';
    
    return 'Staff';
  };

  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.user?.first_name || ''} ${emp.user?.last_name || ''}`.toLowerCase();
    const email = emp.user?.email?.toLowerCase() || '';
    const empId = emp.employee_id?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    return fullName.includes(search) || email.includes(search) || empId.includes(search);
  });

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
    <Container style={{ marginTop: '80px' }}>
      <div className="d-flex justify-content-between align-items-center">
        <h2>Employees</h2>
        <Button variant="outline-primary" onClick={handleRefresh}>
          <i className="fa-solid fa-rotate-right me-2"></i>
          Refresh Data
        </Button>
      </div>
      
      <Row className="mt-4 mb-4">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>
              <i className="fa-solid fa-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={6} className="text-end">
          <h5>Total Employees: {filteredEmployees.length}</h5>
        </Col>
      </Row>

      <Card>
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Employee List</h5>
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
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => {
                const isActive = true;
                
                return (
                  <tr key={emp.id}>
                    <td>{emp.id}</td>
                    <td>
                      <Badge bg="secondary">
                        {emp.employee_id || `EMP${String(emp.id).padStart(6, '0')}`}
                      </Badge>
                    </td>
                    <td>{getEmployeeName(emp)}</td>
                    <td>{getEmployeeEmail(emp)}</td>
                    <td>{emp.phone || '-'}</td>
                    <td>
                      <Badge bg="info">
                        {getEmployeeRole(emp)}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg="success">
            Active
          </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Employees;