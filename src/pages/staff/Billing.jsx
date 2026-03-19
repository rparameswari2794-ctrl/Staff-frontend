import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
    Container, Table, Button, Card, Row, Col,
    Modal, Form, Alert, Spinner, InputGroup, Badge
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../services/api';

const StaffBilling = () => {
    const { user } = useSelector((state) => state.auth);
    const [sales, setSales] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    
    // Attendance check state
    const [attendanceChecked, setAttendanceChecked] = useState(false);
    const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
    const [checkingAttendance, setCheckingAttendance] = useState(true);

    // New bill form state
    const [billForm, setBillForm] = useState({
        customer_name: '',
        customer_phone: '',
        payment_method: 'cash',
        items: []
    });

    // Current bill item being added
    const [currentItem, setCurrentItem] = useState({
        product_code: '',
        quantity: 1,
        unit_price: 0,
        product_name: '',
        product_id: null,
        available_stock: 0
    });

    // Search timeout for debouncing
    const [searchTimeout, setSearchTimeout] = useState(null);

    useEffect(() => {
        fetchSales();
        fetchProducts();
        checkTodayAttendance();
    }, []);

    // Check if staff has checked in today
    const checkTodayAttendance = async () => {
        try {
            setCheckingAttendance(true);
            const today = new Date().toISOString().split('T')[0];
            
            const response = await api.get('/attendance/', {
                params: {
                    date: today,
                    employee: user?.id
                }
            });

            const attendance = response.data.results || response.data || [];
            
            // Check if there's a check-in record for today
            const hasCheckIn = attendance.some(record => 
                record.check_in_time && !record.check_out_time
            );

            setHasCheckedInToday(hasCheckIn);
            setAttendanceChecked(true);

            if (!hasCheckIn) {
                toast.warning('You must check in before creating bills!');
            }
        } catch (error) {
            console.error('Error checking attendance:', error);
            setAttendanceChecked(true);
            setHasCheckedInToday(false);
        } finally {
            setCheckingAttendance(false);
        }
    };

    const fetchSales = async () => {
        try {
            const response = await api.get('/sales/');
            setSales(response.data);
        } catch (error) {
            console.error('Error fetching sales:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products/');
            setProducts(response.data);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    // Auto lookup product by code
    const lookupProductByCode = async (code) => {
        if (!code || code.length < 1) {
            setCurrentItem({
                ...currentItem,
                product_code: code,
                product_name: '',
                product_id: null,
                unit_price: 0,
                available_stock: 0
            });
            return;
        }

        // Try to find in local products array
        const localProduct = products.find(p =>
            p.product_code === code ||
            p.barcode === code ||
            p.id.toString() === code
        );

        if (localProduct) {
            setCurrentItem({
                ...currentItem,
                product_code: code,
                product_id: localProduct.id,
                product_name: localProduct.name,
                unit_price: localProduct.price,
                available_stock: localProduct.quantity
            });
            setError('');
            return;
        }

        // Try API call
        try {
            const response = await api.get(`/products/by_code/?code=${code}`);
            if (response.data) {
                const product = response.data;
                setCurrentItem({
                    ...currentItem,
                    product_code: code,
                    product_id: product.id,
                    product_name: product.name,
                    unit_price: product.price,
                    available_stock: product.quantity
                });
                setError('');
            }
        } catch (error) {
            setCurrentItem({
                ...currentItem,
                product_code: code,
                product_name: 'Product not found',
                product_id: null,
                unit_price: 0,
                available_stock: 0
            });
        }
    };

    // Handle product code input with debounce
    const handleProductCodeChange = (e) => {
        const code = e.target.value.trim();

        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        setCurrentItem({
            ...currentItem,
            product_code: code,
            product_name: code.length > 0 ? 'Searching...' : '',
            product_id: null
        });

        if (code.length === 0) {
            return;
        }

        const timeout = setTimeout(() => {
            lookupProductByCode(code);
        }, 500);

        setSearchTimeout(timeout);
    };

    const addItemToBill = () => {
        if (!currentItem.product_id) {
            setError('Please enter a valid product code');
            return;
        }

        if (currentItem.quantity < 1) {
            setError('Quantity must be at least 1');
            return;
        }

        if (currentItem.available_stock <= 0) {
            setError(`Cannot add ${currentItem.product_name} - Out of stock!`);
            return;
        }

        if (currentItem.quantity > currentItem.available_stock) {
            setError(`Insufficient stock! Available: ${currentItem.available_stock}`);
            return;
        }

        const newItem = {
            product_id: currentItem.product_id,
            product_code: currentItem.product_code,
            product_name: currentItem.product_name,
            quantity: currentItem.quantity,
            unit_price: parseFloat(currentItem.unit_price),
            total: parseFloat(currentItem.unit_price) * currentItem.quantity
        };

        const existingIndex = billForm.items.findIndex(item => item.product_id === newItem.product_id);
        if (existingIndex >= 0) {
            const updatedItems = [...billForm.items];
            updatedItems[existingIndex].quantity += newItem.quantity;
            updatedItems[existingIndex].total = updatedItems[existingIndex].quantity * updatedItems[existingIndex].unit_price;
            setBillForm({ ...billForm, items: updatedItems });
        } else {
            setBillForm({
                ...billForm,
                items: [...billForm.items, newItem]
            });
        }

        setCurrentItem({
            product_code: '',
            quantity: 1,
            unit_price: 0,
            product_name: '',
            product_id: null,
            available_stock: 0
        });
        setError('');
    };

    const removeItem = (index) => {
        const newItems = billForm.items.filter((_, i) => i !== index);
        setBillForm({ ...billForm, items: newItems });
    };

    const updateItemQuantity = (index, newQuantity) => {
        if (newQuantity < 1) return;

        const updatedItems = [...billForm.items];
        updatedItems[index].quantity = newQuantity;
        updatedItems[index].total = newQuantity * updatedItems[index].unit_price;
        setBillForm({ ...billForm, items: updatedItems });
    };

    const calculateTotal = () => {
        return billForm.items.reduce((sum, item) => sum + item.total, 0).toFixed(2);
    };

    const handleOpenModal = () => {
        // Check attendance before opening modal
        if (!hasCheckedInToday) {
            toast.error('You must check in before creating bills!');
            return;
        }
        setShowModal(true);
    };

    // Submit bill
    const handleSubmitBill = async () => {
        // Double-check attendance before submission
        if (!hasCheckedInToday) {
            toast.error('You must check in before creating bills!');
            setShowModal(false);
            return;
        }

        if (!billForm.customer_name) {
            toast.warning('Customer name is required');
            return;
        }

        if (!billForm.customer_phone) {
            toast.warning('Customer phone is required');
            return;
        }

        if (billForm.items.length === 0) {
            toast.warning('Cart is empty');
            return;
        }

        setLoading(true);
        try {
            // First create customer
            const customerResponse = await api.post('/customers/', {
                name: billForm.customer_name,
                phone: billForm.customer_phone
            });

            // Then create sale with customer_id
            const saleData = {
                payment_method: billForm.payment_method,
                customer_id: customerResponse.data.id,
                items_data: billForm.items.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price
                }))
            };

            const response = await api.post('/sales/', saleData);
            toast.success('Bill created successfully!');

            // Reset form
            setBillForm({
                customer_name: '',
                customer_phone: '',
                payment_method: 'cash',
                items: []
            });
            setShowModal(false);
            fetchSales();

        } catch (error) {
            console.error('Error creating bill:', error);
            
            if (error.response?.status === 403) {
                toast.error('You do not have permission to create customers. Please contact manager.');
            } else {
                toast.error(error.response?.data?.message || 'Failed to create bill');
            }
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setBillForm({
            customer_name: '',
            customer_phone: '',
            payment_method: 'cash',
            items: []
        });
        setCurrentItem({
            product_code: '',
            quantity: 1,
            unit_price: 0,
            product_name: '',
            product_id: null,
            available_stock: 0
        });
    };

    const handlePrintBill = async (sale) => {
        try {
            const response = await api.get(`/sales/${sale.id}/`);
            const fullSale = response.data;

            const printWindow = window.open('', '_blank');
            const billDate = new Date(fullSale.date).toLocaleString();

            printWindow.document.write(`
                <html>
                <head><title>Bill #${fullSale.bill_number}</title>
                <style>
                    body { font-family: Arial; margin: 40px; }
                    .bill-container { max-width: 800px; margin: 0 auto; border: 1px solid #ddd; padding: 30px; }
                    .bill-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; }
                    .bill-title { font-size: 28px; font-weight: bold; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th { background-color: #2c3e50; color: white; padding: 12px; }
                    td { padding: 10px; border-bottom: 1px solid #ddd; }
                    .total { font-size: 20px; font-weight: bold; text-align: right; margin-top: 20px; }
                </style>
                </head>
                <body>
                    <div class="bill-container">
                        <div class="bill-header"><div class="bill-title">Fresh Super Market</div></div>
                        <div>Bill No: ${fullSale.bill_number}</div>
                        <div>Date: ${billDate}</div>
                        <div>Customer: ${fullSale.customer_name || 'Walk-in Customer'} ${fullSale.customer_phone ? '- ' + fullSale.customer_phone : ''}</div>
                        <div>Cashier: ${fullSale.cashier_username || 'Staff'}</div>
                        <div>Payment: ${fullSale.payment_method.toUpperCase()}</div>
                        <table>
                            <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                            <tbody>
                                ${fullSale.items?.map(item => `
                                    <tr><td>${item.product_name}</td><td>${item.quantity}</td><td>₹${parseFloat(item.unit_price).toFixed(2)}</td><td>₹${parseFloat(item.total).toFixed(2)}</td></tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <div class="total">Total: ₹${parseFloat(fullSale.total_amount).toFixed(2)}</div>
                        <div style="text-align: center; margin-top: 40px;">Thank you for shopping!</div>
                    </div>
                    <script>window.onload = () => { setTimeout(() => { window.print(); window.onafterprint = () => window.close(); }, 500); }</script>
                </body>
                </html>
            `);
            printWindow.document.close();
        } catch (error) {
            console.error('Error printing bill:', error);
        }
    };

    if (checkingAttendance) {
        return (
            <Container className="text-center py-5" style={{ marginTop: '80px' }}>
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Checking attendance...</p>
            </Container>
        );
    }

    return (
        <Container fluid className="mt-4">
            <Row className="mb-4">
                <Col>
                    <h2>
                        <i className="fa-solid fa-cash-register me-2 text-success"></i>
                        Billing
                    </h2>
                </Col>
                <Col className="text-end">
                    {!hasCheckedInToday && (
                        <Alert variant="warning" className="mb-2 p-2">
                            <i className="fa-solid fa-exclamation-triangle me-2"></i>
                            Please check in before billing
                        </Alert>
                    )}
                    <Button 
                        variant="success" 
                        onClick={handleOpenModal}
                        disabled={!hasCheckedInToday}
                    >
                        <i className="fa-solid fa-plus me-2"></i>
                        Create New Bill
                    </Button>
                </Col>
            </Row>

            {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

            {/* Attendance Warning Banner */}
            {!hasCheckedInToday && (
                <Alert variant="warning" className="mb-4">
                    <i className="fa-solid fa-clock me-2"></i>
                    <strong>Attendance Required:</strong> You must check in before you can create new bills. 
                    Please go to the <a href="/attendance" className="alert-link">Attendance page</a> to check in.
                </Alert>
            )}

            {/* Recent Bills Table */}
            <Card>
                <Card.Header>
                    <h5 className="mb-0">
                        <i className="fa-solid fa-receipt me-2"></i>
                        Recent Bills
                    </h5>
                </Card.Header>
                <Card.Body>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Bill No.</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Phone</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Payment</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map((sale) => (
                                <tr key={sale.id}>
                                    <td><strong>{sale.bill_number}</strong></td>
                                    <td>{new Date(sale.date).toLocaleString()}</td>
                                    <td>{sale.customer_name || 'Walk-in Customer'}</td>
                                    <td>{sale.customer_phone ? <Badge bg="info">{sale.customer_phone}</Badge> : '-'}</td>
                                    <td><Badge bg="info">{sale.item_count || 0} items</Badge></td>
                                    <td>₹{parseFloat(sale.total_amount).toFixed(2)}</td>
                                    <td><Badge bg={sale.payment_method === 'cash' ? 'success' : 'info'}>{sale.payment_method.toUpperCase()}</Badge></td>
                                    <td>
                                        <Button variant="outline-primary" size="sm" onClick={() => handlePrintBill(sale)}>
                                            <i className="fa-solid fa-print"></i>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {sales.length === 0 && (
                                <tr><td colSpan="8" className="text-center">No bills found.</td></tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Create Bill Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title><i className="fa-solid fa-plus-circle me-2 text-success"></i>Create New Bill</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}

                    {/* Customer Section */}
                    <Card className="mb-3">
                        <Card.Header>Customer Details</Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Customer Name <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Enter customer name"
                                            value={billForm.customer_name}
                                            onChange={(e) => setBillForm({ ...billForm, customer_name: e.target.value })}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Customer Phone <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Enter phone number"
                                            value={billForm.customer_phone}
                                            onChange={(e) => setBillForm({ ...billForm, customer_phone: e.target.value })}
                                            required
                                        />
                                        <Form.Text className="text-muted">
                                            Phone number is required for billing
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row className="mt-3">
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Payment Method</Form.Label>
                                        <Form.Select
                                            value={billForm.payment_method}
                                            onChange={(e) => setBillForm({ ...billForm, payment_method: e.target.value })}
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="card">Card</option>
                                            <option value="upi">UPI</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Product Entry Section */}
                    <Card className="mb-3">
                        <Card.Header>Add Items - Type Product Code</Card.Header>
                        <Card.Body>
                            <Row className="mb-3">
                                <Col md={5}>
                                    <Form.Group>
                                        <Form.Label><i className="fa-solid fa-barcode me-2"></i>Product Code</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Type product code..."
                                            value={currentItem.product_code}
                                            onChange={handleProductCodeChange}
                                            autoFocus
                                        />
                                        <Form.Text className="text-muted">
                                            Product details will appear automatically
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Product Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Auto-filled"
                                            value={currentItem.product_name}
                                            readOnly
                                            style={{ backgroundColor: '#f8f9fa' }}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={2}>
                                    <Form.Group>
                                        <Form.Label>Stock</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Auto-filled"
                                            value={currentItem.available_stock || ''}
                                            readOnly
                                            style={{ backgroundColor: '#f8f9fa' }}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={2}>
                                    <Form.Group>
                                        <Form.Label>Price (₹)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            value={currentItem.unit_price}
                                            onChange={(e) => setCurrentItem({ ...currentItem, unit_price: parseFloat(e.target.value) || 0 })}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row className="mb-3 align-items-end">
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Quantity</Form.Label>
                                        <Form.Control
                                            type="number"
                                            min="1"
                                            value={currentItem.quantity}
                                            onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Button
                                        variant="success"
                                        onClick={addItemToBill}
                                        disabled={!currentItem.product_id || currentItem.available_stock <= 0}
                                        className="w-100"
                                    >
                                        <i className="fa-solid fa-plus me-2"></i>Add to Bill
                                    </Button>
                                </Col>
                                <Col md={6}>
                                    {currentItem.product_id && (
                                        <Alert 
                                            variant={currentItem.available_stock <= 0 ? "danger" : "info"} 
                                            className="mb-0 py-2"
                                        >
                                            <i className={`fa-solid fa-${currentItem.available_stock <= 0 ? 'times-circle' : 'check-circle'} me-2`}></i>
                                            {currentItem.product_name} - ₹{currentItem.unit_price} x {currentItem.quantity} = ₹{(currentItem.unit_price * currentItem.quantity).toFixed(2)}
                                            {currentItem.available_stock <= 0 && (
                                                <strong className="ms-2 text-danger">(OUT OF STOCK)</strong>
                                            )}
                                        </Alert>
                                    )}
                                </Col>
                            </Row>

                            {/* Items List */}
                            {billForm.items.length > 0 && (
                                <>
                                    <hr />
                                    <h6>Current Bill Items:</h6>
                                    <Table size="sm" striped bordered hover>
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Qty</th>
                                                <th>Price</th>
                                                <th>Total</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {billForm.items.map((item, index) => (
                                                <tr key={index}>
                                                    <td>{item.product_name}</td>
                                                    <td style={{ width: '150px' }}>
                                                        <InputGroup size="sm">
                                                            <Button
                                                                variant="outline-secondary"
                                                                size="sm"
                                                                onClick={() => updateItemQuantity(index, item.quantity - 1)}
                                                            >-</Button>
                                                            <Form.Control
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                                                                style={{ textAlign: 'center' }}
                                                            />
                                                            <Button
                                                                variant="outline-secondary"
                                                                size="sm"
                                                                onClick={() => updateItemQuantity(index, item.quantity + 1)}
                                                            >+</Button>
                                                        </InputGroup>
                                                    </td>
                                                    <td>₹{item.unit_price.toFixed(2)}</td>
                                                    <td>₹{item.total.toFixed(2)}</td>
                                                    <td>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => removeItem(index)}
                                                        >
                                                            <i className="fa-solid fa-trash"></i>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <th colSpan="3" className="text-end">Total:</th>
                                                <th>₹{calculateTotal()}</th>
                                                <th></th>
                                            </tr>
                                        </tfoot>
                                    </Table>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => {
                        setShowModal(false);
                        resetForm();
                        setError('');
                    }}>
                        Cancel
                    </Button>
                    <Button
                        variant="success"
                        onClick={handleSubmitBill}
                        disabled={loading || billForm.items.length === 0 || !billForm.customer_name || !billForm.customer_phone}
                    >
                        {loading ? <Spinner size="sm" /> : (
                            <>
                                <i className="fa-solid fa-check me-2"></i>
                                Create Bill (₹{calculateTotal()})
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default StaffBilling;