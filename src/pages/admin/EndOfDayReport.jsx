// src/pages/admin/EndOfDayReport.jsx
import { useState, useEffect } from 'react';
import {
    Container, Row, Col, Card, Table, Form,
    Button, Badge, Alert, Spinner
} from 'react-bootstrap';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { toast } from 'react-toastify';

const EndOfDayReport = () => {
    const { user } = useSelector((state) => state.auth);
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reportGenerated, setReportGenerated] = useState(false);
    const [summary, setSummary] = useState({
        // Income
        totalSales: 0,
        salesCount: 0,
        
        // Expenses
        totalPurchases: 0,
        purchasesCount: 0,
        totalExpenses: 0,
        expensesCount: 0,
        totalInvestments: 0,
        investmentsCount: 0,
        
        // Calculations
        totalOutflow: 0,
        netProfit: 0,
        profitMargin: 0
    });

    const [transactions, setTransactions] = useState({
        sales: [],
        purchases: [],
        expenses: [],
        investments: []
    });

    useEffect(() => {
        generateReport();
    }, [reportDate]);

    const generateReport = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch all financial data for the selected date
            const [salesRes, purchasesRes, expensesRes, investmentsRes] = await Promise.all([
                api.get('/sales/', { params: { date: reportDate } }),
                api.get('/purchases/', { params: { date: reportDate } }),
                api.get('/expenses/', { params: { date: reportDate } }),
                api.get('/admin/investments/', { params: { date: reportDate } })
            ]);

            // Handle different response structures
            const sales = salesRes.data.results || salesRes.data || [];
            const purchases = purchasesRes.data.results || purchasesRes.data || [];
            const expenses = expensesRes.data.results || expensesRes.data || [];
            const investments = investmentsRes.data.results || investmentsRes.data || [];

            console.log('Sales:', sales);
            console.log('Purchases:', purchases);
            console.log('Expenses:', expenses);
            console.log('Investments:', investments);

            // Calculate totals
            const totalSales = sales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
            const totalPurchases = purchases.reduce((sum, p) => sum + parseFloat(p.total_cost || 0), 0);
            const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
            const totalInvestments = investments.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
            
            const totalOutflow = totalPurchases + totalExpenses + totalInvestments;
            const netProfit = totalSales - totalOutflow;
            const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

            setTransactions({
                sales,
                purchases,
                expenses,
                investments
            });

            setSummary({
                totalSales,
                salesCount: sales.length,
                totalPurchases,
                purchasesCount: purchases.length,
                totalExpenses,
                expensesCount: expenses.length,
                totalInvestments,
                investmentsCount: investments.length,
                totalOutflow,
                netProfit,
                profitMargin
            });

            setReportGenerated(true);
            setLoading(false);
        } catch (error) {
            console.error('Error generating report:', error);
            setError(error.response?.data?.message || 'Failed to generate report');
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const formatNumber = (num) => {
        return parseFloat(num || 0).toFixed(2);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const getPaymentBadge = (method) => {
        const variants = {
            'cash': 'success',
            'card': 'primary',
            'upi': 'info',
            'bank': 'warning',
            'cheque': 'secondary'
        };
        return (
            <Badge bg={variants[method?.toLowerCase()] || 'secondary'} pill>
                {method?.toUpperCase() || 'CASH'}
            </Badge>
        );
    };

    if (loading) {
        return (
            <Container className="text-center py-5" style={{ marginTop: '80px' }}>
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Generating End of Day Report...</p>
            </Container>
        );
    }

    return (
        <Container style={{ marginTop: '80px' }} fluid>
            <h2 className="mb-4">End of Day Financial Report</h2>
            <p className="text-muted mb-4">Daily financial summary including all transactions and investments</p>

            {error && (
                <Alert variant="danger" className="mb-4">
                    <Alert.Heading>
                        <i className="fa-solid fa-circle-exclamation me-2"></i>
                        Error
                    </Alert.Heading>
                    <p>{error}</p>
                    <hr />
                    <div className="d-flex justify-content-end">
                        <Button variant="outline-danger" onClick={generateReport}>
                            <i className="fa-solid fa-rotate-right me-2"></i>
                            Retry
                        </Button>
                    </div>
                </Alert>
            )}

            {/* Date Selector */}
            <Row className="mb-4">
                <Col md={4}>
                    <Form.Group>
                        <Form.Label>Select Date</Form.Label>
                        <div className="d-flex">
                            <Form.Control
                                type="date"
                                value={reportDate}
                                onChange={(e) => setReportDate(e.target.value)}
                                className="me-2"
                                max={new Date().toISOString().split('T')[0]}
                            />
                            <Button variant="primary" onClick={generateReport}>
                                <i className="fa-solid fa-file-lines me-2"></i>
                                Generate Report
                            </Button>
                        </div>
                    </Form.Group>
                </Col>
                <Col md={8} className="text-end">
                    <h5 className="text-muted">
                        Report for: {formatDate(reportDate)}
                    </h5>
                </Col>
            </Row>

            {reportGenerated && (
                <>
                    {/* Summary Cards */}
                    <Row className="mb-4">
                        <Col md={3}>
                            <Card bg="success" text="white" className="shadow-sm">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6>Total Sales</h6>
                                            <h3>{formatCurrency(summary.totalSales)}</h3>
                                            <small>{summary.salesCount} transactions</small>
                                        </div>
                                        <i className="fa-solid fa-chart-line fa-3x opacity-50"></i>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        
                        <Col md={3}>
                            <Card bg="danger" text="white" className="shadow-sm">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6>Total Purchases</h6>
                                            <h3>{formatCurrency(summary.totalPurchases)}</h3>
                                            <small>{summary.purchasesCount} purchases</small>
                                        </div>
                                        <i className="fa-solid fa-cart-shopping fa-3x opacity-50"></i>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={3}>
                            <Card bg="warning" text="dark" className="shadow-sm">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6>Total Expenses</h6>
                                            <h3>{formatCurrency(summary.totalExpenses)}</h3>
                                            <small>{summary.expensesCount} expenses</small>
                                        </div>
                                        <i className="fa-solid fa-money-bill-wave fa-3x opacity-50"></i>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={3}>
                            <Card bg="info" text="white" className="shadow-sm">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6>Total Investments</h6>
                                            <h3>{formatCurrency(summary.totalInvestments)}</h3>
                                            <small>{summary.investmentsCount} investments</small>
                                        </div>
                                        <i className="fa-solid fa-chart-pie fa-3x opacity-50"></i>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Financial Summary Card */}
                    <Row className="mb-4">
                        <Col md={12}>
                            <Card className="shadow-sm border-primary">
                                <Card.Header className="bg-primary text-white">
                                    <h5 className="mb-0">
                                        <i className="fa-solid fa-calculator me-2"></i>
                                        Financial Summary
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={4}>
                                            <Card className="text-center border-success">
                                                <Card.Body>
                                                    <h6>Total Income</h6>
                                                    <h3 className="text-success">{formatCurrency(summary.totalSales)}</h3>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={4}>
                                            <Card className="text-center border-danger">
                                                <Card.Body>
                                                    <h6>Total Outflow</h6>
                                                    <h3 className="text-danger">{formatCurrency(summary.totalOutflow)}</h3>
                                                    <small>
                                                        Purchases: {formatCurrency(summary.totalPurchases)} | 
                                                        Expenses: {formatCurrency(summary.totalExpenses)} | 
                                                        Investments: {formatCurrency(summary.totalInvestments)}
                                                    </small>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={4}>
                                            <Card className={`text-center ${summary.netProfit >= 0 ? 'border-success' : 'border-danger'}`}>
                                                <Card.Body>
                                                    <h6>Net Profit / Loss</h6>
                                                    <h3 className={summary.netProfit >= 0 ? 'text-success' : 'text-danger'}>
                                                        {formatCurrency(summary.netProfit)}
                                                    </h3>
                                                    <small>
                                                        Margin: {formatNumber(summary.profitMargin)}%
                                                    </small>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Detailed Transactions */}
                    <Row>
                        {/* Sales Section */}
                        {transactions.sales.length > 0 && (
                            <Col md={6} className="mb-4">
                                <Card className="shadow-sm h-100">
                                    <Card.Header className="bg-success text-white">
                                        <h6 className="mb-0">
                                            <i className="fa-solid fa-receipt me-2"></i>
                                            Sales ({transactions.sales.length})
                                        </h6>
                                    </Card.Header>
                                    <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        <Table size="sm" striped hover>
                                            <thead>
                                                <tr>
                                                    <th>Bill No.</th>
                                                    <th>Customer</th>
                                                    <th>Payment</th>
                                                    <th className="text-end">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {transactions.sales.map(sale => (
                                                    <tr key={sale.id}>
                                                        <td>{sale.bill_number}</td>
                                                        <td>{sale.customer_name || 'Walk-in'}</td>
                                                        <td>{getPaymentBadge(sale.payment_method)}</td>
                                                        <td className="text-end text-success">
                                                            {formatCurrency(sale.total_amount)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <th colSpan="3" className="text-end">Total:</th>
                                                    <th className="text-end text-success">
                                                        {formatCurrency(summary.totalSales)}
                                                    </th>
                                                </tr>
                                            </tfoot>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            </Col>
                        )}

                        {/* Purchases Section */}
                        {transactions.purchases.length > 0 && (
                            <Col md={6} className="mb-4">
                                <Card className="shadow-sm h-100">
                                    <Card.Header className="bg-danger text-white">
                                        <h6 className="mb-0">
                                            <i className="fa-solid fa-cart-shopping me-2"></i>
                                            Purchases ({transactions.purchases.length})
                                        </h6>
                                    </Card.Header>
                                    <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        <Table size="sm" striped hover>
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th>Supplier</th>
                                                    <th className="text-end">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {transactions.purchases.map(purchase => (
                                                    <tr key={purchase.id}>
                                                        <td>{purchase.product_name}</td>
                                                        <td>{purchase.supplier || '-'}</td>
                                                        <td className="text-end text-danger">
                                                            {formatCurrency(purchase.total_cost)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <th colSpan="2" className="text-end">Total:</th>
                                                    <th className="text-end text-danger">
                                                        {formatCurrency(summary.totalPurchases)}
                                                    </th>
                                                </tr>
                                            </tfoot>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            </Col>
                        )}

                        {/* Expenses Section */}
                        {transactions.expenses.length > 0 && (
                            <Col md={6} className="mb-4">
                                <Card className="shadow-sm h-100">
                                    <Card.Header className="bg-warning">
                                        <h6 className="mb-0">
                                            <i className="fa-solid fa-money-bill-wave me-2"></i>
                                            Expenses ({transactions.expenses.length})
                                        </h6>
                                    </Card.Header>
                                    <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        <Table size="sm" striped hover>
                                            <thead>
                                                <tr>
                                                    <th>Description</th>
                                                    <th>Category</th>
                                                    <th className="text-end">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {transactions.expenses.map(expense => (
                                                    <tr key={expense.id}>
                                                        <td>{expense.description}</td>
                                                        <td>
                                                            <Badge bg="secondary" pill>
                                                                {expense.category}
                                                            </Badge>
                                                        </td>
                                                        <td className="text-end text-warning">
                                                            {formatCurrency(expense.amount)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <th colSpan="2" className="text-end">Total:</th>
                                                    <th className="text-end text-warning">
                                                        {formatCurrency(summary.totalExpenses)}
                                                    </th>
                                                </tr>
                                            </tfoot>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            </Col>
                        )}

                        {/* Investments Section */}
                        {transactions.investments.length > 0 && (
                            <Col md={6} className="mb-4">
                                <Card className="shadow-sm h-100">
                                    <Card.Header className="bg-info text-white">
                                        <h6 className="mb-0">
                                            <i className="fa-solid fa-chart-line me-2"></i>
                                            Investments ({transactions.investments.length})
                                        </h6>
                                    </Card.Header>
                                    <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        <Table size="sm" striped hover>
                                            <thead>
                                                <tr>
                                                    <th>Description</th>
                                                    <th>Type</th>
                                                    <th className="text-end">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {transactions.investments.map(investment => (
                                                    <tr key={investment.id}>
                                                        <td>{investment.description}</td>
                                                        <td>
                                                            <Badge bg="secondary" pill>
                                                                {investment.investment_type_display || investment.investment_type}
                                                            </Badge>
                                                        </td>
                                                        <td className="text-end text-info">
                                                            {formatCurrency(investment.amount)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <th colSpan="2" className="text-end">Total:</th>
                                                    <th className="text-end text-info">
                                                        {formatCurrency(summary.totalInvestments)}
                                                    </th>
                                                </tr>
                                            </tfoot>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            </Col>
                        )}
                    </Row>

                    {/* Print/Export Buttons */}
                    <Row className="mb-4">
                        <Col className="text-end">
                            <Button 
                                variant="primary" 
                                className="me-2"
                                onClick={() => window.print()}
                            >
                                <i className="fa-solid fa-print me-2"></i>
                                Print Report
                            </Button>
                            <Button variant="success">
                                <i className="fa-solid fa-download me-2"></i>
                                Export PDF
                            </Button>
                        </Col>
                    </Row>
                </>
            )}

            {reportGenerated && 
             transactions.sales.length === 0 && 
             transactions.purchases.length === 0 && 
             transactions.expenses.length === 0 && 
             transactions.investments.length === 0 && (
                <Card className="text-center py-5">
                    <Card.Body>
                        <i className="fa-solid fa-file-lines fa-4x text-muted mb-3"></i>
                        <h4 className="text-muted">No Transactions Found</h4>
                        <p className="text-muted">
                            No sales, purchases, expenses, or investments recorded for this date.
                        </p>
                    </Card.Body>
                </Card>
            )}
        </Container>
    );
};

export default EndOfDayReport;