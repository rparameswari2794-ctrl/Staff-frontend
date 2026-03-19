// src/pages/manager/ManagerAdvance.jsx
import { useState, useEffect } from 'react';
import {
    Container, Row, Col, Card, Table, Badge,
    Alert, Spinner, Button, Modal, Form, ProgressBar
} from 'react-bootstrap';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { toast } from 'react-toastify';

const ManagerAdvance = () => {
    const { user } = useSelector((state) => state.auth);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [advances, setAdvances] = useState([]);
    const [repayments, setRepayments] = useState({});
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedAdvance, setSelectedAdvance] = useState(null);
    const [formData, setFormData] = useState({
        amount: '',
        reason: '',
        repayment_months: 1
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            fetchMyAdvances();
        } else {
            setError('User not authenticated');
            setLoading(false);
        }
    }, [user]);

    const fetchMyAdvances = async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('Fetching advances for manager...');
            
            // Fetch advances for this manager
            const advancesRes = await api.get('/admin/salary-advances/');
            const advanceResults = advancesRes.data.results || advancesRes.data || [];
            console.log('Advances results:', advanceResults);
            setAdvances(advanceResults);

            // Fetch repayments for each advance
            if (advanceResults.length > 0) {
                const repaymentsMap = {};
                for (const advance of advanceResults) {
                    try {
                        const repayRes = await api.get('/admin/advance-repayments/', {
                            params: { advance: advance.id }
                        });
                        const advanceRepayments = repayRes.data.results || repayRes.data || [];
                        repaymentsMap[advance.id] = advanceRepayments;
                    } catch (err) {
                        console.error(`Error fetching repayments for advance ${advance.id}:`, err);
                        repaymentsMap[advance.id] = [];
                    }
                }
                setRepayments(repaymentsMap);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching advances:', error);
            setError('Failed to load advance requests');
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmitRequest = async (e) => {
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
            setShowRequestModal(false);
            setFormData({ amount: '', reason: '', repayment_months: 1 });
            fetchMyAdvances();
        } catch (error) {
            console.error('Error submitting advance:', error);
            toast.error(error.response?.data?.message || 'Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    const calculateProgress = (advance) => {
        const advanceRepayments = repayments[advance.id] || [];
        const totalRepaid = advanceRepayments.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
        const totalAmount = parseFloat(advance.amount || 0);
        const remaining = totalAmount - totalRepaid;
        const percentage = totalAmount > 0 ? (totalRepaid / totalAmount) * 100 : 0;
        
        return { totalRepaid, remaining, percentage };
    };

    const formatCurrency = (amount) => {
        const num = parseFloat(amount || 0);
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
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

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
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
                <p className="mt-2 text-muted">Loading your advance requests...</p>
            </Container>
        );
    }

    return (
        <Container style={{ marginTop: '80px' }} fluid>
            <h2 className="mb-4">My Salary Advances</h2>
            
            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    <Alert.Heading>
                        <i className="fa-solid fa-circle-exclamation me-2"></i>
                        Error
                    </Alert.Heading>
                    <p>{error}</p>
                </Alert>
            )}

            {/* Request Button */}
            <Row className="mb-4">
                <Col className="text-end">
                    <Button variant="success" onClick={() => setShowRequestModal(true)}>
                        <i className="fa-solid fa-plus me-2"></i>
                        New Advance Request
                    </Button>
                </Col>
            </Row>

            {/* Advances Table */}
            <Card className="shadow-sm">
                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                        <i className="fa-solid fa-hand-holding-usd me-2"></i>
                        My Advance Requests
                    </h5>
                    <Badge bg="light" text="dark" pill>
                        Total: {advances.length}
                    </Badge>
                </Card.Header>
                <Card.Body>
                    <div style={{ overflowX: 'auto' }}>
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th>Request Date</th>
                                    <th>Amount</th>
                                    <th>Reason</th>
                                    <th>Repayment Months</th>
                                    <th>Monthly Deduction</th>
                                    <th>Status</th>
                                    <th>Progress</th>
                                    <th>Paid</th>
                                    <th>Remaining</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {advances.length > 0 ? (
                                    advances.map(advance => {
                                        const progress = calculateProgress(advance);
                                        return (
                                            <tr key={advance.id}>
                                                <td>{formatDate(advance.request_date)}</td>
                                                <td className="text-primary">
                                                    <strong>{formatCurrency(advance.amount)}</strong>
                                                </td>
                                                <td>{advance.reason}</td>
                                                <td>{advance.repayment_months} months</td>
                                                <td>{formatCurrency(advance.monthly_deduction || (advance.amount / advance.repayment_months))}</td>
                                                <td>{getStatusBadge(advance.status)}</td>
                                                <td style={{ minWidth: '150px' }}>
                                                    {advance.status === 'disbursed' || advance.status === 'repaid' ? (
                                                        <ProgressBar 
                                                            now={progress.percentage} 
                                                            label={`${progress.percentage.toFixed(1)}%`}
                                                            variant={progress.percentage >= 99.9 ? 'success' : 'info'}
                                                        />
                                                    ) : (
                                                        <span className="text-muted">Not started</span>
                                                    )}
                                                </td>
                                                <td className="text-success">
                                                    <strong>{formatCurrency(progress.totalRepaid)}</strong>
                                                </td>
                                                <td className={progress.remaining > 0.01 ? 'text-danger fw-bold' : 'text-success fw-bold'}>
                                                    {formatCurrency(progress.remaining)}
                                                </td>
                                                <td>
                                                    <Button
                                                        variant="outline-info"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedAdvance(advance);
                                                            setShowDetailsModal(true);
                                                        }}
                                                        title="View Details"
                                                    >
                                                        <i className="fa-solid fa-eye"></i>
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="10" className="text-center py-5">
                                            <i className="fa-solid fa-hand-holding-usd fa-3x text-muted mb-3"></i>
                                            <h5 className="text-muted">No advance requests found</h5>
                                            <p className="text-muted">Click the "New Advance Request" button to create one.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Request Modal */}
            <Modal show={showRequestModal} onHide={() => setShowRequestModal(false)}>
                <Modal.Header closeButton className="bg-success text-white">
                    <Modal.Title>
                        <i className="fa-solid fa-plus-circle me-2"></i>
                        Request Salary Advance
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmitRequest}>
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
                        <Button variant="secondary" onClick={() => setShowRequestModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="success" type="submit" disabled={submitting}>
                            {submitting ? <Spinner size="sm" /> : 'Submit Request'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Details Modal */}
            <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
                <Modal.Header closeButton className="bg-info text-white">
                    <Modal.Title>
                        <i className="fa-solid fa-info-circle me-2"></i>
                        Advance Request Details
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedAdvance && (
                        <>
                            <Row>
                                <Col md={6}>
                                    <Card className="mb-3">
                                        <Card.Header>Request Information</Card.Header>
                                        <Card.Body>
                                            <p><strong>Request Date:</strong> {formatDate(selectedAdvance.request_date)}</p>
                                            <p><strong>Amount:</strong> {formatCurrency(selectedAdvance.amount)}</p>
                                            <p><strong>Reason:</strong> {selectedAdvance.reason}</p>
                                            <p><strong>Repayment Months:</strong> {selectedAdvance.repayment_months}</p>
                                            <p><strong>Monthly Deduction:</strong> {formatCurrency(selectedAdvance.monthly_deduction || (selectedAdvance.amount / selectedAdvance.repayment_months))}</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card className="mb-3">
                                        <Card.Header>Status Information</Card.Header>
                                        <Card.Body>
                                            <p><strong>Status:</strong> {getStatusBadge(selectedAdvance.status)}</p>
                                            <p><strong>Approved By:</strong> {selectedAdvance.approved_by_username || '-'}</p>
                                            <p><strong>Approved At:</strong> {selectedAdvance.approved_at ? formatDateTime(selectedAdvance.approved_at) : '-'}</p>
                                            {selectedAdvance.disbursement_date && (
                                                <p><strong>Disbursed Date:</strong> {formatDate(selectedAdvance.disbursement_date)}</p>
                                            )}
                                            {selectedAdvance.approval_notes && (
                                                <p><strong>Approval Notes:</strong> {selectedAdvance.approval_notes}</p>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Payment Progress Summary */}
                            <Row className="mb-3">
                                <Col md={4}>
                                    <Card bg="primary" text="white">
                                        <Card.Body className="text-center">
                                            <h6>Total Amount</h6>
                                            <h4>{formatCurrency(selectedAdvance.amount)}</h4>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={4}>
                                    <Card bg="success" text="white">
                                        <Card.Body className="text-center">
                                            <h6>Paid Amount</h6>
                                            <h4>{formatCurrency(calculateProgress(selectedAdvance).totalRepaid)}</h4>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={4}>
                                    <Card bg={calculateProgress(selectedAdvance).remaining > 0.01 ? 'danger' : 'success'} text="white">
                                        <Card.Body className="text-center">
                                            <h6>Remaining</h6>
                                            <h4>{formatCurrency(calculateProgress(selectedAdvance).remaining)}</h4>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Progress Bar */}
                            <Card className="mb-3">
                                <Card.Body>
                                    <h6>Repayment Progress</h6>
                                    <ProgressBar 
                                        now={calculateProgress(selectedAdvance).percentage} 
                                        label={`${calculateProgress(selectedAdvance).percentage.toFixed(1)}%`}
                                        variant={calculateProgress(selectedAdvance).percentage >= 99.9 ? 'success' : 'info'}
                                        style={{ height: '25px' }}
                                    />
                                </Card.Body>
                            </Card>

                            {/* Repayment History */}
                            <Card>
                                <Card.Header className="bg-info text-white">
                                    <h6 className="mb-0">Repayment History</h6>
                                </Card.Header>
                                <Card.Body>
                                    {repayments[selectedAdvance.id]?.length > 0 ? (
                                        <Table size="sm" striped bordered hover>
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Amount</th>
                                                    <th>Month/Year</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {repayments[selectedAdvance.id].map((rep, index) => (
                                                    <tr key={index}>
                                                        <td>{formatDateTime(rep.created_at)}</td>
                                                        <td className="text-success fw-bold">{formatCurrency(rep.amount)}</td>
                                                        <td>{rep.month}/{rep.year}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <th colSpan="1">Total Paid:</th>
                                                    <th className="text-success">
                                                        {formatCurrency(repayments[selectedAdvance.id].reduce((sum, r) => sum + parseFloat(r.amount), 0))}
                                                    </th>
                                                    <th></th>
                                                </tr>
                                            </tfoot>
                                        </Table>
                                    ) : (
                                        <p className="text-muted text-center py-3">No repayments recorded yet</p>
                                    )}
                                </Card.Body>
                            </Card>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default ManagerAdvance;