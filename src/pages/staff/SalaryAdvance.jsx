// src/pages/staff/SalaryAdvance.jsx
import { useState, useEffect } from 'react';
import {
    Container, Card, Table, Button, Badge,
    Alert, Spinner, Modal, Form, Row, Col
} from 'react-bootstrap';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { toast } from 'react-toastify';

const SalaryAdvance = () => {
    const { user } = useSelector((state) => state.auth);
    const [advances, setAdvances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        amount: '',
        reason: '',
        repayment_months: 1
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchMyAdvances();
    }, []);

    const fetchMyAdvances = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/salary-advances/');
            setAdvances(response.data.results || response.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching advances:', error);
            toast.error('Failed to load advances');
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            toast.warning('Please enter a valid amount');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/admin/salary-advances/', {
                amount: parseFloat(formData.amount),
                reason: formData.reason,
                repayment_months: parseInt(formData.repayment_months)
            });
            
            toast.success('Advance request submitted successfully');
            setShowModal(false);
            setFormData({ amount: '', reason: '', repayment_months: 1 });
            fetchMyAdvances();
        } catch (error) {
            console.error('Error submitting advance:', error);
            toast.error(error.response?.data?.message || 'Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount || 0);
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
            'pending': 'warning',
            'approved': 'success',
            'rejected': 'danger',
            'disbursed': 'info',
            'repaid': 'secondary'
        };
        return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
    };

    if (loading) {
        return (
            <Container className="text-center py-5" style={{ marginTop: '80px' }}>
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Loading your requests...</p>
            </Container>
        );
    }

    return (
        <Container style={{ marginTop: '80px' }} fluid>
            <Row className="mb-4">
                <Col>
                    <h2>Salary Advance</h2>
                    <p className="text-muted">Request salary advance</p>
                </Col>
                <Col className="text-end">
                    <Button variant="success" onClick={() => setShowModal(true)}>
                        <i className="fa-solid fa-plus me-2"></i>
                        New Request
                    </Button>
                </Col>
            </Row>

            <Card className="shadow-sm">
                <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">My Advance Requests</h5>
                </Card.Header>
                <Card.Body>
                    <div style={{ overflowX: 'auto' }}>
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th>Request Date</th>
                                    <th>Amount</th>
                                    <th>Reason</th>
                                    <th>Repayment</th>
                                    <th>Status</th>
                                    <th>Approved By</th>
                                    <th>Disbursed Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {advances.map(advance => (
                                    <tr key={advance.id}>
                                        <td>{formatDate(advance.request_date)}</td>
                                        <td className="text-success">
                                            <strong>{formatCurrency(advance.amount)}</strong>
                                        </td>
                                        <td>{advance.reason}</td>
                                        <td>{advance.repayment_months} months</td>
                                        <td>{getStatusBadge(advance.status)}</td>
                                        <td>{advance.approved_by_username || '-'}</td>
                                        <td>{advance.disbursement_date ? formatDate(advance.disbursement_date) : '-'}</td>
                                    </tr>
                                ))}
                                {advances.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4">
                                            <i className="fa-solid fa-hand-holding-usd fa-2x text-muted mb-2"></i>
                                            <p>No advance requests found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Request Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton className="bg-success text-white">
                    <Modal.Title>Request Salary Advance</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Amount (₹)</Form.Label>
                            <Form.Control
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleInputChange}
                                placeholder="Enter amount"
                                min="1"
                                step="0.01"
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Reason</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="reason"
                                value={formData.reason}
                                onChange={handleInputChange}
                                placeholder="Reason for advance"
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Repayment Months</Form.Label>
                            <Form.Select
                                name="repayment_months"
                                value={formData.repayment_months}
                                onChange={handleInputChange}
                            >
                                <option value="1">1 Month</option>
                                <option value="2">2 Months</option>
                                <option value="3">3 Months</option>
                                <option value="4">4 Months</option>
                                <option value="5">5 Months</option>
                                <option value="6">6 Months</option>
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="success" type="submit" disabled={submitting}>
                            {submitting ? <Spinner size="sm" /> : 'Submit Request'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default SalaryAdvance;