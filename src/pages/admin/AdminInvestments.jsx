// src/pages/admin/AdminInvestments.jsx
import { useState, useEffect } from 'react';
import {
    Container, Row, Col, Card, Table, Button, Form,
    Modal, Badge, Alert, Spinner, InputGroup
} from 'react-bootstrap';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { toast } from 'react-toastify';

const AdminInvestments = () => {
    const { user } = useSelector((state) => state.auth);
    const [investments, setInvestments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingInvestment, setEditingInvestment] = useState(null);
    const [formData, setFormData] = useState({
        investment_type: 'capital',
        description: '',
        amount: '',
        payment_method: 'bank',
        notes: '',
        useful_life_years: '',
        salvage_value: ''
    });
    const [actionLoading, setActionLoading] = useState(false);
    const [summary, setSummary] = useState({
        totalInvestment: 0,
        count: 0,
        byType: {}
    });

    useEffect(() => {
        fetchInvestments();
    }, []);

    const fetchInvestments = async () => {
        try {
            setLoading(true);
            console.log('Fetching investments...'); // Debug log
            const response = await api.get('/admin/investments/');
            console.log('Investments response:', response.data); // Debug log
            
            const investmentsData = response.data.results || response.data || [];
            setInvestments(investmentsData);
            
            // Calculate summary
            const total = investmentsData.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
            
            const byType = {};
            investmentsData.forEach(inv => {
                const type = inv.investment_type_display || inv.investment_type;
                byType[type] = (byType[type] || 0) + parseFloat(inv.amount);
            });
            
            setSummary({
                totalInvestment: total,
                count: investmentsData.length,
                byType
            });
            
            setLoading(false);
        } catch (error) {
            console.error('Error fetching investments:', error);
            if (error.response?.status === 401) {
                setError('Authentication failed. Please log in again.');
            } else {
                setError(error.response?.data?.message || 'Failed to load investments');
            }
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const resetForm = () => {
        setFormData({
            investment_type: 'capital',
            description: '',
            amount: '',
            payment_method: 'bank',
            notes: '',
            useful_life_years: '',
            salvage_value: ''
        });
        setEditingInvestment(null);
    };

    const handleOpenModal = (investment = null) => {
        if (investment) {
            setFormData({
                investment_type: investment.investment_type,
                description: investment.description || '',
                amount: investment.amount,
                payment_method: investment.payment_method,
                notes: investment.notes || '',
                useful_life_years: investment.useful_life_years || '',
                salvage_value: investment.salvage_value || ''
            });
            setEditingInvestment(investment);
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate
        if (!formData.description) {
            toast.warning('Description is required');
            return;
        }
        
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            toast.warning('Please enter a valid amount');
            return;
        }

        setActionLoading(true);
        try {
            // Prepare data for backend
            const dataToSend = {
                investment_type: formData.investment_type,
                description: formData.description,
                amount: parseFloat(formData.amount),
                payment_method: formData.payment_method || 'bank',
                notes: formData.notes || ''
            };
            
            // Add optional fields only if they have values
            if (formData.useful_life_years) {
                dataToSend.useful_life_years = parseInt(formData.useful_life_years);
            }
            
            if (formData.salvage_value) {
                dataToSend.salvage_value = parseFloat(formData.salvage_value);
            }

            console.log('Sending investment data:', dataToSend);

            if (editingInvestment) {
                // Update
                const response = await api.put(`/admin/investments/${editingInvestment.id}/`, dataToSend);
                console.log('Update response:', response.data);
                toast.success('Investment updated successfully');
            } else {
                // Create
                const response = await api.post('/admin/investments/', dataToSend);
                console.log('Create response:', response.data);
                toast.success('Investment added successfully');
            }
            
            setShowModal(false);
            resetForm();
            fetchInvestments();
        } catch (error) {
            console.error('Error saving investment:', error);
            console.error('Error response:', error.response?.data); // Log detailed error
            
            if (error.response?.status === 401) {
                toast.error('Session expired. Please log in again.');
            } else if (error.response?.status === 400) {
                // Show validation errors
                const errorData = error.response.data;
                if (typeof errorData === 'object') {
                    Object.keys(errorData).forEach(key => {
                        toast.error(`${key}: ${errorData[key]}`);
                    });
                } else {
                    toast.error(errorData || 'Validation error');
                }
            } else {
                toast.error(error.response?.data?.message || 'Failed to save investment');
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this investment?')) return;
        
        try {
            await api.delete(`/admin/investments/${id}/`);
            toast.success('Investment deleted successfully');
            fetchInvestments();
        } catch (error) {
            console.error('Error deleting investment:', error);
            toast.error('Failed to delete investment');
        }
    };

    const formatCurrency = (amount) => {
        return parseFloat(amount || 0).toFixed(2);
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

    const getTypeBadge = (type) => {
        const variants = {
            'capital': 'primary',
            'equipment': 'success',
            'furniture': 'info',
            'renovation': 'warning',
            'vehicle': 'danger',
            'other': 'secondary'
        };
        
        return (
            <Badge bg={variants[type] || 'secondary'} pill>
                {type}
            </Badge>
        );
    };

    if (loading) {
        return (
            <Container className="text-center py-5" style={{ marginTop: '80px' }}>
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Loading investments...</p>
            </Container>
        );
    }

    return (
        <Container style={{ marginTop: '80px' }} fluid>
            <h2 className="mb-4">Capital Investments</h2>
            <p className="text-muted mb-4">Manage business investments and capital assets</p>

            {error && (
                <Alert variant="danger" className="mb-4">
                    <Alert.Heading>
                        <i className="fa-solid fa-circle-exclamation me-2"></i>
                        Error
                    </Alert.Heading>
                    <p>{error}</p>
                    <hr />
                    <div className="d-flex justify-content-end">
                        <Button variant="outline-danger" onClick={fetchInvestments}>
                            <i className="fa-solid fa-rotate-right me-2"></i>
                            Retry
                        </Button>
                    </div>
                </Alert>
            )}

            {/* Summary Cards */}
            <Row className="mb-4">
                <Col md={4}>
                    <Card bg="primary" text="white" className="shadow-sm">
                        <Card.Body className="text-center">
                            <h6>Total Investment</h6>
                            <h3>₹{formatCurrency(summary.totalInvestment)}</h3>
                            <small>{summary.count} investments</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={8}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <h6>Investment by Type</h6>
                            <Row>
                                {Object.entries(summary.byType).map(([type, amount]) => (
                                    <Col md={4} key={type} className="mb-2">
                                        <div className="d-flex justify-content-between">
                                            <Badge bg="info" pill>{type}</Badge>
                                            <strong>₹{formatCurrency(amount)}</strong>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Actions */}
            <Row className="mb-4">
                <Col className="text-end">
                    <Button variant="success" onClick={() => handleOpenModal()}>
                        <i className="fa-solid fa-plus me-2"></i>
                        Add New Investment
                    </Button>
                </Col>
            </Row>

            {/* Investments Table */}
            <Card className="shadow-sm">
                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                        <i className="fa-solid fa-chart-line me-2"></i>
                        Investment Records
                    </h5>
                    <Badge bg="light" text="dark" pill>
                        Total: ₹{formatCurrency(summary.totalInvestment)}
                    </Badge>
                </Card.Header>
                <Card.Body>
                    <div style={{ overflowX: 'auto' }}>
                        <Table striped bordered hover responsive className="align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th>#</th>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Description</th>
                                    <th>Amount (₹)</th>
                                    <th>Payment</th>
                                    <th>Added By</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {investments.length > 0 ? (
                                    investments.map((investment, index) => (
                                        <tr key={investment.id}>
                                            <td>
                                                <small className="text-muted">{index + 1}</small>
                                            </td>
                                            <td>{formatDate(investment.date)}</td>
                                            <td>
                                                {getTypeBadge(investment.investment_type_display || investment.investment_type)}
                                            </td>
                                            <td>
                                                <strong>{investment.description}</strong>
                                                {investment.notes && (
                                                    <div className="text-muted small">{investment.notes}</div>
                                                )}
                                            </td>
                                            <td className="text-end">
                                                <strong className="text-primary">
                                                    ₹{formatCurrency(investment.amount)}
                                                </strong>
                                            </td>
                                            <td>
                                                <Badge bg="secondary" pill>
                                                    {investment.payment_method_display || investment.payment_method}
                                                </Badge>
                                            </td>
                                            <td>
                                                <small>{investment.created_by_username || 'Admin'}</small>
                                            </td>
                                            <td>
                                                <Button
                                                    variant="outline-warning"
                                                    size="sm"
                                                    onClick={() => handleOpenModal(investment)}
                                                    className="me-1"
                                                >
                                                    <i className="fa-solid fa-edit"></i>
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleDelete(investment.id)}
                                                >
                                                    <i className="fa-solid fa-trash"></i>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center py-5">
                                            <i className="fa-solid fa-chart-line fa-3x text-muted mb-3"></i>
                                            <h5 className="text-muted">No investments found</h5>
                                            <p className="text-muted mb-0">
                                                Add your first capital investment
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Add/Edit Investment Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title>
                        <i className="fa-solid fa-chart-line me-2"></i>
                        {editingInvestment ? 'Edit Investment' : 'Add New Investment'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Investment Type</Form.Label>
                                    <Form.Select
                                        name="investment_type"
                                        value={formData.investment_type}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="capital">Capital Investment</option>
                                        <option value="equipment">Equipment</option>
                                        <option value="furniture">Furniture</option>
                                        <option value="renovation">Renovation</option>
                                        <option value="vehicle">Vehicle</option>
                                        <option value="other">Other</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Payment Method</Form.Label>
                                    <Form.Select
                                        name="payment_method"
                                        value={formData.payment_method}
                                        onChange={handleInputChange}
                                    >
                                        <option value="bank">Bank Transfer</option>
                                        <option value="cash">Cash</option>
                                        <option value="card">Card</option>
                                        <option value="upi">UPI</option>
                                        <option value="cheque">Cheque</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                type="text"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="e.g., Shop Renovation, New Equipment, etc."
                                required
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Amount (₹)</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>₹</InputGroup.Text>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            name="amount"
                                            value={formData.amount}
                                            onChange={handleInputChange}
                                            placeholder="0.00"
                                            required
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Useful Life (Years) - Optional</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="1"
                                        name="useful_life_years"
                                        value={formData.useful_life_years}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 5"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Notes</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                placeholder="Additional details about this investment..."
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={actionLoading}>
                            {actionLoading ? (
                                <>
                                    <Spinner size="sm" animation="border" className="me-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-save me-2"></i>
                                    {editingInvestment ? 'Update Investment' : 'Add Investment'}
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default AdminInvestments;