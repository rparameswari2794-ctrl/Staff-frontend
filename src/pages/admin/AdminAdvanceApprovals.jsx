// src/pages/admin/AdminAdvanceApprovals.jsx
import { useState, useEffect } from 'react';
import {
    Container, Card, Table, Button, Badge,
    Alert, Spinner, Modal, Form, Row, Col, Tab, Nav
} from 'react-bootstrap';
import api from '../../services/api';
import { toast } from 'react-toastify';
import RazorpayPayment from '../../components/RazorpayPayment';

const AdminAdvanceApprovals = () => {
    const [advances, setAdvances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAdvance, setSelectedAdvance] = useState(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [notes, setNotes] = useState('');
    const [activeTab, setActiveTab] = useState('pending');

    useEffect(() => {
        fetchAdvances();
    }, [activeTab]);

    const fetchAdvances = async () => {
        try {
            setLoading(true);
            setError(null);
            
            let params = {};
            if (activeTab !== 'all') {
                params.status = activeTab;
            }
            
            const response = await api.get('/admin/salary-advances/', { params });
            console.log('Advances response:', response.data);
            setAdvances(response.data.results || response.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching advances:', error);
            setError(error.response?.data?.message || 'Failed to load advances');
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedAdvance) return;
        
        setActionLoading(true);
        try {
            await api.post(`/admin/salary-advances/${selectedAdvance.id}/approve/`, {
                notes: notes
            });
            toast.success('Advance approved successfully');
            setShowApproveModal(false);
            setNotes('');
            fetchAdvances();
        } catch (error) {
            console.error('Error approving advance:', error);
            toast.error('Failed to approve advance');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedAdvance) return;
        
        setActionLoading(true);
        try {
            await api.post(`/admin/salary-advances/${selectedAdvance.id}/reject/`, {
                notes: notes
            });
            toast.success('Advance rejected');
            setShowRejectModal(false);
            setNotes('');
            fetchAdvances();
        } catch (error) {
            console.error('Error rejecting advance:', error);
            toast.error('Failed to reject advance');
        } finally {
            setActionLoading(false);
        }
    };

    const handlePaymentSuccess = (advanceId, paymentResponse) => {
        toast.success('Payment completed successfully');
        setShowPaymentModal(false);
        fetchAdvances();
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
                <p className="mt-2 text-muted">Loading advance requests...</p>
            </Container>
        );
    }

    return (
        <Container style={{ marginTop: '80px' }} fluid>
            <h2 className="mb-4">Advance Request Management</h2>
            <p className="text-muted mb-4">Approve/reject and process salary advance requests</p>

            {error && (
                <Alert variant="danger" className="mb-4">
                    <Alert.Heading>
                        <i className="fa-solid fa-circle-exclamation me-2"></i>
                        Error
                    </Alert.Heading>
                    <p>{error}</p>
                    <hr />
                    <div className="d-flex justify-content-end">
                        <Button variant="outline-danger" onClick={fetchAdvances}>
                            <i className="fa-solid fa-rotate-right me-2"></i>
                            Retry
                        </Button>
                    </div>
                </Alert>
            )}

            {/* Status Tabs */}
            <Card className="shadow-sm mb-4">
                <Card.Header>
                    <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                        <Nav.Item>
                            <Nav.Link eventKey="pending">Pending</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="approved">Approved</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="rejected">Rejected</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="disbursed">Disbursed</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="all">All</Nav.Link>
                        </Nav.Item>
                    </Nav>
                </Card.Header>
            </Card>

            <Card className="shadow-sm">
                <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">
                        <i className="fa-solid fa-hand-holding-usd me-2"></i>
                        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Advance Requests
                    </h5>
                </Card.Header>
                <Card.Body>
                    <div style={{ overflowX: 'auto' }}>
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Request Date</th>
                                    <th>Amount</th>
                                    <th>Reason</th>
                                    <th>Repayment</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {advances.length > 0 ? (
                                    advances.map(advance => (
                                        <tr key={advance.id}>
                                            <td>
                                                <strong>{advance.employee_name}</strong>
                                                <div className="text-muted small">{advance.employee_id}</div>
                                            </td>
                                            <td>{formatDate(advance.request_date)}</td>
                                            <td className="text-success">
                                                <strong>{formatCurrency(advance.amount)}</strong>
                                            </td>
                                            <td>{advance.reason}</td>
                                            <td>{advance.repayment_months} months</td>
                                            <td>{getStatusBadge(advance.status)}</td>
                                            <td>
                                                {advance.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            variant="success"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedAdvance(advance);
                                                                setShowApproveModal(true);
                                                            }}
                                                            className="me-1"
                                                            title="Approve"
                                                        >
                                                            <i className="fa-solid fa-check"></i>
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedAdvance(advance);
                                                                setShowRejectModal(true);
                                                            }}
                                                            title="Reject"
                                                        >
                                                            <i className="fa-solid fa-times"></i>
                                                        </Button>
                                                    </>
                                                )}
                                                {advance.status === 'approved' && (
                                                    <Button
                                                        variant="info"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedAdvance(advance);
                                                            setShowPaymentModal(true);
                                                        }}
                                                        title="Process Payment"
                                                    >
                                                        <i className="fa-solid fa-credit-card me-1"></i>
                                                        Pay
                                                    </Button>
                                                )}
                                                {advance.status === 'disbursed' && (
                                                    <Badge bg="info">Paid</Badge>
                                                )}
                                                {advance.status === 'rejected' && (
                                                    <Badge bg="danger">Rejected</Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4">
                                            <i className="fa-solid fa-inbox fa-2x text-muted mb-2"></i>
                                            <p>No {activeTab} advance requests found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Approve Modal */}
            <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)}>
                <Modal.Header closeButton className="bg-success text-white">
                    <Modal.Title>Approve Advance Request</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Approve advance for <strong>{selectedAdvance?.employee_name}</strong>?</p>
                    <p className="text-success"><strong>Amount: {formatCurrency(selectedAdvance?.amount)}</strong></p>
                    <Form.Group>
                        <Form.Label>Notes (Optional)</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add approval notes..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowApproveModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="success" onClick={handleApprove} disabled={actionLoading}>
                        {actionLoading ? <Spinner size="sm" /> : 'Approve'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Reject Modal */}
            <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
                <Modal.Header closeButton className="bg-danger text-white">
                    <Modal.Title>Reject Advance Request</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Reject advance for <strong>{selectedAdvance?.employee_name}</strong>?</p>
                    <p className="text-danger"><strong>Amount: {formatCurrency(selectedAdvance?.amount)}</strong></p>
                    <Form.Group>
                        <Form.Label>Reason for rejection</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Enter rejection reason..."
                            required
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleReject} disabled={actionLoading}>
                        {actionLoading ? <Spinner size="sm" /> : 'Reject'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Razorpay Payment Modal */}
            {selectedAdvance && (
                <RazorpayPayment
                    show={showPaymentModal}
                    onHide={() => setShowPaymentModal(false)}
                    advance={selectedAdvance}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </Container>
    );
};

export default AdminAdvanceApprovals;