import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Container, Table, Card, Badge, Alert, Button, Row, Col } from 'react-bootstrap';
import api from '../../services/api';

const ManagerAttendance = () => {
    const { user } = useSelector((state) => state.auth);
    const [attendance, setAttendance] = useState([]);
    const [myAttendance, setMyAttendance] = useState([]);
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentUserEmployeeId, setCurrentUserEmployeeId] = useState(null);
    const [employeeMap, setEmployeeMap] = useState({});

    // Fetch all employees first to get correct names
    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await api.get('/employees/');
            const employees = response.data;
            
            console.log('All employees:', employees);
            
            // Create a map of employee ID to employee details
            const empMap = {};
            employees.forEach(emp => {
                // Store by employee ID
                empMap[emp.id] = emp;
                // Also store by user ID if available
                if (emp.user && emp.user.id) {
                    empMap[emp.user.id] = emp;
                }
            });
            
            setEmployeeMap(empMap);
            
            // Find the current user's employee record
            const currentEmployee = employees.find(emp => emp.user?.id === user?.id);
            if (currentEmployee) {
                console.log('Current employee:', currentEmployee);
                setCurrentUserEmployeeId(currentEmployee.id);
            }
            
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    useEffect(() => {
        if (Object.keys(employeeMap).length > 0 && currentUserEmployeeId) {
            fetchAttendance();
        }
    }, [employeeMap, currentUserEmployeeId]);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const response = await api.get('/attendance/');

            console.log('Raw attendance data:', response.data);

            // Sort by date (newest first)
            const sortedAttendance = response.data.sort((a, b) =>
                new Date(b.date) - new Date(a.date)
            );

            setAttendance(sortedAttendance);
            
            // Filter manager's own attendance using the fetched employee ID
            const myRecords = sortedAttendance.filter(record => record.employee === currentUserEmployeeId);
            setMyAttendance(myRecords);
            
            // Check today's attendance for manager
            const todayStr = new Date().toISOString().split('T')[0];
            const today = myRecords.find(a => a.date?.startsWith(todayStr));
            setTodayAttendance(today || null);
            
            setLoading(false);
        } catch (error) {
            console.error('Error fetching attendance:', error);
            setError('Failed to load attendance data');
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        try {
            setLoading(true);
            await api.post('/attendance/check_in/', { employee: currentUserEmployeeId });
            await fetchAttendance();
        } catch (error) {
            setError('Failed to check in');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckOut = async () => {
        if (!todayAttendance) return;
        try {
            setLoading(true);
            await api.post(`/attendance/${todayAttendance.id}/check_out/`);
            await fetchAttendance();
        } catch (error) {
            setError('Failed to check out');
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (datetime) => {
        if (!datetime) return '-';
        try {
            const date = new Date(datetime);
            return date.toLocaleString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
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
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const calculateWorkingHours = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return '-';
        const hours = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60);
        return hours.toFixed(2);
    };

    const getEmployeeDisplay = (employeeId) => {
    const emp = employeeMap[employeeId];
    
    if (emp) {
        const firstName = emp.user?.first_name || emp.first_name || '';
        const lastName = emp.user?.last_name || emp.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        // Use employee_id from database if available, otherwise generate one
        const empId = emp.employee_id || `EMP${String(employeeId).padStart(6, '0')}`;
        
        // Return the formatted name exactly as it should appear
        return fullName ? `${empId} - ${fullName}` : empId;
    }
    
    // If no employee found in map, just return the ID
    return `Employee #${employeeId}`;
};

    if (loading && attendance.length === 0) {
        return (
            <Container className="mt-4 text-center">
                <div className="spinner-border text-primary" role="status" />
            </Container>
        );
    }

    return (
        <Container style={{ marginTop: '80px' }}>
            <h2>My Attendance</h2>

            {/* Today's Status */}
            <Row className="mt-4">
                <Col md={6}>
                    <Card>
                        <Card.Header>Today's Attendance</Card.Header>
                        <Card.Body>
                            {todayAttendance ? (
                                <>
                                    <p><strong>Date:</strong> {formatDate(todayAttendance.date)}</p>
                                    <p><strong>Check In:</strong> {formatDateTime(todayAttendance.check_in_time)}</p>
                                    {todayAttendance.check_out_time ? (
                                        <>
                                            <p><strong>Check Out:</strong> {formatDateTime(todayAttendance.check_out_time)}</p>
                                            <p><strong>Working Hours:</strong> {
                                                todayAttendance.working_hours ||
                                                calculateWorkingHours(todayAttendance.check_in_time, todayAttendance.check_out_time)
                                            } hours</p>
                                            <Badge bg="success">Completed</Badge>
                                        </>
                                    ) : (
                                        <>
                                            <Badge bg="warning">Checked In</Badge>
                                            <Button
                                                variant="danger"
                                                onClick={handleCheckOut}
                                                disabled={loading}
                                                className="mt-3 ms-2"
                                            >
                                                {loading ? 'Processing...' : 'Check Out'}
                                            </Button>
                                        </>
                                    )}
                                </>
                            ) : (
                                <>
                                    <p>Not checked in today</p>
                                    <Button
                                        variant="success"
                                        onClick={handleCheckIn}
                                        disabled={loading}
                                    >
                                        {loading ? 'Processing...' : 'Check In'}
                                    </Button>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Attendance History */}
            <Row className="mt-4">
                <Col>
                    <Card>
                        <Card.Header>Attendance History</Card.Header>
                        <Card.Body>
                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Check In</th>
                                        <th>Check Out</th>
                                        <th>Working Hours</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myAttendance.map((record) => (
                                        <tr key={record.id}>
                                            <td>{formatDate(record.date)}</td>
                                            <td>{formatDateTime(record.check_in_time)}</td>
                                            <td>{formatDateTime(record.check_out_time)}</td>
                                            <td>
                                                {record.working_hours ||
                                                    calculateWorkingHours(record.check_in_time, record.check_out_time)}
                                            </td>
                                            <td>
                                                {record.check_out_time ? (
                                                    <Badge bg="success">Present</Badge>
                                                ) : record.check_in_time ? (
                                                    <Badge bg="warning">Partial</Badge>
                                                ) : (
                                                    <Badge bg="secondary">Absent</Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {myAttendance.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="text-center">No attendance records found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            
            <h2>Attendance Records</h2>
            <p className="text-muted">Manager View - All Employees Attendance</p>

            {error && <Alert variant="danger">{error}</Alert>}

            {/* Summary Card */}
            <Card className="mb-4">
                <Card.Body>
                    <h5>Summary</h5>
                    <p><strong>Total Records:</strong> {attendance.length}</p>
                    <p><strong>Total Employees:</strong> {new Set(attendance.map(a => a.employee)).size}</p>
                </Card.Body>
            </Card>

            {/* All Employees Attendance Table */}
            <Card>
                <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">All Attendance Records</h5>
                </Card.Header>
                <Card.Body>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Date</th>
                                <th>Check In</th>
                                <th>Check Out</th>
                                <th>Working Hours</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendance.map(record => (
                                <tr key={record.id} className={record.employee === currentUserEmployeeId ? 'table-primary' : ''}>
                                    <td>
                                        <strong>
                                            {getEmployeeDisplay(record.employee)}
                                        </strong>
                                        {record.employee === currentUserEmployeeId && <Badge bg="primary" className="ms-2">You</Badge>}
                                    </td>
                                    <td>{formatDate(record.date)}</td>
                                    <td>{formatDateTime(record.check_in_time)}</td>
                                    <td>{formatDateTime(record.check_out_time)}</td>
                                    <td>{record.working_hours ? `${record.working_hours} hrs` : '-'}</td>
                                    <td>
                                        {record.check_out_time ? (
                                            <Badge bg="success">Present</Badge>
                                        ) : record.check_in_time ? (
                                            <Badge bg="warning">Partial</Badge>
                                        ) : (
                                            <Badge bg="secondary">Absent</Badge>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {attendance.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center text-muted">
                                        No attendance records found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ManagerAttendance;