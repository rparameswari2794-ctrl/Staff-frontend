// src/components/RazorpaySalaryPayment.jsx
import { useState, useEffect } from 'react';
import {
  Modal, Button, Spinner, Alert,
  Card, Row, Col, Table
} from 'react-bootstrap';
import {
  getRazorpayKey,
  createOrder,
  initializePayment,
  verifyPayment
} from '../services/razorpayService';
import { toast } from 'react-toastify';

const RazorpaySalaryPayment = ({ show, onHide, paymentData, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [keyId, setKeyId] = useState('');

  useEffect(() => {
    if (show) {
      loadRazorpayKey();
    }
  }, [show]);

  const loadRazorpayKey = async () => {
    try {
      const key = await getRazorpayKey();
      setKeyId(key);
    } catch (error) {
      setError('Failed to load payment gateway');
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      // Log the payment data for debugging
      console.log('Payment Data:', paymentData);
      
      // Ensure net_salary is a valid number
      const amountToPay = parseFloat(paymentData?.net_salary) || 0;
      
      if (amountToPay <= 0) {
        setError('Invalid payment amount');
        setLoading(false);
        return;
      }

      // Get employee name
      const employeeName = paymentData?.employee_name || 'Employee';

      // 1. Create order on backend with the net salary amount
      const orderData = await createOrder(amountToPay, {
        payment_type: 'salary',
        employee_id: paymentData?.employee,
        employee_name: employeeName,
        month: paymentData?.month,
        year: paymentData?.year,
        gross_salary: paymentData?.gross_salary,
        net_salary: paymentData?.net_salary
      });

      console.log('Order created:', orderData);

      // 2. Initialize payment
      await initializePayment({
        amount: orderData.amount,
        orderId: orderData.order_id,
        keyId: keyId,
        name: 'Fresh Super Market',
        description: `Salary Payment - ${employeeName} (${paymentData?.month}/${paymentData?.year})`,
        prefill: {
          name: employeeName,
          contact: '',
          email: ''
        },
        notes: {
          employee_id: paymentData?.employee,
          employee_name: employeeName,
          month: paymentData?.month,
          year: paymentData?.year,
          amount: amountToPay
        },
        callback: async (paymentResponse) => {
          if (paymentResponse.success) {
            try {
              // 3. Verify payment on backend
              const verifyResult = await verifyPayment({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature
              });

              if (verifyResult.success) {
                toast.success('Payment successful!');
                
                // Add Razorpay details to payment data
                const completedPayment = {
                  ...paymentData,
                  razorpay_order_id: paymentResponse.razorpay_order_id,
                  razorpay_payment_id: paymentResponse.razorpay_payment_id,
                  razorpay_signature: paymentResponse.razorpay_signature,
                  status: 'completed'
                };
                
                onSuccess?.(paymentResponse, completedPayment);
                onHide();
              } else {
                setError('Payment verification failed');
              }
            } catch (err) {
              console.error('Verification error:', err);
              setError('Payment verification failed');
            }
          } else {
            setError(paymentResponse.error || 'Payment failed');
          }
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.response?.data?.error || 'Payment initialization failed');
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

  // If no payment data, show error
  if (!paymentData) {
    return (
      <Modal show={show} onHide={onHide} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Error</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">No payment data available</Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  // Safely extract values with defaults
  const employeeName = paymentData.employee_name || 'N/A';
  const month = paymentData.month || '-';
  const year = paymentData.year || '-';
  
  const basicPay = parseFloat(paymentData.basic_pay) || 0;
  const hra = parseFloat(paymentData.hra) || 0;
  const conveyance = parseFloat(paymentData.conveyance) || 0;
  const medicalAllowance = parseFloat(paymentData.medical_allowance) || 0;
  const grossSalary = parseFloat(paymentData.gross_salary) || 0;
  
  const pfAmount = parseFloat(paymentData.pf_amount) || 0;
  const esiAmount = parseFloat(paymentData.esi_amount) || 0;
  const professionalTax = parseFloat(paymentData.professional_tax) || 0;
  const advanceDeduction = parseFloat(paymentData.advance_deduction) || 0;
  
  const standardDeductions = pfAmount + esiAmount + professionalTax;
  const totalDeductions = standardDeductions + advanceDeduction;
  const netSalary = parseFloat(paymentData.net_salary) || 0;
  
  const employerPf = parseFloat(paymentData.employer_pf) || 0;
  const employerEsi = parseFloat(paymentData.employer_esi) || 0;
  const totalCtc = parseFloat(paymentData.total_ctc) || 0;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-success text-white">
        <Modal.Title>
          <i className="fa-solid fa-credit-card me-2"></i>
          Salary Payment
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        {/* Employee Summary Card */}
        <Card className="border-success mb-4">
          <Card.Body>
            <Row>
              <Col md={6}>
                <h6>Employee Details</h6>
                <p className="mb-1"><strong>Name:</strong> {employeeName}</p>
                <p className="mb-1"><strong>Month/Year:</strong> {month}/{year}</p>
              </Col>
              <Col md={6}>
                <h6>Payment Summary</h6>
                <p className="mb-1"><strong>Gross Salary:</strong> {formatCurrency(grossSalary)}</p>
                <p className="mb-1"><strong>Total Deductions:</strong> <span className="text-danger">{formatCurrency(totalDeductions)}</span></p>
                <h4 className="text-success mt-2">{formatCurrency(netSalary)}</h4>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Salary Breakdown Table */}
        <Card className="border-info mb-4">
          <Card.Header className="bg-info text-white">
            <h6 className="mb-0">Salary Breakdown</h6>
          </Card.Header>
          <Card.Body>
            <Table striped bordered hover size="sm">
              <thead className="bg-light">
                <tr>
                  <th style={{ width: '70%' }}>Component</th>
                  <th className="text-end">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-light">
                  <td colSpan="2"><strong>EARNINGS</strong></td>
                </tr>
                <tr>
                  <td>Basic Pay</td>
                  <td className="text-end">{formatCurrency(basicPay)}</td>
                </tr>
                <tr>
                  <td>House Rent Allowance (HRA)</td>
                  <td className="text-end">{formatCurrency(hra)}</td>
                </tr>
                <tr>
                  <td>Conveyance Allowance</td>
                  <td className="text-end">{formatCurrency(conveyance)}</td>
                </tr>
                <tr>
                  <td>Medical Allowance</td>
                  <td className="text-end">{formatCurrency(medicalAllowance)}</td>
                </tr>
                <tr className="fw-bold">
                  <td>Gross Salary</td>
                  <td className="text-end">{formatCurrency(grossSalary)}</td>
                </tr>
                
                <tr className="bg-light">
                  <td colSpan="2"><strong>DEDUCTIONS</strong></td>
                </tr>
                <tr>
                  <td>Provident Fund (PF) - 12% of Basic</td>
                  <td className="text-end text-danger">- {formatCurrency(pfAmount)}</td>
                </tr>
                <tr>
                  <td>ESI - 0.75% of Gross</td>
                  <td className="text-end text-danger">- {formatCurrency(esiAmount)}</td>
                </tr>
                <tr>
                  <td>Professional Tax</td>
                  <td className="text-end text-danger">- {formatCurrency(professionalTax)}</td>
                </tr>
                
                {/* Advance Deduction Section - Highlighted */}
                {advanceDeduction > 0 && (
                  <tr className="table-warning">
                    <td>
                      <strong>
                        <i className="fa-solid fa-hand-holding-usd me-2"></i>
                        Salary Advance Repayment
                      </strong>
                      <br />
                      <small className="text-muted">Monthly deduction for advance taken</small>
                    </td>
                    <td className="text-end text-danger fw-bold">
                      - {formatCurrency(advanceDeduction)}
                    </td>
                  </tr>
                )}
                
                <tr className="fw-bold">
                  <td>Total Deductions</td>
                  <td className="text-end text-danger">- {formatCurrency(totalDeductions)}</td>
                </tr>
                
                <tr className="fw-bold bg-light">
                  <td className="fs-6">NET SALARY (TAKE HOME)</td>
                  <td className="text-end text-success fs-5">{formatCurrency(netSalary)}</td>
                </tr>
              </tbody>
            </Table>

            {/* Employer Contributions */}
            {(employerPf > 0 || employerEsi > 0 || totalCtc > 0) && (
              <Card className="bg-light mt-3">
                <Card.Body className="py-2">
                  <small className="text-muted">
                    <strong>Employer Contributions (CTC):</strong><br />
                    PF (13%): {formatCurrency(employerPf)} | 
                    ESI (3.25%): {formatCurrency(employerEsi)} | 
                    <strong className="ms-2">Total CTC: {formatCurrency(totalCtc)}</strong>
                  </small>
                </Card.Body>
              </Card>
            )}

            {advanceDeduction > 0 && (
              <Alert variant="info" className="mt-3 mb-0 py-2">
                <i className="fa-solid fa-info-circle me-2"></i>
                <small>₹{formatCurrency(advanceDeduction)} is being deducted towards salary advance repayment.</small>
              </Alert>
            )}
          </Card.Body>
        </Card>

        <div className="text-center mt-3">
          <img 
            src="https://razorpay.com/assets/razorpay-logo.svg" 
            alt="Razorpay"
            style={{ height: '30px', opacity: 0.7 }}
          />
          <p className="text-muted small mt-2">
            You will be redirected to Razorpay secure checkout to pay {formatCurrency(netSalary)}
          </p>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant="success"
          size="lg"
          onClick={handlePayment}
          disabled={loading || !keyId || netSalary <= 0}
        >
          {loading ? (
            <>
              <Spinner size="sm" animation="border" className="me-2" />
              Processing...
            </>
          ) : (
            <>
              <i className="fa-solid fa-credit-card me-2"></i>
              Pay {formatCurrency(netSalary)}
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RazorpaySalaryPayment;