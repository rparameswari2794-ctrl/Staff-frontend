// src/pages/staff/MySalary.jsx
import { useState, useEffect } from 'react';
import {
    Container, Row, Col, Card, Table, Badge,
    Alert, Spinner, Button, Modal, ProgressBar
} from 'react-bootstrap';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { toast } from 'react-toastify';

const MySalary = () => {
    const { user } = useSelector((state) => state.auth);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [salaryDetails, setSalaryDetails] = useState(null);
    const [payments, setPayments] = useState([]);
    const [advances, setAdvances] = useState([]);
    const [repayments, setRepayments] = useState({}); // Change to object keyed by advance ID
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [showPayslipModal, setShowPayslipModal] = useState(false);

    useEffect(() => {
        if (user) {
            fetchMySalaryData();
        } else {
            setError('User not authenticated');
            setLoading(false);
        }
    }, [user]);

    const fetchMySalaryData = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('========== DEBUG: Fetching My Salary Data ==========');
            console.log('Current user from Redux:', user);

            // Step 1: Get the employee profile for the current user
            let currentEmployee = null;

            // Method 1: Try to get profile directly (most reliable)
            try {
                console.log('Trying /employees/profile/ endpoint...');
                const profileRes = await api.get('/employees/profile/');
                console.log('Employee profile response:', profileRes.data);
                if (profileRes.data && profileRes.data.id) {
                    currentEmployee = profileRes.data;
                    console.log('✅ Found employee via profile endpoint:', currentEmployee);
                }
            } catch (err) {
                console.log('Could not fetch employee profile directly:', err.response?.data || err.message);
            }

            // Method 2: If that fails, search by user ID or username
            if (!currentEmployee) {
                try {
                    console.log('Trying to find employee by searching all employees...');
                    const employeesRes = await api.get('/employees/');
                    const allEmployees = employeesRes.data.results || employeesRes.data || [];
                    console.log('All employees:', allEmployees);

                    // Try multiple matching strategies
                    currentEmployee = allEmployees.find(emp => {
                        // Match by user ID (most reliable)
                        if (emp.user && emp.user.id === user?.id) {
                            console.log('✅ Matched by user ID:', emp);
                            return true;
                        }
                        // Match by username
                        if (emp.user?.username === user?.username) {
                            console.log('✅ Matched by username:', emp);
                            return true;
                        }
                        // Match by email
                        if (emp.user?.email === user?.email) {
                            console.log('✅ Matched by email:', emp);
                            return true;
                        }
                        // Match by employee_id
                        if (emp.employee_id === user?.employee_id) {
                            console.log('✅ Matched by employee_id:', emp);
                            return true;
                        }
                        // Match by full name (partial)
                        const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
                        if (fullName && emp.full_name?.toLowerCase().includes(fullName.toLowerCase())) {
                            console.log('✅ Matched by full name:', emp);
                            return true;
                        }
                        // Match by first name alone
                        if (user?.first_name && emp.full_name?.toLowerCase().includes(user.first_name.toLowerCase())) {
                            console.log('✅ Matched by first name:', emp);
                            return true;
                        }
                        return false;
                    });
                } catch (err) {
                    console.error('Error fetching employees:', err);
                }
            }

            if (!currentEmployee) {
                console.error('❌ No employee found for user:', user);
                setError('Could not find your employee profile. Please contact admin.');
                setLoading(false);
                return;
            }

            console.log('✅ Final current employee:', currentEmployee);
            console.log('Employee ID:', currentEmployee.id);
            console.log('Employee Name:', currentEmployee.full_name || currentEmployee.name);

            // Step 2: Fetch employee's salary details (keeping for reference but not displaying)
            try {
                console.log('Fetching salary details for employee ID:', currentEmployee.id);
                const salaryRes = await api.get('/admin/employee-salaries/', {
                    params: {
                        employee: currentEmployee.id,
                        is_current: true
                    }
                });

                console.log('Salary API response:', salaryRes.data);

                const salaryResults = salaryRes.data.results || salaryRes.data || [];
                console.log('Salary results array:', salaryResults);

                const mySalary = salaryResults.length > 0 ? salaryResults[0] : null;
                console.log('My salary (first result):', mySalary);

                setSalaryDetails(mySalary);
            } catch (err) {
                console.error('Error fetching salary details:', err);
                toast.error('Failed to load salary details');
            }

            // Step 3: Fetch salary payments for this employee
            try {
                console.log('Fetching payments for employee ID:', currentEmployee.id);
                const paymentsRes = await api.get('/admin/salary-payments/', {
                    params: { employee: currentEmployee.id }
                });

                console.log('Payments API response:', paymentsRes.data);
                const paymentResults = paymentsRes.data.results || paymentsRes.data || [];
                console.log('Payments results:', paymentResults);
                setPayments(paymentResults);
            } catch (err) {
                console.error('Error fetching payments:', err);
            }

            // Step 4: Fetch advances for this employee
            try {
                console.log('Fetching advances for employee ID:', currentEmployee.id);
                const advancesRes = await api.get('/admin/salary-advances/', {
                    params: { employee: currentEmployee.id }
                });

                console.log('Advances API response:', advancesRes.data);
                const advanceResults = advancesRes.data.results || advancesRes.data || [];
                console.log('Advances results:', advanceResults);
                setAdvances(advanceResults);

                // Step 5: Fetch repayments for each advance (store as object keyed by advance ID)
                if (advanceResults.length > 0) {
                    const repaymentsMap = {};
                    for (const advance of advanceResults) {
                        try {
                            console.log(`Fetching repayments for advance ID ${advance.id}...`);
                            const repayRes = await api.get('/admin/advance-repayments/', {
                                params: { advance: advance.id }
                            });
                            const advanceRepayments = repayRes.data.results || repayRes.data || [];
                            console.log(`Repayments for advance ${advance.id}:`, advanceRepayments);
                            repaymentsMap[advance.id] = advanceRepayments;
                        } catch (err) {
                            console.error(`Error fetching repayments for advance ${advance.id}:`, err);
                            repaymentsMap[advance.id] = [];
                        }
                    }
                    console.log('All repayments map:', repaymentsMap);
                    setRepayments(repaymentsMap);
                }
            } catch (err) {
                console.error('Error fetching advances:', err);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error in fetchMySalaryData:', error);
            setError('Failed to load salary data: ' + (error.response?.data?.message || error.message));
            setLoading(false);
        }
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
            'completed': 'success',
            'processing': 'info',
            'failed': 'danger',
            'repaid': 'secondary'
        };
        return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
    };

    const calculateRepaymentProgress = (advance) => {
    // Get repayments for this specific advance from the map
    const advanceRepayments = repayments[advance.id] || [];
    
    console.log(`Calculating progress for advance ${advance.id}:`, advanceRepayments);
    console.log(`Repayments map:`, repayments);

    const totalRepaid = advanceRepayments.reduce((sum, r) => {
        const amount = parseFloat(r.amount) || 0;
        console.log(`Adding repayment amount: ${amount}`);
        return sum + amount;
    }, 0);

    const totalAmount = parseFloat(advance.amount) || 0;
    const remaining = totalAmount - totalRepaid;
    const percentage = totalAmount > 0 ? (totalRepaid / totalAmount) * 100 : 0;

    console.log(`Progress for advance ${advance.id}:`, {
        totalAmount,
        totalRepaid,
        remaining,
        percentage,
        repaymentCount: advanceRepayments.length
    });

    return { totalRepaid, remaining, percentage };
};

    const getAllRepayments = () => {
        // Flatten all repayments from the map for the history table
        return Object.values(repayments).flat();
    };

    if (loading) {
        return (
            <Container className="text-center py-5" style={{ marginTop: '80px' }}>
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Loading your salary details...</p>
            </Container>
        );
    }

    const allRepayments = getAllRepayments();

    return (
        <Container style={{ marginTop: '80px' }} fluid>
            <h2 className="mb-4">My Salary</h2>

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    <Alert.Heading>
                        <i className="fa-solid fa-circle-exclamation me-2"></i>
                        Error
                    </Alert.Heading>
                    <p>{error}</p>
                </Alert>
            )}

            {/* Bank Details - Only show if exists */}
            {salaryDetails && (salaryDetails.bank_name || salaryDetails.bank_account_no) && (
                <Row className="mb-4">
                    <Col md={12}>
                        <Card className="shadow-sm">
                            <Card.Header className="bg-info text-white">
                                <h5 className="mb-0">
                                    <i className="fa-solid fa-building-columns me-2"></i>
                                    Bank Details
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={3}>
                                        <strong>Bank Name:</strong> {salaryDetails.bank_name || '-'}
                                    </Col>
                                    <Col md={3}>
                                        <strong>Account No:</strong> {salaryDetails.bank_account_no || '-'}
                                    </Col>
                                    <Col md={3}>
                                        <strong>IFSC Code:</strong> {salaryDetails.ifsc_code || '-'}
                                    </Col>
                                    <Col md={3}>
                                        <strong>PAN:</strong> {salaryDetails.pan_number || '-'}
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Salary Payments History */}
            <Row className="mb-4">
                <Col md={12}>
                    <Card className="shadow-sm">
                        <Card.Header className="bg-success text-white">
                            <h5 className="mb-0">
                                <i className="fa-solid fa-clock-rotate-left me-2"></i>
                                Salary Payment History
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            <div style={{ overflowX: 'auto' }}>
                                <Table striped bordered hover responsive>
                                    <thead>
                                        <tr>
                                            <th>Month/Year</th>
                                            <th>Gross Salary</th>
                                            <th>Deductions</th>
                                            <th>Net Salary</th>
                                            <th>Payment Method</th>
                                            <th>Status</th>
                                            <th>Payment Date</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.length > 0 ? (
                                            payments.map(payment => (
                                                <tr key={payment.id}>
                                                    <td>{payment.month}/{payment.year}</td>
                                                    <td>{formatCurrency(payment.gross_salary)}</td>
                                                    <td>{formatCurrency(payment.total_deductions)}</td>
                                                    <td className="text-success">
                                                        <strong>{formatCurrency(payment.net_salary)}</strong>
                                                    </td>
                                                    <td>{payment.payment_method}</td>
                                                    <td>{getStatusBadge(payment.status)}</td>
                                                    <td>{formatDate(payment.payment_date)}</td>
                                                    <td>
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedPayment(payment);
                                                                setShowPayslipModal(true);
                                                            }}
                                                        >
                                                            <i className="fa-solid fa-eye"></i> Payslip
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="8" className="text-center py-4">
                                                    <i className="fa-solid fa-receipt fa-2x text-muted mb-2"></i>
                                                    <p className="text-muted">No salary payments found</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Advances History with Repayment Tracking */}
            <Row className="mb-4">
                <Col md={12}>
                    <Card className="shadow-sm">
                        <Card.Header className="bg-warning">
                            <h5 className="mb-0">
                                <i className="fa-solid fa-hand-holding-usd me-2"></i>
                                My Advance Requests & Repayments
                            </h5>
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
                                            <th>Remaining</th>
                                            <th>Disbursed Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {advances.length > 0 ? (
                                            advances.map(advance => {
                                                const progress = calculateRepaymentProgress(advance);
                                                return (
                                                    <tr key={advance.id}>
                                                        <td>{formatDate(advance.request_date)}</td>
                                                        <td className="text-success">
                                                            <strong>{formatCurrency(advance.amount)}</strong>
                                                        </td>
                                                        <td>{advance.reason}</td>
                                                        <td>{advance.repayment_months} months</td>
                                                        <td>{formatCurrency(advance.monthly_deduction || (advance.amount / advance.repayment_months))}</td>
                                                        <td>{getStatusBadge(advance.status)}</td>
                                                        <td style={{ minWidth: '180px' }}>
                                                            {advance.status === 'disbursed' || advance.status === 'repaid' ? (
                                                                <>
                                                                    <ProgressBar
                                                                        now={progress.percentage}
                                                                        label={`${progress.percentage.toFixed(1)}%`}
                                                                        variant={progress.percentage >= 99.9 ? 'success' : 'info'}
                                                                    />
                                                                    <small className="text-muted">
                                                                        Repaid: {formatCurrency(progress.totalRepaid)} / {formatCurrency(advance.amount)}
                                                                    </small>
                                                                </>
                                                            ) : (
                                                                <span className="text-muted">Not started</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            {advance.status === 'disbursed' || advance.status === 'repaid' ? (
                                                                <strong className={progress.remaining > 0.01 ? 'text-danger' : 'text-success'}>
                                                                    {formatCurrency(progress.remaining)}
                                                                </strong>
                                                            ) : (
                                                                <span className="text-muted">-</span>
                                                            )}
                                                        </td>
                                                        <td>{advance.disbursement_date ? formatDate(advance.disbursement_date) : '-'}</td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="9" className="text-center py-4">
                                                    <i className="fa-solid fa-hand-holding-usd fa-2x text-muted mb-2"></i>
                                                    <p className="text-muted">No advance requests found</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Repayment History */}
            {allRepayments.length > 0 && (
                <Row className="mb-4">
                    <Col md={12}>
                        <Card className="shadow-sm">
                            <Card.Header className="bg-info text-white">
                                <h5 className="mb-0">
                                    <i className="fa-solid fa-clock-rotate-left me-2"></i>
                                    Repayment History
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <div style={{ overflowX: 'auto' }}>
                                    <Table striped bordered hover responsive size="sm">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Advance Reason</th>
                                                <th>Amount</th>
                                                <th>Month/Year</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allRepayments.map((repayment, index) => {
                                                // Find the associated advance to get the reason
                                                const advance = advances.find(a => a.id === repayment.advance);
                                                return (
                                                    <tr key={index}>
                                                        <td>{formatDateTime(repayment.created_at)}</td>
                                                        <td>{advance?.reason || 'Advance Repayment'}</td>
                                                        <td className="text-success fw-bold">{formatCurrency(repayment.amount)}</td>
                                                        <td>{repayment.month}/{repayment.year}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <th colSpan="2" className="text-end">Total Repaid:</th>
                                                <th className="text-success">
                                                    {formatCurrency(allRepayments.reduce((sum, r) => sum + parseFloat(r.amount), 0))}
                                                </th>
                                                <th></th>
                                            </tr>
                                        </tfoot>
                                    </Table>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Payslip Modal */}
            <Modal show={showPayslipModal} onHide={() => setShowPayslipModal(false)} size="lg" centered>
                <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title>
                        <i className="fa-solid fa-file-lines me-2"></i>
                        Payslip - {selectedPayment?.month}/{selectedPayment?.year}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedPayment && (
                        <>
                            <Row className="mb-4">
                                <Col md={6}>
                                    <Card className="border-0 bg-light">
                                        <Card.Body>
                                            <h6>Employee Details</h6>
                                            <p><strong>Name:</strong> {selectedPayment.employee_name}</p>
                                            <p><strong>Month/Year:</strong> {selectedPayment.month}/{selectedPayment.year}</p>
                                            <p><strong>Payment Date:</strong> {formatDate(selectedPayment.payment_date)}</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card className="border-0 bg-light">
                                        <Card.Body>
                                            <h6>Payment Details</h6>
                                            <p><strong>Method:</strong> {selectedPayment.payment_method}</p>
                                            <p><strong>Status:</strong> {getStatusBadge(selectedPayment.status)}</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <Card className="border-0">
                                <Card.Body>
                                    <h6 className="mb-3">Salary Breakdown</h6>
                                    <Table striped bordered size="sm" className="align-middle">
                                        <thead className="bg-light">
                                            <tr>
                                                <th>Component</th>
                                                <th className="text-end">Amount (₹)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>Basic Pay</td>
                                                <td className="text-end">{formatCurrency(selectedPayment.basic_pay)}</td>
                                            </tr>
                                            <tr>
                                                <td>HRA</td>
                                                <td className="text-end">{formatCurrency(selectedPayment.hra)}</td>
                                            </tr>
                                            <tr>
                                                <td>Conveyance</td>
                                                <td className="text-end">{formatCurrency(selectedPayment.conveyance)}</td>
                                            </tr>
                                            <tr>
                                                <td>Medical Allowance</td>
                                                <td className="text-end">{formatCurrency(selectedPayment.medical_allowance)}</td>
                                            </tr>
                                            <tr className="fw-bold">
                                                <td>Gross Salary</td>
                                                <td className="text-end">{formatCurrency(selectedPayment.gross_salary)}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-danger">PF Deduction</td>
                                                <td className="text-end text-danger">-{formatCurrency(selectedPayment.pf_amount)}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-danger">ESI Deduction</td>
                                                <td className="text-end text-danger">-{formatCurrency(selectedPayment.esi_amount)}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-danger">Professional Tax</td>
                                                <td className="text-end text-danger">-{formatCurrency(selectedPayment.professional_tax)}</td>
                                            </tr>
                                            {selectedPayment.advance_deduction > 0 && (
                                                <tr>
                                                    <td className="text-danger">Advance Deduction</td>
                                                    <td className="text-end text-danger">-{formatCurrency(selectedPayment.advance_deduction)}</td>
                                                </tr>
                                            )}
                                            <tr className="fw-bold">
                                                <td>Total Deductions</td>
                                                <td className="text-end text-danger">-{formatCurrency(selectedPayment.total_deductions)}</td>
                                            </tr>
                                            <tr className="fw-bold bg-light">
                                                <td>Net Salary</td>
                                                <td className="text-end text-success">{formatCurrency(selectedPayment.net_salary)}</td>
                                            </tr>
                                        </tbody>
                                    </Table>

                                    {selectedPayment.notes && (
                                        <div className="mt-3 p-3 bg-light rounded">
                                            <strong>Notes:</strong> {selectedPayment.notes}
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowPayslipModal(false)}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={() => window.print()}>
                        <i className="fa-solid fa-print me-2"></i>
                        Print
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default MySalary;