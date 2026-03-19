// src/pages/admin/AdminSalaryAdvances.jsx
import { useState, useEffect } from 'react';
import {
    Container, Card, Table, Button, Badge,
    Alert, Spinner, Modal, Form, Row, Col, ProgressBar
} from 'react-bootstrap';
import api from '../../services/api';
import { toast } from 'react-toastify';
import RazorpayPayment from '../../components/RazorpayPayment';

const AdminSalaryAdvances = () => {
    const [advances, setAdvances] = useState([]);
    const [repayments, setRepayments] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAdvance, setSelectedAdvance] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showRepaymentModal, setShowRepaymentModal] = useState(false);
    const [showRazorpayModal, setShowRazorpayModal] = useState(false);
    const [disbursingAdvance, setDisbursingAdvance] = useState(null);
    const [repaymentForm, setRepaymentForm] = useState({
        amount: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchAdvances();
    }, []);

    const fetchAdvances = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/salary-advances/');
            const advancesData = response.data.results || response.data || [];
            console.log('Advances data:', advancesData);
            setAdvances(advancesData);

            // Fetch repayments for each advance
            const repaymentsMap = {};
            for (const advance of advancesData) {
                try {
                    console.log(`Fetching repayments for advance ${advance.id}...`);
                    const repayRes = await api.get('/admin/advance-repayments/', {
                        params: { advance: advance.id }
                    });
                    const repaymentsData = repayRes.data.results || repayRes.data || [];
                    console.log(`Repayments for advance ${advance.id}:`, repaymentsData);
                    repaymentsMap[advance.id] = repaymentsData;
                } catch (err) {
                    console.error(`Error fetching repayments for advance ${advance.id}:`, err);
                    repaymentsMap[advance.id] = [];
                }
            }
            console.log('All repayments map:', repaymentsMap);
            setRepayments(repaymentsMap);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching advances:', error);
            setError(error.response?.data?.message || 'Failed to load advances');
            setLoading(false);
        }
    };

    const handleAddRepayment = async () => {
        if (!selectedAdvance) return;

        if (!repaymentForm.amount || parseFloat(repaymentForm.amount) <= 0) {
            toast.warning('Please enter a valid amount');
            return;
        }

        setActionLoading(true);
        try {
            await api.post('/admin/advance-repayments/', {
                advance: selectedAdvance.id,
                amount: parseFloat(repaymentForm.amount),
                month: parseInt(repaymentForm.month),
                year: parseInt(repaymentForm.year)
            });

            toast.success('Repayment recorded successfully');
            setShowRepaymentModal(false);
            setRepaymentForm({
                amount: '',
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear()
            });
            fetchAdvances();
        } catch (error) {
            console.error('Error adding repayment:', error);
            toast.error(error.response?.data?.message || 'Failed to add repayment');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRazorpaySuccess = async (paymentResponse, advanceId) => {
        try {
            setActionLoading(true);

            console.log('Razorpay payment successful:', paymentResponse);

            // Verify the payment with your backend
            const verifyResponse = await api.post('/verify-razorpay-payment/', {
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                advance_id: advanceId
            });

            console.log('Verification response:', verifyResponse.data);

            if (verifyResponse.data.success) {
                toast.success('Advance disbursed successfully via Razorpay');
            } else {
                toast.error('Payment verification failed');
            }

            setShowRazorpayModal(false);
            setDisbursingAdvance(null);
            fetchAdvances();
        } catch (error) {
            console.error('Error verifying payment:', error);
            console.error('Error response:', error.response?.data);

            if (error.response?.data) {
                const errorMsg = typeof error.response.data === 'object'
                    ? JSON.stringify(error.response.data)
                    : error.response.data;
                toast.error(`Verification failed: ${errorMsg}`);
            } else {
                toast.error('Payment verification failed');
            }
        } finally {
            setActionLoading(false);
        }
    };
    const calculateProgress = (advance) => {
        const handleRazorpaySuccess = async (paymentResponse, advanceId) => {
            try {
                setActionLoading(true);

                console.log('Razorpay payment successful:', paymentResponse);

                // Verify the payment with your backend
                const verifyResponse = await api.post('/verify-razorpay-payment/', {
                    razorpay_order_id: paymentResponse.razorpay_order_id,
                    razorpay_payment_id: paymentResponse.razorpay_payment_id,
                    razorpay_signature: paymentResponse.razorpay_signature,
                    advance_id: advanceId
                });

                console.log('Verification response:', verifyResponse.data);

                if (verifyResponse.data.success) {
                    toast.success('Advance disbursed successfully via Razorpay');
                } else {
                    toast.error('Payment verification failed');
                }

                setShowRazorpayModal(false);
                setDisbursingAdvance(null);
                fetchAdvances();
            } catch (error) {
                console.error('Error verifying payment:', error);
                console.error('Error response:', error.response?.data);

                if (error.response?.data) {
                    const errorMsg = typeof error.response.data === 'object'
                        ? JSON.stringify(error.response.data)
                        : error.response.data;
                    toast.error(`Verification failed: ${errorMsg}`);
                } else {
                    toast.error('Payment verification failed');
                }
            } finally {
                setActionLoading(false);
            }
        }; const advanceRepayments = repayments[advance.id] || [];
        console.log(`Calculating progress for advance ${advance.id}:`, advanceRepayments);

        const totalPaid = advanceRepayments.reduce((sum, r) => {
            const amount = parseFloat(r.amount) || 0;
            return sum + amount;
        }, 0);

        const totalAmount = parseFloat(advance.amount) || 0;
        const balance = totalAmount - totalPaid;
        const percentage = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

        console.log(`Progress: totalPaid=${totalPaid}, balance=${balance}, percentage=${percentage}`);

        return { totalPaid, balance, percentage };
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
                <p className="mt-2 text-muted">Loading advance requests...</p>
            </Container>
        );
    }

    return (
        <Container style={{ marginTop: '80px' }} fluid>
            <h2 className="mb-4">Salary Advance Management</h2>
            <p className="text-muted mb-4">View and manage all salary advance requests</p>

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

            <Card className="shadow-sm">
                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                        <i className="fa-solid fa-hand-holding-usd me-2"></i>
                        All Advance Requests
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
                                    <th>Employee</th>
                                    <th>Request Date</th>
                                    <th>Total Amount</th>
                                    <th>Paid Amount</th>
                                    <th>Balance</th>
                                    <th>Progress</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {advances.length > 0 ? (
                                    advances.map(advance => {
                                        const { totalPaid, balance, percentage } = calculateProgress(advance);
                                        return (
                                            <tr key={advance.id}>
                                                <td>
                                                    <strong>{advance.employee_name}</strong>
                                                    <div className="text-muted small">{advance.employee_id}</div>
                                                </td>
                                                <td>{formatDate(advance.request_date)}</td>
                                                <td className="text-primary">
                                                    <strong>{formatCurrency(advance.amount)}</strong>
                                                </td>
                                                <td className="text-success">
                                                    <strong>{formatCurrency(totalPaid)}</strong>
                                                </td>
                                                <td className={balance > 0 ? 'text-danger fw-bold' : 'text-success fw-bold'}>
                                                    {formatCurrency(balance)}
                                                </td>
                                                <td style={{ minWidth: '180px' }}>
                                                    <ProgressBar
                                                        now={percentage}
                                                        label={`${percentage.toFixed(1)}%`}
                                                        variant={percentage >= 100 ? 'success' : percentage > 50 ? 'info' : 'warning'}
                                                    />
                                                    <small className="text-muted">
                                                        {totalPaid > 0 ? `${formatCurrency(totalPaid)} paid` : 'No payments yet'}
                                                    </small>
                                                </td>
                                                <td>{advance.reason}</td>
                                                <td>{getStatusBadge(advance.status)}</td>
                                                <td>
                                                    <Button
                                                        variant="outline-info"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedAdvance(advance);
                                                            setShowDetailsModal(true);
                                                        }}
                                                        className="me-1"
                                                        title="View Details"
                                                    >
                                                        <i className="fa-solid fa-eye"></i>
                                                    </Button>

                                                    {/* Show approve button for pending advances */}
                                                    {advance.status === 'pending' && (
                                                        <Button
                                                            variant="outline-warning"
                                                            size="sm"
                                                            onClick={async () => {
                                                                if (window.confirm(`Approve advance request for ${advance.employee_name} of ${formatCurrency(advance.amount)}?`)) {
                                                                    try {
                                                                        await api.post(`/admin/salary-advances/${advance.id}/approve/`);
                                                                        toast.success('Advance approved successfully');
                                                                        fetchAdvances();
                                                                    } catch (error) {
                                                                        console.error('Error approving advance:', error);
                                                                        toast.error('Failed to approve advance');
                                                                    }
                                                                }
                                                            }}
                                                            className="me-1"
                                                            title="Approve"
                                                        >
                                                            <i className="fa-solid fa-check"></i>
                                                        </Button>
                                                    )}

                                                    {/* Show reject button for pending advances */}
                                                    {advance.status === 'pending' && (
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={async () => {
                                                                const reason = prompt('Enter rejection reason:');
                                                                if (reason) {
                                                                    try {
                                                                        await api.post(`/admin/salary-advances/${advance.id}/reject/`, {
                                                                            notes: reason
                                                                        });
                                                                        toast.success('Advance rejected');
                                                                        fetchAdvances();
                                                                    } catch (error) {
                                                                        console.error('Error rejecting advance:', error);
                                                                        toast.error('Failed to reject advance');
                                                                    }
                                                                }
                                                            }}
                                                            className="me-1"
                                                            title="Reject"
                                                        >
                                                            <i className="fa-solid fa-times"></i>
                                                        </Button>
                                                    )}

                                                    {/* Show disbursed button for approved advances - OPENS RAZORPAY */}
                                                    {advance.status === 'approved' && (
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => {
                                                                setDisbursingAdvance(advance);
                                                                setShowRazorpayModal(true);
                                                            }}
                                                            title="Disburse via Razorpay"
                                                        >
                                                            <i className="fa-solid fa-credit-card"></i>
                                                        </Button>
                                                    )}

                                                    {/* Show add repayment button for disbursed advances with balance */}
                                                    {advance.status === 'disbursed' && balance > 0 && (
                                                        <Button
                                                            variant="outline-success"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedAdvance(advance);
                                                                setShowRepaymentModal(true);
                                                            }}
                                                            title="Add Repayment"
                                                        >
                                                            <i className="fa-solid fa-plus"></i>
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="text-center py-5">
                                            <i className="fa-solid fa-hand-holding-usd fa-3x text-muted mb-3"></i>
                                            <h5 className="text-muted">No advance requests found</h5>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

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
                                        <Card.Header>Employee Information</Card.Header>
                                        <Card.Body>
                                            <p><strong>Name:</strong> {selectedAdvance.employee_name}</p>
                                            <p><strong>Employee ID:</strong> {selectedAdvance.employee_id}</p>
                                            <p><strong>Status:</strong> {getStatusBadge(selectedAdvance.status)}</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card className="mb-3">
                                        <Card.Header>Request Information</Card.Header>
                                        <Card.Body>
                                            <p><strong>Request Date:</strong> {formatDate(selectedAdvance.request_date)}</p>
                                            <p><strong>Amount:</strong> {formatCurrency(selectedAdvance.amount)}</p>
                                            <p><strong>Reason:</strong> {selectedAdvance.reason}</p>
                                            <p><strong>Repayment Months:</strong> {selectedAdvance.repayment_months}</p>
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
                                            <h4>{formatCurrency(calculateProgress(selectedAdvance).totalPaid)}</h4>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={4}>
                                    <Card bg={calculateProgress(selectedAdvance).balance > 0 ? 'danger' : 'success'} text="white">
                                        <Card.Body className="text-center">
                                            <h6>Balance</h6>
                                            <h4>{formatCurrency(calculateProgress(selectedAdvance).balance)}</h4>
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
                                        variant={calculateProgress(selectedAdvance).percentage >= 100 ? 'success' : 'info'}
                                        style={{ height: '25px' }}
                                    />
                                </Card.Body>
                            </Card>

                            {/* Repayment History */}
                            <Card className="mb-3">
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
                                                    <th>Associated Salary</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {repayments[selectedAdvance.id].map((rep, index) => (
                                                    <tr key={index}>
                                                        <td>{formatDateTime(rep.created_at)}</td>
                                                        <td className="text-success fw-bold">{formatCurrency(rep.amount)}</td>
                                                        <td>{rep.month}/{rep.year}</td>
                                                        <td>
                                                            {rep.salary_payment ? (
                                                                <Badge bg="info">Salary #{rep.salary_payment}</Badge>
                                                            ) : (
                                                                <Badge bg="secondary">Manual</Badge>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <th colSpan="1">Total Paid:</th>
                                                    <th className="text-success">
                                                        {formatCurrency(repayments[selectedAdvance.id].reduce((sum, r) => sum + parseFloat(r.amount), 0))}
                                                    </th>
                                                    <th colSpan="2"></th>
                                                </tr>
                                            </tfoot>
                                        </Table>
                                    ) : (
                                        <p className="text-muted text-center py-3">No repayments recorded yet</p>
                                    )}
                                </Card.Body>
                            </Card>

                            <Row>
                                <Col md={12}>
                                    <Card>
                                        <Card.Header>Status & Approval</Card.Header>
                                        <Card.Body>
                                            <Row>
                                                <Col md={4}>
                                                    <p><strong>Status:</strong> {getStatusBadge(selectedAdvance.status)}</p>
                                                </Col>
                                                <Col md={4}>
                                                    <p><strong>Approved By:</strong> {selectedAdvance.approved_by_username || '-'}</p>
                                                </Col>
                                                <Col md={4}>
                                                    <p><strong>Approved At:</strong> {selectedAdvance.approved_at ? formatDateTime(selectedAdvance.approved_at) : '-'}</p>
                                                </Col>
                                            </Row>
                                            {selectedAdvance.approval_notes && (
                                                <p><strong>Approval Notes:</strong> {selectedAdvance.approval_notes}</p>
                                            )}
                                            {selectedAdvance.disbursement_date && (
                                                <p><strong>Disbursed Date:</strong> {formatDate(selectedAdvance.disbursement_date)}</p>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
                        Close
                    </Button>
                    {selectedAdvance && selectedAdvance.status === 'disbursed' && calculateProgress(selectedAdvance).balance > 0 && (
                        <Button
                            variant="success"
                            onClick={() => {
                                setShowDetailsModal(false);
                                setShowRepaymentModal(true);
                            }}
                        >
                            <i className="fa-solid fa-plus me-2"></i>
                            Add Repayment
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>

            {/* Add Repayment Modal */}
            <Modal show={showRepaymentModal} onHide={() => setShowRepaymentModal(false)}>
                <Modal.Header closeButton className="bg-success text-white">
                    <Modal.Title>
                        <i className="fa-solid fa-plus-circle me-2"></i>
                        Add Repayment
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedAdvance && (
                        <>
                            <Card className="mb-3 bg-light">
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <p><strong>Employee:</strong> {selectedAdvance.employee_name}</p>
                                        </Col>
                                        <Col md={6}>
                                            <p><strong>Total Advance:</strong> {formatCurrency(selectedAdvance.amount)}</p>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={6}>
                                            <p><strong>Paid Amount:</strong> <span className="text-success">{formatCurrency(calculateProgress(selectedAdvance).totalPaid)}</span></p>
                                        </Col>
                                        <Col md={6}>
                                            <p><strong>Remaining Balance:</strong> <span className="text-danger">{formatCurrency(calculateProgress(selectedAdvance).balance)}</span></p>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            <Form.Group className="mb-3">
                                <Form.Label>Amount</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    value={repaymentForm.amount}
                                    onChange={(e) => setRepaymentForm({ ...repaymentForm, amount: e.target.value })}
                                    placeholder="Enter amount"
                                    max={calculateProgress(selectedAdvance).balance}
                                />
                                <Form.Text className="text-muted">
                                    Maximum amount: {formatCurrency(calculateProgress(selectedAdvance).balance)}
                                </Form.Text>
                            </Form.Group>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Month</Form.Label>
                                        <Form.Select
                                            value={repaymentForm.month}
                                            onChange={(e) => setRepaymentForm({ ...repaymentForm, month: e.target.value })}
                                        >
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                                <option key={month} value={month}>
                                                    {new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' })}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Year</Form.Label>
                                        <Form.Select
                                            value={repaymentForm.year}
                                            onChange={(e) => setRepaymentForm({ ...repaymentForm, year: e.target.value })}
                                        >
                                            {[2024, 2025, 2026].map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRepaymentModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="success" onClick={handleAddRepayment} disabled={actionLoading}>
                        {actionLoading ? <Spinner size="sm" /> : 'Add Repayment'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Razorpay Payment Modal for Disbursement */}
            {disbursingAdvance && (
                <RazorpayPayment
                    show={showRazorpayModal}
                    onHide={() => {
                        setShowRazorpayModal(false);
                        setDisbursingAdvance(null);
                    }}
                    advance={{
                        id: disbursingAdvance.id,
                        amount: disbursingAdvance.amount,
                        employee_name: disbursingAdvance.employee_name,
                        employee_id: disbursingAdvance.employee_id
                    }}
                    onSuccess={(response) => handleRazorpaySuccess(response, disbursingAdvance.id)}
                />
            )}
        </Container>
    );
};

export default AdminSalaryAdvances;