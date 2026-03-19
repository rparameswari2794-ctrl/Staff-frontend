// src/pages/admin/AdminSalary.jsx
import { useState, useEffect } from 'react';
import {
    Container, Row, Col, Card, Table, Button, Form,
    Modal, Badge, Alert, Spinner, Nav, Tab, InputGroup
} from 'react-bootstrap';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { toast } from 'react-toastify';
import RazorpaySalaryPayment from '../../components/RazorpaySalaryPayment';

const AdminSalary = () => {
    const { user } = useSelector((state) => state.auth);
    const [activeTab, setActiveTab] = useState('structures');

    // State for different sections
    const [structures, setStructures] = useState([]);
    const [employeeSalaries, setEmployeeSalaries] = useState([]);
    const [payments, setPayments] = useState([]);
    const [advances, setAdvances] = useState([]);
    const [employees, setEmployees] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal states
    const [showStructureModal, setShowStructureModal] = useState(false);
    const [showEmployeeSalaryModal, setShowEmployeeSalaryModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showRazorpayModal, setShowRazorpayModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [pendingPayment, setPendingPayment] = useState(null);

    // Form states
    const [structureForm, setStructureForm] = useState({
        name: '',
        basic_pay: '',
        hra: '',
        da: '',
        conveyance: '',
        medical_allowance: '',
        special_allowance: '',
        pf_percent: '12',
        esi_percent: '0.75',
        professional_tax: '200',
        frequency: 'monthly',
        is_active: true,
        applicable_for_roles: []
    });

    const [employeeSalaryForm, setEmployeeSalaryForm] = useState({
        employee: '',
        salary_structure: '',
        effective_from: new Date().toISOString().split('T')[0],
        is_current: true,
        bank_name: '',
        bank_account_no: '',
        ifsc_code: '',
        pan_number: '',
        uan_number: ''
    });

    const [paymentForm, setPaymentForm] = useState({
        employee: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        payment_method: 'bank_transfer',
        notes: '',
        advance_deduction: ''
    });

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchAllData();
    }, [activeTab, selectedMonth, selectedYear]);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch employees first (needed for dropdowns)
            const employeesRes = await api.get('/admin/employees/');
            setEmployees(employeesRes.data.results || employeesRes.data || []);

            // Fetch data based on active tab
            switch (activeTab) {
                case 'structures':
                    const structuresRes = await api.get('/admin/salary-structures/');
                    setStructures(structuresRes.data.results || structuresRes.data || []);
                    break;
                case 'employee-salaries':
                    const empSalariesRes = await api.get('/admin/employee-salaries/');
                    setEmployeeSalaries(empSalariesRes.data.results || empSalariesRes.data || []);
                    break;
                case 'payments':
                    const paymentsRes = await api.get('/admin/salary-payments/', {
                        params: { month: selectedMonth, year: selectedYear }
                    });
                    setPayments(paymentsRes.data.results || paymentsRes.data || []);
                    break;
                case 'advances':
                    const advancesRes = await api.get('/admin/salary-advances/');
                    setAdvances(advancesRes.data.results || advancesRes.data || []);
                    break;
                default:
                    break;
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError(error.response?.data?.message || 'Failed to load data');
            setLoading(false);
        }
    };

    // Salary Structure handlers
    const handleStructureSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);

        try {
            const dataToSend = {
                ...structureForm,
                basic_pay: parseFloat(structureForm.basic_pay),
                hra: parseFloat(structureForm.hra || 0),
                da: parseFloat(structureForm.da || 0),
                conveyance: parseFloat(structureForm.conveyance || 0),
                medical_allowance: parseFloat(structureForm.medical_allowance || 0),
                special_allowance: parseFloat(structureForm.special_allowance || 0),
                pf_percent: parseFloat(structureForm.pf_percent),
                esi_percent: parseFloat(structureForm.esi_percent),
                professional_tax: parseFloat(structureForm.professional_tax),
                applicable_for_roles: structureForm.applicable_for_roles
            };

            if (editingItem) {
                await api.put(`/admin/salary-structures/${editingItem.id}/`, dataToSend);
                toast.success('Salary structure updated successfully');
            } else {
                await api.post('/admin/salary-structures/', dataToSend);
                toast.success('Salary structure created successfully');
            }

            setShowStructureModal(false);
            resetStructureForm();
            fetchAllData();
        } catch (error) {
            console.error('Error saving structure:', error);
            toast.error(error.response?.data?.message || 'Failed to save structure');
        } finally {
            setActionLoading(false);
        }
    };

    // Employee Salary handlers
    const handleEmployeeSalarySubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);

        try {
            if (editingItem) {
                await api.put(`/admin/employee-salaries/${editingItem.id}/`, employeeSalaryForm);
                toast.success('Employee salary updated successfully');
            } else {
                await api.post('/admin/employee-salaries/', employeeSalaryForm);
                toast.success('Employee salary assigned successfully');
            }

            setShowEmployeeSalaryModal(false);
            resetEmployeeSalaryForm();
            fetchAllData();
        } catch (error) {
            console.error('Error saving employee salary:', error);
            toast.error(error.response?.data?.message || 'Failed to save');
        } finally {
            setActionLoading(false);
        }
    };

    // Calculate salary for payment - FIXED VERSION
    const calculateSalaryForPayment = async () => {
        if (!paymentForm.employee) {
            toast.warning('Please select an employee');
            return null;
        }

        try {
            console.log('Calculating salary for employee:', paymentForm.employee);

            const employeeId = parseInt(paymentForm.employee);
            if (isNaN(employeeId)) {
                toast.error('Invalid employee selection');
                return null;
            }

            // Step 1: Get the employee's current salary details
            const empSalaryRes = await api.get('/admin/employee-salaries/', {
                params: {
                    employee: employeeId,
                    is_current: true
                }
            });

            const empSalaryData = empSalaryRes.data.results || empSalaryRes.data || [];
            const empSalary = empSalaryData.length > 0 ? empSalaryData[0] : null;

            if (!empSalary) {
                toast.error('No active salary structure found for this employee');
                return null;
            }

            console.log('Employee salary details:', empSalary);

            // Step 2: Get the full salary structure
            const structureRes = await api.get(`/admin/salary-structures/${empSalary.salary_structure}/`);
            const structure = structureRes.data;

            console.log('Salary structure:', structure);

            // Step 3: Calculate all salary components with proper defaults
            const basicPay = parseFloat(empSalary.custom_basic_pay || structure.basic_pay) || 0;
            const hra = parseFloat(empSalary.custom_hra || structure.hra || 0) || 0;
            const da = parseFloat(empSalary.custom_da || structure.da || 0) || 0;
            const conveyance = parseFloat(structure.conveyance || 0) || 0;
            const medicalAllowance = parseFloat(structure.medical_allowance || 0) || 0;
            const specialAllowance = parseFloat(structure.special_allowance || 0) || 0;

            // Calculate gross salary
            const grossSalary = basicPay + hra + da + conveyance + medicalAllowance + specialAllowance;

            // Calculate deductions
            const pfPercent = parseFloat(structure.pf_percent) || 12;
            const esiPercent = parseFloat(structure.esi_percent) || 0.75;

            const pfAmount = basicPay * (pfPercent / 100);
            const esiAmount = grossSalary * (esiPercent / 100);
            const professionalTax = parseFloat(structure.professional_tax || 200) || 0;

            // FIXED: Handle advance deduction properly - respect manual input including 0
            let advanceDeduction = 0;

            // Check if user has entered ANY value in the advance deduction field
            // This includes '0' as a valid manual entry
            if (paymentForm.advance_deduction !== undefined &&
                paymentForm.advance_deduction !== null &&
                paymentForm.advance_deduction !== '') {

                // User has entered a value (could be 0 or any number)
                advanceDeduction = parseFloat(paymentForm.advance_deduction) || 0;
                console.log('Using MANUAL advance deduction:', advanceDeduction);

            } else {
                // No manual input, try to calculate from active advances
                console.log('No manual advance deduction entered, checking active advances');
                try {
                    const advancesRes = await api.get('/admin/salary-advances/', {
                        params: {
                            employee: employeeId,
                            status: 'disbursed'
                        }
                    });
                    const activeAdvances = advancesRes.data.results || advancesRes.data || [];

                    // Calculate total monthly advance deduction
                    advanceDeduction = activeAdvances.reduce((sum, adv) => {
                        return sum + (parseFloat(adv.monthly_deduction) || 0);
                    }, 0);

                    console.log('AUTO-calculated advance deductions from active advances:', advanceDeduction);
                } catch (err) {
                    console.log('Error fetching advances:', err);
                    // Continue with zero advance deduction
                }
            }

            const totalDeductions = pfAmount + esiAmount + professionalTax + advanceDeduction;

            // Calculate net salary (ensure it's not negative)
            const netSalary = Math.max(0, grossSalary - totalDeductions);

            // Calculate employer contributions
            const employerPf = basicPay * 0.13; // 13% of basic
            const employerEsi = grossSalary * 0.0325; // 3.25% of gross
            const totalCtc = grossSalary + employerPf + employerEsi;

            // Get employee details for name
            const employee = employees.find(e => e.id === employeeId);

            // Prepare payment data
            const paymentData = {
                employee: employeeId,
                employee_name: employee?.full_name || '',
                salary_structure: structure.id,

                // Salary components
                basic_pay: basicPay,
                hra: hra,
                da: da,
                conveyance: conveyance,
                medical_allowance: medicalAllowance,
                special_allowance: specialAllowance,
                gross_salary: grossSalary,

                // Deductions
                pf_amount: pfAmount,
                esi_amount: esiAmount,
                professional_tax: professionalTax,
                advance_deduction: advanceDeduction, // This will now respect user input including 0
                other_deductions: 0,
                total_deductions: totalDeductions,

                // Employer contributions
                employer_pf: employerPf,
                employer_esi: employerEsi,
                total_ctc: totalCtc,

                // Net salary
                net_salary: netSalary,

                // Payment details
                payment_date: new Date().toISOString().split('T')[0],
                month: parseInt(paymentForm.month) || new Date().getMonth() + 1,
                year: parseInt(paymentForm.year) || new Date().getFullYear(),
                payment_method: paymentForm.payment_method || 'bank_transfer',
                notes: paymentForm.notes || ''
            };

            console.log('Calculated payment data:', paymentData);
            return paymentData;

        } catch (error) {
            console.error('Error calculating salary:', error);
            toast.error('Failed to calculate salary: ' + (error.response?.data?.message || error.message));
            return null;
        }
    };

    // Handle payment with Razorpay
    const handleRazorpayPayment = async () => {
        if (!paymentForm.employee) {
            toast.warning('Please select an employee');
            return;
        }

        setActionLoading(true);

        try {
            // Calculate the payment data first
            const paymentData = await calculateSalaryForPayment();

            if (!paymentData) {
                setActionLoading(false);
                return;
            }

            // Set pending payment and show Razorpay modal
            setPendingPayment(paymentData);
            setShowRazorpayModal(true);
            setActionLoading(false);

        } catch (error) {
            console.error('Error preparing payment:', error);
            toast.error('Failed to prepare payment');
            setActionLoading(false);
        }
    };

    // Handle payment success from Razorpay
    const handlePaymentSuccess = async (paymentResponse, completedPayment) => {
        try {
            setActionLoading(true);

            console.log('Payment successful:', paymentResponse);
            console.log('Completed payment data:', completedPayment);

            // First, validate that we have all required data
            if (!completedPayment || !completedPayment.employee) {
                toast.error('Invalid payment data: Missing employee information');
                setActionLoading(false);
                return;
            }

            // Ensure employee is a number
            const employeeId = parseInt(completedPayment.employee);
            if (isNaN(employeeId)) {
                toast.error('Invalid employee ID');
                setActionLoading(false);
                return;
            }

            // Prepare the payment data with proper validation
            const paymentData = {
                employee: employeeId,

                // Salary components - ensure all are numbers with defaults
                basic_pay: parseFloat(completedPayment.basic_pay) || 0,
                hra: parseFloat(completedPayment.hra) || 0,
                da: parseFloat(completedPayment.da) || 0,
                conveyance: parseFloat(completedPayment.conveyance) || 0,
                medical_allowance: parseFloat(completedPayment.medical_allowance) || 0,
                special_allowance: parseFloat(completedPayment.special_allowance) || 0,
                gross_salary: parseFloat(completedPayment.gross_salary) || 0,

                // Deductions
                pf_amount: parseFloat(completedPayment.pf_amount) || 0,
                esi_amount: parseFloat(completedPayment.esi_amount) || 0,
                professional_tax: parseFloat(completedPayment.professional_tax) || 0,
                advance_deduction: parseFloat(completedPayment.advance_deduction) || 0,
                other_deductions: parseFloat(completedPayment.other_deductions) || 0,
                total_deductions: parseFloat(completedPayment.total_deductions) || 0,

                // Employer contributions
                employer_pf: parseFloat(completedPayment.employer_pf) || 0,
                employer_esi: parseFloat(completedPayment.employer_esi) || 0,
                total_ctc: parseFloat(completedPayment.total_ctc) || 0,

                // Net salary
                net_salary: parseFloat(completedPayment.net_salary) || 0,

                // Payment details
                payment_date: completedPayment.payment_date || new Date().toISOString().split('T')[0],
                month: parseInt(completedPayment.month) || new Date().getMonth() + 1,
                year: parseInt(completedPayment.year) || new Date().getFullYear(),
                payment_method: completedPayment.payment_method || 'razorpay',
                notes: completedPayment.notes || '',

                // Razorpay specific fields
                razorpay_payment_id: paymentResponse?.razorpay_payment_id,
                razorpay_order_id: paymentResponse?.razorpay_order_id,
                razorpay_signature: paymentResponse?.razorpay_signature,

                // Status
                status: 'completed'
            };

            // Validate required fields
            const requiredFields = [
                'employee', 'basic_pay', 'gross_salary', 'net_salary',
                'month', 'year', 'payment_method'
            ];

            const missingFields = requiredFields.filter(field => !paymentData[field] && paymentData[field] !== 0);
            if (missingFields.length > 0) {
                console.error('Missing required fields:', missingFields);
                toast.error(`Missing required fields: ${missingFields.join(', ')}`);
                setActionLoading(false);
                return;
            }

            // Validate that critical numeric fields are positive
            if (paymentData.basic_pay <= 0) {
                toast.error('Basic pay must be greater than 0');
                setActionLoading(false);
                return;
            }

            if (paymentData.net_salary <= 0) {
                toast.error('Net salary must be greater than 0');
                setActionLoading(false);
                return;
            }

            console.log('Sending payment data to backend:', paymentData);

            // Save the payment to backend with proper error handling
            const response = await api.post('/admin/salary-payments/', paymentData);
            const savedPayment = response.data;

            console.log('Payment saved successfully:', savedPayment);
            toast.success('Salary payment processed successfully via Razorpay');

            // Close modals and reset state
            setShowRazorpayModal(false);
            setShowPaymentModal(false);
            setPendingPayment(null);
            resetPaymentForm();

            // Refresh data
            await fetchAllData();

        } catch (error) {
            console.error('Error saving payment:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);

            // Handle different error scenarios
            if (error.response?.status === 400) {
                // Validation error from backend
                const errorData = error.response.data;

                if (typeof errorData === 'object') {
                    // Display each validation error
                    Object.keys(errorData).forEach(key => {
                        const errorMessage = Array.isArray(errorData[key])
                            ? errorData[key][0]
                            : errorData[key];

                        // Format the field name for better readability
                        const formattedKey = key.split('_').map(word =>
                            word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ');

                        toast.error(`${formattedKey}: ${errorMessage}`);
                    });
                } else {
                    toast.error(errorData || 'Failed to save payment record');
                }
            } else if (error.response?.status === 401) {
                toast.error('Unauthorized. Please login again.');
            } else if (error.response?.status === 403) {
                toast.error('You do not have permission to perform this action.');
            } else if (error.response?.status === 500) {
                toast.error('Server error. Please try again later.');
            } else {
                toast.error('Payment completed but failed to save record. Please contact support.');
            }

            // Log the complete error for debugging
            console.error('Full error object:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                headers: error.response?.headers
            });

        } finally {
            setActionLoading(false);
        }
    };

    // Handle bank transfer (non-Razorpay)
    const handleBankTransfer = async () => {
        if (!paymentForm.employee) {
            toast.warning('Please select an employee');
            return;
        }

        setActionLoading(true);

        try {
            const paymentData = await calculateSalaryForPayment();

            if (!paymentData) {
                setActionLoading(false);
                return;
            }

            // Save directly without Razorpay
            const response = await api.post('/admin/salary-payments/', {
                ...paymentData,
                status: 'completed'
            });

            console.log('Payment saved:', response.data);
            toast.success('Salary payment processed successfully');

            setShowPaymentModal(false);
            resetPaymentForm();
            fetchAllData();

        } catch (error) {
            console.error('Error processing payment:', error);
            toast.error('Failed to process payment');
        } finally {
            setActionLoading(false);
        }
    };

    // Handle process payment based on method
    const handleProcessPayment = () => {
        if (paymentForm.payment_method === 'razorpay') {
            handleRazorpayPayment();
        } else {
            handleBankTransfer();
        }
    };

    // Reset forms
    const resetStructureForm = () => {
        setStructureForm({
            name: '',
            basic_pay: '',
            hra: '',
            da: '',
            conveyance: '',
            medical_allowance: '',
            special_allowance: '',
            pf_percent: '12',
            esi_percent: '0.75',
            professional_tax: '200',
            frequency: 'monthly',
            is_active: true,
            applicable_for_roles: []
        });
        setEditingItem(null);
    };

    const resetEmployeeSalaryForm = () => {
        setEmployeeSalaryForm({
            employee: '',
            salary_structure: '',
            effective_from: new Date().toISOString().split('T')[0],
            is_current: true,
            bank_name: '',
            bank_account_no: '',
            ifsc_code: '',
            pan_number: '',
            uan_number: ''
        });
        setEditingItem(null);
    };

    const resetPaymentForm = () => {
        setPaymentForm({
            employee: '',
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            payment_method: 'bank_transfer',
            notes: '',
            advance_deduction: ''
        });
    };

    // Utility functions
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
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
            'processing': 'info',
            'completed': 'success',
            'failed': 'danger',
            'cancelled': 'secondary'
        };
        return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
    };

    if (loading && !structures.length && !employeeSalaries.length) {
        return (
            <Container className="text-center py-5" style={{ marginTop: '80px' }}>
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Loading salary data...</p>
            </Container>
        );
    }

    return (
        <Container style={{ marginTop: '80px' }} fluid>
            <h2 className="mb-4">Salary Management</h2>
            <p className="text-muted mb-4">Manage employee salaries, structures, and payments</p>

            {error && (
                <Alert variant="danger" className="mb-4">
                    <Alert.Heading>
                        <i className="fa-solid fa-circle-exclamation me-2"></i>
                        Error
                    </Alert.Heading>
                    <p>{error}</p>
                    <hr />
                    <div className="d-flex justify-content-end">
                        <Button variant="outline-danger" onClick={fetchAllData}>
                            <i className="fa-solid fa-rotate-right me-2"></i>
                            Retry
                        </Button>
                    </div>
                </Alert>
            )}

            {/* Tabs */}
            <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                <Nav variant="tabs" className="mb-4">
                    <Nav.Item>
                        <Nav.Link eventKey="structures">
                            <i className="fa-solid fa-layer-group me-2"></i>
                            Salary Structures
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="employee-salaries">
                            <i className="fa-solid fa-user-tie me-2"></i>
                            Employee Salaries
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="payments">
                            <i className="fa-solid fa-money-bill-wave me-2"></i>
                            Salary Payments
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="advances">
                            <i className="fa-solid fa-hand-holding-usd me-2"></i>
                            Advance Requests
                        </Nav.Link>
                    </Nav.Item>
                </Nav>

                <Tab.Content>
                    {/* Salary Structures Tab */}
                    <Tab.Pane eventKey="structures">
                        <Card className="shadow-sm">
                            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">
                                    <i className="fa-solid fa-layer-group me-2"></i>
                                    Salary Structures
                                </h5>
                                <Button
                                    variant="light"
                                    size="sm"
                                    onClick={() => {
                                        resetStructureForm();
                                        setShowStructureModal(true);
                                    }}
                                >
                                    <i className="fa-solid fa-plus me-2"></i>
                                    Add Structure
                                </Button>
                            </Card.Header>
                            <Card.Body>
                                <div style={{ overflowX: 'auto' }}>
                                    <Table striped bordered hover responsive>
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Basic Pay</th>
                                                <th>Gross Salary</th>
                                                <th>Deductions</th>
                                                <th>Net Salary</th>
                                                <th>CTC</th>
                                                <th>Frequency</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {structures.map(structure => (
                                                <tr key={structure.id}>
                                                    <td><strong>{structure.name}</strong></td>
                                                    <td>{formatCurrency(structure.basic_pay)}</td>
                                                    <td>{formatCurrency(structure.gross_salary)}</td>
                                                    <td>{formatCurrency(structure.total_deductions)}</td>
                                                    <td className="text-success">
                                                        <strong>{formatCurrency(structure.net_salary)}</strong>
                                                    </td>
                                                    <td className="text-info">{formatCurrency(structure.total_ctc)}</td>
                                                    <td>{structure.frequency}</td>
                                                    <td>
                                                        {structure.is_active ?
                                                            <Badge bg="success">Active</Badge> :
                                                            <Badge bg="secondary">Inactive</Badge>
                                                        }
                                                    </td>
                                                    <td>
                                                        <Button
                                                            variant="outline-warning"
                                                            size="sm"
                                                            onClick={() => {
                                                                setStructureForm(structure);
                                                                setEditingItem(structure);
                                                                setShowStructureModal(true);
                                                            }}
                                                            className="me-1"
                                                        >
                                                            <i className="fa-solid fa-edit"></i>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {structures.length === 0 && (
                                                <tr>
                                                    <td colSpan="9" className="text-center">
                                                        No salary structures found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </Card.Body>
                        </Card>
                    </Tab.Pane>

                    {/* Employee Salaries Tab */}
                    <Tab.Pane eventKey="employee-salaries">
                        <Card className="shadow-sm">
                            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">
                                    <i className="fa-solid fa-user-tie me-2"></i>
                                    Employee Salaries
                                </h5>
                                <Button
                                    variant="light"
                                    size="sm"
                                    onClick={() => {
                                        resetEmployeeSalaryForm();
                                        setShowEmployeeSalaryModal(true);
                                    }}
                                >
                                    <i className="fa-solid fa-plus me-2"></i>
                                    Assign Salary
                                </Button>
                            </Card.Header>
                            <Card.Body>
                                <div style={{ overflowX: 'auto' }}>
                                    <Table striped bordered hover responsive>
                                        <thead>
                                            <tr>
                                                <th>Employee</th>
                                                <th>Structure</th>
                                                <th>Effective From</th>
                                                <th>Bank Account</th>
                                                <th>IFSC</th>
                                                <th>PAN</th>
                                                <th>UAN</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {employeeSalaries.map(empSal => (
                                                <tr key={empSal.id}>
                                                    <td>
                                                        <strong>{empSal.employee_name}</strong>
                                                        <div className="text-muted small">{empSal.employee_id}</div>
                                                    </td>
                                                    <td>{empSal.salary_structure_name}</td>
                                                    <td>{formatDate(empSal.effective_from)}</td>
                                                    <td>{empSal.bank_account_no || '-'}</td>
                                                    <td>{empSal.ifsc_code || '-'}</td>
                                                    <td>{empSal.pan_number || '-'}</td>
                                                    <td>{empSal.uan_number || '-'}</td>
                                                    <td>
                                                        {empSal.is_current ?
                                                            <Badge bg="success">Current</Badge> :
                                                            <Badge bg="secondary">Inactive</Badge>
                                                        }
                                                    </td>
                                                    <td>
                                                        <Button
                                                            variant="outline-warning"
                                                            size="sm"
                                                            onClick={() => {
                                                                setEmployeeSalaryForm(empSal);
                                                                setEditingItem(empSal);
                                                                setShowEmployeeSalaryModal(true);
                                                            }}
                                                        >
                                                            <i className="fa-solid fa-edit"></i>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {employeeSalaries.length === 0 && (
                                                <tr>
                                                    <td colSpan="9" className="text-center">
                                                        No employee salary assignments found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </Card.Body>
                        </Card>
                    </Tab.Pane>

                    {/* Salary Payments Tab */}
                    <Tab.Pane eventKey="payments">
                        <Card className="shadow-sm">
                            <Card.Header className="bg-primary text-white">
                                <Row>
                                    <Col md={6}>
                                        <h5 className="mb-0">
                                            <i className="fa-solid fa-money-bill-wave me-2"></i>
                                            Salary Payments
                                        </h5>
                                    </Col>
                                    <Col md={6}>
                                        <div className="d-flex justify-content-end gap-2">
                                            <Form.Select
                                                size="sm"
                                                style={{ width: '100px' }}
                                                value={selectedMonth}
                                                onChange={(e) => setSelectedMonth(e.target.value)}
                                            >
                                                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                                    <option key={month} value={month}>
                                                        {new Date(2000, month - 1, 1).toLocaleString('default', { month: 'short' })}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                            <Form.Select
                                                size="sm"
                                                style={{ width: '100px' }}
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(e.target.value)}
                                            >
                                                {[2024, 2025, 2026].map(year => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))}
                                            </Form.Select>
                                            <Button
                                                variant="light"
                                                size="sm"
                                                onClick={() => setShowPaymentModal(true)}
                                            >
                                                <i className="fa-solid fa-plus me-2"></i>
                                                Process Payment
                                            </Button>
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Header>
                            <Card.Body>
                                <div style={{ overflowX: 'auto' }}>
                                    <Table striped bordered hover responsive>
                                        <thead>
                                            <tr>
                                                <th>Employee</th>
                                                <th>Month/Year</th>
                                                <th>Gross Salary</th>
                                                <th>Deductions</th>
                                                <th>Net Salary</th>
                                                <th>Payment Method</th>
                                                <th>Status</th>
                                                <th>Payment Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payments.length > 0 ? (
                                                payments.map(payment => (
                                                    <tr key={payment.id}>
                                                        <td>
                                                            <strong>{payment.employee_name}</strong>
                                                        </td>
                                                        <td>{payment.month}/{payment.year}</td>
                                                        <td>{formatCurrency(payment.gross_salary)}</td>
                                                        <td>{formatCurrency(payment.total_deductions)}</td>
                                                        <td className="text-success">
                                                            <strong>{formatCurrency(payment.net_salary)}</strong>
                                                        </td>
                                                        <td>{payment.payment_method}</td>
                                                        <td>{getStatusBadge(payment.status)}</td>
                                                        <td>{formatDate(payment.payment_date)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="8" className="text-center">
                                                        No salary payments found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </Card.Body>
                        </Card>
                    </Tab.Pane>

                    {/* Advance Requests Tab */}
                    <Tab.Pane eventKey="advances">
                        <Card className="shadow-sm">
                            <Card.Header className="bg-primary text-white">
                                <h5 className="mb-0">
                                    <i className="fa-solid fa-hand-holding-usd me-2"></i>
                                    Advance Requests
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
                                                <th>Approved By</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {advances.map(advance => (
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
                                                    <td>{advance.approved_by_username || '-'}</td>
                                                    <td>
                                                        <Button
                                                            variant="outline-info"
                                                            size="sm"
                                                            onClick={() => {
                                                                // View details
                                                            }}
                                                        >
                                                            <i className="fa-solid fa-eye"></i>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {advances.length === 0 && (
                                                <tr>
                                                    <td colSpan="8" className="text-center">
                                                        No advance requests found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </Card.Body>
                        </Card>
                    </Tab.Pane>
                </Tab.Content>
            </Tab.Container>

            {/* Salary Structure Modal */}
            <Modal show={showStructureModal} onHide={() => setShowStructureModal(false)} size="lg">
                <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title>
                        <i className="fa-solid fa-layer-group me-2"></i>
                        {editingItem ? 'Edit Salary Structure' : 'Add Salary Structure'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleStructureSubmit}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Structure Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={structureForm.name}
                                        onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })}
                                        placeholder="e.g., Staff Grade 1"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Frequency</Form.Label>
                                    <Form.Select
                                        value={structureForm.frequency}
                                        onChange={(e) => setStructureForm({ ...structureForm, frequency: e.target.value })}
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="daily">Daily</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <h6 className="mt-3">Salary Components</h6>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Basic Pay</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>₹</InputGroup.Text>
                                        <Form.Control
                                            type="number"
                                            value={structureForm.basic_pay}
                                            onChange={(e) => setStructureForm({ ...structureForm, basic_pay: e.target.value })}
                                            required
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>HRA</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>₹</InputGroup.Text>
                                        <Form.Control
                                            type="number"
                                            value={structureForm.hra}
                                            onChange={(e) => setStructureForm({ ...structureForm, hra: e.target.value })}
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>DA</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>₹</InputGroup.Text>
                                        <Form.Control
                                            type="number"
                                            value={structureForm.da}
                                            onChange={(e) => setStructureForm({ ...structureForm, da: e.target.value })}
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Conveyance</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>₹</InputGroup.Text>
                                        <Form.Control
                                            type="number"
                                            value={structureForm.conveyance}
                                            onChange={(e) => setStructureForm({ ...structureForm, conveyance: e.target.value })}
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Medical Allowance</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>₹</InputGroup.Text>
                                        <Form.Control
                                            type="number"
                                            value={structureForm.medical_allowance}
                                            onChange={(e) => setStructureForm({ ...structureForm, medical_allowance: e.target.value })}
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Special Allowance</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>₹</InputGroup.Text>
                                        <Form.Control
                                            type="number"
                                            value={structureForm.special_allowance}
                                            onChange={(e) => setStructureForm({ ...structureForm, special_allowance: e.target.value })}
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                        </Row>

                        <h6 className="mt-3">Deductions</h6>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>PF (%)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        value={structureForm.pf_percent}
                                        onChange={(e) => setStructureForm({ ...structureForm, pf_percent: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>ESI (%)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        value={structureForm.esi_percent}
                                        onChange={(e) => setStructureForm({ ...structureForm, esi_percent: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Professional Tax (₹)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={structureForm.professional_tax}
                                        onChange={(e) => setStructureForm({ ...structureForm, professional_tax: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="Active"
                                checked={structureForm.is_active}
                                onChange={(e) => setStructureForm({ ...structureForm, is_active: e.target.checked })}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowStructureModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={actionLoading}>
                            {actionLoading ? <Spinner size="sm" /> : (editingItem ? 'Update' : 'Create')}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Employee Salary Modal */}
            <Modal show={showEmployeeSalaryModal} onHide={() => setShowEmployeeSalaryModal(false)} size="lg">
                <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title>
                        <i className="fa-solid fa-user-tie me-2"></i>
                        {editingItem ? 'Edit Employee Salary' : 'Assign Salary to Employee'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEmployeeSalarySubmit}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Employee</Form.Label>
                                    <Form.Select
                                        value={employeeSalaryForm.employee}
                                        onChange={(e) => setEmployeeSalaryForm({ ...employeeSalaryForm, employee: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Employee</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.full_name} ({emp.employee_id})
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Salary Structure</Form.Label>
                                    <Form.Select
                                        value={employeeSalaryForm.salary_structure}
                                        onChange={(e) => setEmployeeSalaryForm({ ...employeeSalaryForm, salary_structure: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Structure</option>
                                        {structures.map(struct => (
                                            <option key={struct.id} value={struct.id}>
                                                {struct.name} - {formatCurrency(struct.net_salary)}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Effective From</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={employeeSalaryForm.effective_from}
                                        onChange={(e) => setEmployeeSalaryForm({ ...employeeSalaryForm, effective_from: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Check
                                        type="checkbox"
                                        label="Current Salary"
                                        checked={employeeSalaryForm.is_current}
                                        onChange={(e) => setEmployeeSalaryForm({ ...employeeSalaryForm, is_current: e.target.checked })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <h6 className="mt-3">Bank Details</h6>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Bank Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={employeeSalaryForm.bank_name}
                                        onChange={(e) => setEmployeeSalaryForm({ ...employeeSalaryForm, bank_name: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Account Number</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={employeeSalaryForm.bank_account_no}
                                        onChange={(e) => setEmployeeSalaryForm({ ...employeeSalaryForm, bank_account_no: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>IFSC Code</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={employeeSalaryForm.ifsc_code}
                                        onChange={(e) => setEmployeeSalaryForm({ ...employeeSalaryForm, ifsc_code: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>PAN Number</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={employeeSalaryForm.pan_number}
                                        onChange={(e) => setEmployeeSalaryForm({ ...employeeSalaryForm, pan_number: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>UAN Number</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={employeeSalaryForm.uan_number}
                                        onChange={(e) => setEmployeeSalaryForm({ ...employeeSalaryForm, uan_number: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEmployeeSalaryModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={actionLoading}>
                            {actionLoading ? <Spinner size="sm" /> : (editingItem ? 'Update' : 'Assign')}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Payment Modal */}
            <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)}>
                <Modal.Header closeButton className="bg-success text-white">
                    <Modal.Title>
                        <i className="fa-solid fa-money-bill-wave me-2"></i>
                        Process Salary Payment
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Employee</Form.Label>
                        <Form.Select
                            value={paymentForm.employee}
                            onChange={(e) => setPaymentForm({ ...paymentForm, employee: e.target.value })}
                            required
                        >
                            <option value="">Select Employee</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.full_name} ({emp.employee_id})
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Month</Form.Label>
                                <Form.Select
                                    value={paymentForm.month}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, month: e.target.value })}
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
                                    value={paymentForm.year}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, year: e.target.value })}
                                >
                                    {[2024, 2025, 2026].map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* Add Advance Deduction Field - UPDATED */}
                    <Form.Group className="mb-3">
                        <Form.Label>
                            <i className="fa-solid fa-hand-holding-usd me-2 text-warning"></i>
                            Advance Deduction (₹)
                        </Form.Label>
                        <Form.Control
                            type="number"
                            step="0.01"
                            min="0"
                            value={paymentForm.advance_deduction === '' ? '' : paymentForm.advance_deduction}
                            onChange={(e) => {
                                const value = e.target.value;
                                // Allow empty string or valid numbers
                                setPaymentForm({
                                    ...paymentForm,
                                    advance_deduction: value === '' ? '' : value
                                });
                            }}
                            placeholder="Enter 0 for no deduction, or leave empty to auto-calculate"
                        />
                        <Form.Text className="text-muted">
                            <i className="fa-solid fa-info-circle me-1"></i>
                            Enter 0 for no deduction, or leave empty to auto-calculate from active advances
                        </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Payment Method</Form.Label>
                        <Form.Select
                            value={paymentForm.payment_method}
                            onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                        >
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="cash">Cash</option>
                            <option value="cheque">Cheque</option>
                            <option value="razorpay">Razorpay</option>
                        </Form.Select>
                        {paymentForm.payment_method === 'razorpay' && (
                            <Form.Text className="text-muted">
                                You will be redirected to Razorpay to complete the payment.
                            </Form.Text>
                        )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Notes</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={paymentForm.notes}
                            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                            placeholder="Additional notes..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="success" onClick={handleProcessPayment} disabled={actionLoading}>
                        {actionLoading ? <Spinner size="sm" /> : 'Process Payment'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Razorpay Salary Payment Modal */}
            {pendingPayment && (
                <RazorpaySalaryPayment
                    show={showRazorpayModal}
                    onHide={() => {
                        setShowRazorpayModal(false);
                        setPendingPayment(null);
                    }}
                    paymentData={pendingPayment}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </Container>
    );
};

export default AdminSalary;