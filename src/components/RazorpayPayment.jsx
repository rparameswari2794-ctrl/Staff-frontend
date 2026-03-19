// src/components/RazorpayPayment.jsx
import { useState, useEffect } from 'react';
import {
  Modal, Button, Spinner, Alert,
  Card, Row, Col
} from 'react-bootstrap';
import {
  getRazorpayKey,
  createOrder,
  initializePayment,
  verifyPayment
} from '../services/razorpayService';
import { toast } from 'react-toastify';

const RazorpayPayment = ({ show, onHide, advance, onSuccess }) => {
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
    
    try {
        // 1. Create order on backend
        const orderData = await createOrder(advance.amount, {
            advance_id: advance.id,
            employee_id: advance.employee_id,
            employee_name: advance.employee_name
        });

        // 2. Initialize payment with the order ID
        await initializePayment({
            amount: orderData.amount,
            orderId: orderData.order_id,
            keyId: keyId,
            name: 'Fresh Super Market',
            description: `Advance Disbursement - ${advance.employee_name}`,
            prefill: {
                name: advance.employee_name,
                contact: ''
            },
            notes: {
                advance_id: advance.id
            },
            callback: async (paymentResponse) => {
                if (paymentResponse.success) {
                    // 3. This will call your handleRazorpaySuccess
                    onSuccess?.(paymentResponse, advance.id);
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

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-success text-white">
        <Modal.Title>
          <i className="fa-solid fa-credit-card me-2"></i>
          Razorpay Payment
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <Card className="border-success mb-4">
          <Card.Body>
            <Row>
              <Col md={6}>
                <h6>Employee Details</h6>
                <p className="mb-1"><strong>Name:</strong> {advance?.employee_name}</p>
                <p className="mb-1"><strong>ID:</strong> {advance?.employee_id}</p>
              </Col>
              <Col md={6}>
                <h6>Payment Details</h6>
                <p className="mb-1"><strong>Advance Amount:</strong></p>
                <h3 className="text-success">₹{advance?.amount}</h3>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="border-info">
          <Card.Body>
            <h6>Payment Summary</h6>
            <Row>
              <Col xs={8}>Advance Amount:</Col>
              <Col xs={4} className="text-end">₹{advance?.amount}</Col>
            </Row>
            <hr />
            <Row className="fw-bold">
              <Col xs={8}>Total to Pay:</Col>
              <Col xs={4} className="text-end text-success">
                ₹{advance?.amount}
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <div className="text-center mt-3">
          <img 
            src="https://razorpay.com/assets/razorpay-logo.svg" 
            alt="Razorpay"
            style={{ height: '30px', opacity: 0.7 }}
          />
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
          disabled={loading || !keyId}
        >
          {loading ? (
            <>
              <Spinner size="sm" animation="border" className="me-2" />
              Processing...
            </>
          ) : (
            <>
              <i className="fa-solid fa-credit-card me-2"></i>
              Pay with Razorpay
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RazorpayPayment;