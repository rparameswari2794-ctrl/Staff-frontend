import { useState, useEffect } from 'react';
import { Container, Table, Card, Badge, Form, Row, Col, Alert, Spinner, Button } from 'react-bootstrap';
import api from '../../services/api';

const AdminAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState({
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    total: 0
  });

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both attendance and employees in parallel
      const [attendanceRes, employeesRes] = await Promise.all([
        api.get('/admin/attendance/', { params: { date: selectedDate } }),
        api.get('/admin/employees/')
      ]);
      
      console.log('Attendance data:', attendanceRes.data);
      console.log('Employees data:', employeesRes.data);
      
      // Handle different response structures
      const attendanceData = attendanceRes.data.results || attendanceRes.data || [];
      const employeesData = employeesRes.data.results || employeesRes.data || [];
      
      setEmployees(employeesData);
      
      // Create a map of employee details for quick lookup
      const employeeMap = {};
      employeesData.forEach(emp => {
        // Map by various possible keys
        employeeMap[emp.id] = emp;
        employeeMap[emp.employee_id] = emp;
        if (emp.user && emp.user.id) {
          employeeMap[emp.user.id] = emp;
        }
        if (emp.user && emp.user.username) {
          employeeMap[emp.user.username] = emp;
        }
      });
      
      // Process attendance records with employee details
      const processedAttendance = attendanceData.map(record => {
        // Find employee details
        let employeeDetails = null;
        
        // Try to find by employee ID in record
        if (record.employee) {
          if (typeof record.employee === 'object') {
            employeeDetails = record.employee;
          } else {
            employeeDetails = employeeMap[record.employee];
          }
        } else if (record.employee_id) {
          employeeDetails = employeeMap[record.employee_id];
        } else if (record.user) {
          if (typeof record.user === 'object') {
            employeeDetails = employeeMap[record.user.id] || employeeMap[record.user.username];
          } else {
            employeeDetails = employeeMap[record.user];
          }
        }
        
        // If still not found, try to match by name
        if (!employeeDetails && record.employee_name) {
          employeeDetails = employeesData.find(emp => 
            emp.full_name === record.employee_name ||
            emp.user?.full_name === record.employee_name ||
            emp.name === record.employee_name
          );
        }
        
        // Calculate status
        let status = 'absent';
        
        if (record.check_in_time) {
          const checkInHour = new Date(record.check_in_time).getHours();
          const checkInMinutes = new Date(record.check_in_time).getMinutes();
          const checkInTime = checkInHour * 60 + checkInMinutes;
          
          // 9:30 AM = 570 minutes
          if (checkInTime > 570) { // After 9:30 AM is considered late
            status = 'late';
          } else {
            status = 'present';
          }
          
          // Check if it's a half day (check out before 4 PM)
          if (record.check_out_time) {
            const checkOutHour = new Date(record.check_out_time).getHours();
            if (checkOutHour < 16) { // Before 4 PM
              status = 'half_day';
            }
          }
        }
        
        // Calculate working hours
        let workingHours = null;
        if (record.check_in_time && record.check_out_time) {
          const checkIn = new Date(record.check_in_time);
          const checkOut = new Date(record.check_out_time);
          const diffMs = checkOut - checkIn;
          workingHours = diffMs / (1000 * 60 * 60);
        }
        
        // Get employee ID from various sources
        let employeeId = '-';
        if (employeeDetails) {
          employeeId = employeeDetails.employee_id || 
                      employeeDetails.id || 
                      `EMP${employeeDetails.id}` ||
                      '-';
        } else if (record.employee_id) {
          employeeId = record.employee_id;
        } else if (record.user && record.user.id) {
          employeeId = `EMP${record.user.id}`;
        }
        
        // Get department from various sources
        let department = '-';
        if (employeeDetails) {
          department = employeeDetails.department_name || 
                      employeeDetails.department?.name || 
                      employeeDetails.department ||
                      employeeDetails.position ||
                      '-';
        }
        
        return {
          ...record,
          employee_name: employeeDetails?.full_name || 
                        employeeDetails?.name || 
                        record.employee_name || 
                        'Unknown',
          employee_id: employeeId,
          department: department,
          status,
          working_hours: workingHours
        };
      });
      
      setAttendance(processedAttendance);
      
      // Calculate summary
      const summary = {
        present: processedAttendance.filter(r => r.status === 'present').length,
        absent: processedAttendance.filter(r => r.status === 'absent').length,
        late: processedAttendance.filter(r => r.status === 'late').length,
        halfDay: processedAttendance.filter(r => r.status === 'half_day').length,
        total: processedAttendance.length
      };
      setSummary(summary);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.message || 'Failed to load attendance data');
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return '-';
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

  const getStatusBadge = (status) => {
    const variants = {
      'present': 'success',
      'absent': 'danger',
      'late': 'warning',
      'half_day': 'info'
    };
    
    const labels = {
      'present': 'Present',
      'absent': 'Absent',
      'late': 'Late',
      'half_day': 'Half Day'
    };
    
    return (
      <Badge bg={variants[status] || 'secondary'} pill>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Container className="text-center py-5" style={{ marginTop: '80px' }}>
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Loading attendance records...</p>
      </Container>
    );
  }

  return (
    <Container style={{ marginTop: '80px' }} fluid>
      <h2 className="mb-4">Attendance Management</h2>
      <p className="text-muted mb-4">Admin View - View all attendance records</p>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>
            <i className="fa-solid fa-circle-exclamation me-2"></i>
            Error
          </Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button variant="outline-danger" onClick={fetchData}>
              <i className="fa-solid fa-rotate-right me-2"></i>
              Retry
            </Button>
          </div>
        </Alert>
      )}
      
      <Row className="mb-4">
        <Col md={4}>
          <Form.Group>
            <Form.Label>Select Date</Form.Label>
            <div className="d-flex">
              <Form.Control
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="me-2"
              />
              <Button variant="primary" onClick={fetchData}>
                <i className="fa-solid fa-sync-alt"></i>
              </Button>
            </div>
          </Form.Group>
        </Col>
        <Col md={8} className="text-end">
          <h5 className="text-muted">
            {formatDate(selectedDate)}
          </h5>
        </Col>
      </Row>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={2}>
          <Card bg="success" text="white" className="shadow-sm">
            <Card.Body className="text-center">
              <h6>Present</h6>
              <h3>{summary.present}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card bg="danger" text="white" className="shadow-sm">
            <Card.Body className="text-center">
              <h6>Absent</h6>
              <h3>{summary.absent}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card bg="warning" text="dark" className="shadow-sm">
            <Card.Body className="text-center">
              <h6>Late</h6>
              <h3>{summary.late}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card bg="info" text="white" className="shadow-sm">
            <Card.Body className="text-center">
              <h6>Half Day</h6>
              <h3>{summary.halfDay}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card bg="primary" text="white" className="shadow-sm">
            <Card.Body className="text-center">
              <h6>Total Employees</h6>
              <h3>{summary.total}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="fa-solid fa-calendar-check me-2"></i>
            Attendance Records
          </h5>
          <Badge bg="light" text="dark" pill>
            {attendance.length} records
          </Badge>
        </Card.Header>
        <Card.Body>
          <div style={{ overflowX: 'auto' }}>
            <Table striped bordered hover responsive className="align-middle">
              <thead className="bg-light">
                <tr>
                  <th>#</th>
                  <th>Employee</th>
                  <th>Employee ID</th>
                  <th>Department/Position</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                  <th>Working Hours</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length > 0 ? (
                  attendance.map((record, index) => (
                    <tr key={record.id || index}>
                      <td>
                        <small className="text-muted">{index + 1}</small>
                      </td>
                      <td>
                        <strong>{record.employee_name}</strong>
                      </td>
                      <td>
                        <Badge bg="secondary" pill>
                          {record.employee_id}
                        </Badge>
                      </td>
                      <td>
                        {record.department}
                      </td>
                      <td>
                        {formatDate(record.date)}
                      </td>
                      <td>
                        {record.check_in_time ? (
                          <>
                            <i className="fa-solid fa-clock text-success me-2"></i>
                            {formatTime(record.check_in_time)}
                          </>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {record.check_out_time ? (
                          <>
                            <i className="fa-solid fa-clock text-danger me-2"></i>
                            {formatTime(record.check_out_time)}
                          </>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {getStatusBadge(record.status)}
                      </td>
                      <td>
                        {record.working_hours ? (
                          <strong>
                            {record.working_hours.toFixed(2)} hrs
                          </strong>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center py-5">
                      <i className="fa-solid fa-calendar-xmark fa-3x text-muted mb-3"></i>
                      <h5 className="text-muted">No attendance records found</h5>
                      <p className="text-muted mb-0">
                        No employees have checked in for this date
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminAttendance;