import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Container, Table, Button, Card, Row, Col, Badge } from 'react-bootstrap';
import api from '../../services/api';
import { format, parseISO } from 'date-fns';
import { toZonedTime, format as formatTZ } from 'date-fns-tz';

const StaffAttendance = () => {
  const { user } = useSelector((state) => state.auth);
  const [attendance, setAttendance] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(false);

  // Set your timezone (change this to your local timezone)
  const timeZone = 'Asia/Kolkata'; // For India, use 'Asia/Kolkata'

  // Helper function to format date consistently with timezone
  const formatDateTime = (datetime) => {
    if (!datetime) return '-';
    try {
      // Parse the ISO string
      const date = parseISO(datetime);
      
      // Convert to specified timezone
      const zonedDate = toZonedTime(date, timeZone);
      
      // Format the date
      return formatTZ(zonedDate, 'hh:mm a', { timeZone });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = parseISO(dateString);
      const zonedDate = toZonedTime(date, timeZone);
      return formatTZ(zonedDate, 'yyyy-MM-dd', { timeZone });
    } catch (error) {
      return dateString;
    }
  };

  // For debugging - log raw data
  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await api.get('/attendance/');
      console.log('Raw attendance data from server:', response.data);
      
      // Debug: Show what times look like after conversion
      response.data.forEach(record => {
        if (record.check_in_time) {
          const utcDate = new Date(record.check_in_time);
          const zonedDate = toZonedTime(parseISO(record.check_in_time), timeZone);
          console.log(`Record ${record.id}:`, {
            raw: record.check_in_time,
            utc: utcDate.toUTCString(),
            utcHours: utcDate.getUTCHours(),
            zoned: formatTZ(zonedDate, 'hh:mm a', { timeZone }),
            expected: record.check_in_time.includes('08:55') ? 'Should be 8:55 AM' : 'Check'
          });
        }
      });
      
      setAttendance(response.data);
      
      // Check if already checked in today
      const todayStr = new Date().toISOString().split('T')[0];
      const today = response.data.find(a => a.date === todayStr);
      setTodayAttendance(today);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const response = await api.post('/attendance/check_in/');
      console.log('Check in response:', response.data);
      setTodayAttendance(response.data);
      fetchAttendance();
    } catch (error) {
      console.error('Error checking in:', error);
      const errorMsg = error.response?.data?.error || 'Failed to check in';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!todayAttendance) return;
    setLoading(true);
    try {
      await api.post(`/attendance/${todayAttendance.id}/check_out/`);
      fetchAttendance(); // Refresh the list to get updated data
    } catch (error) {
      console.error('Error checking out:', error);
      const errorMsg = error.response?.data?.error || 'Failed to check out';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Calculate working hours if not provided by backend
  const calculateWorkingHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '-';
    try {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const hours = (end - start) / (1000 * 60 * 60);
      return hours.toFixed(2);
    } catch {
      return '-';
    }
  };

  return (
    <Container className="mt-4">
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
                  {attendance.map((record) => (
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
                  {attendance.length === 0 && (
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
    </Container>
  );
};

export default StaffAttendance;