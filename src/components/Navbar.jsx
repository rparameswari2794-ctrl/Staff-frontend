import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import { Navbar, Nav, Container, Button, NavDropdown } from 'react-bootstrap';
import { logout } from '../store/slices/authSlices';

const AppNavbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, role } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const getNavLinks = () => {
    if (!isAuthenticated) return null;

    switch (role) {
      case 'admin':
        return (
          <>
            <Nav.Link as={NavLink} to="/">Dashboard</Nav.Link>

            {/* HR Dropdown - Merged Employees and HR functions */}
            <NavDropdown title="HR" id="admin-hr-dropdown">
              <NavDropdown.Item as={Link} to="/admin/employees">
                <i className="fa-solid fa-users me-2"></i>All Employees
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/admin/departments">
                <i className="fa-solid fa-building me-2"></i>Departments
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/admin/attendance">
                <i className="fa-solid fa-calendar-check me-2"></i>Attendance
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/admin/leaves">
                <i className="fa-solid fa-umbrella-beach me-2"></i>Leaves
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item as={Link} to="/admin/salary">
                <i className="fa-solid fa-money-bill-wave me-2"></i>Salary Management
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/admin/salary-advances">
                <i className="fa-solid fa-hand-holding-usd me-2"></i>Advance Requests
              </NavDropdown.Item>
            </NavDropdown>

            <NavDropdown title="Inventory" id="admin-inventory-dropdown">
              <NavDropdown.Item as={Link} to="/admin/products">
                <i className="fa-solid fa-boxes me-2"></i>Products
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/admin/purchases">
                <i className="fa-solid fa-cart-shopping me-2"></i>Purchases
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/admin/expenses">
                <i className="fa-solid fa-money-bill-wave me-2"></i>Expenses
              </NavDropdown.Item>
            </NavDropdown>

            <NavDropdown title="Sales" id="admin-sales-dropdown">
              <NavDropdown.Item as={Link} to="/admin/sales">
                <i className="fa-solid fa-chart-line me-2"></i>Sales
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/admin/reports">
                <i className="fa-solid fa-chart-pie me-2"></i>Reports
              </NavDropdown.Item>
            </NavDropdown>

            {/* Finance Dropdown */}
            <NavDropdown title="Finance" id="admin-finance-dropdown">
              <NavDropdown.Item as={Link} to="/admin/investments">
                <i className="fa-solid fa-chart-line me-2"></i>Investments
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/admin/expenses">
                <i className="fa-solid fa-money-bill-wave me-2"></i>Expenses
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/admin/end-of-day-report">
                <i className="fa-solid fa-file-invoice me-2"></i>End of Day Report
              </NavDropdown.Item>
            </NavDropdown>
          </>
        );

      case 'manager':
        return (
          <>
            <Nav.Link as={NavLink} to="/">Dashboard</Nav.Link>
            <Nav.Link as={NavLink} to="/employees">Employees</Nav.Link>
            <Nav.Link as={NavLink} to="/my-attendance">Attendance</Nav.Link>
            <Nav.Link as={NavLink} to="/my-leaves">Leaves</Nav.Link>
            <Nav.Link as={NavLink} to="/employee-sales">Sales</Nav.Link>
            <Nav.Link as={NavLink} to="/stock-details">Stock</Nav.Link>
            <Nav.Link as={NavLink} to="/products">Products</Nav.Link>
            <Nav.Link as={NavLink} to="/purchases">Purchases</Nav.Link>
            <Nav.Link as={NavLink} to="/expenses">Expenses</Nav.Link>
            <Nav.Link as={NavLink} to="/daily-reports">Reports</Nav.Link>
            <Nav.Link as={NavLink} to="/my-salary">
         Salary
      </Nav.Link>
      <Nav.Link as={NavLink} to="/manager/advance">
        Salary Advance
      </Nav.Link>
            {/* New Manager Advance Approvals */}
            
          </>
        );

      case 'staff':
        return (
          <>
            <Nav.Link as={NavLink} to="/">Dashboard</Nav.Link>
            <Nav.Link as={NavLink} to="/billing">Billing</Nav.Link>
            <Nav.Link as={NavLink} to="/attendance">Attendance</Nav.Link>
            <Nav.Link as={NavLink} to="/leaves">Leaves</Nav.Link>
            <Nav.Link as={NavLink} to="/products">Products</Nav.Link>
            <Nav.Link as={NavLink} to="/bills">Bills</Nav.Link>
            {/* New Staff Salary Advance */}
            <Nav.Link as={NavLink} to="/salary-advance">
              Salary Advance
            </Nav.Link>
                  <Nav.Link as={NavLink} to="/my-salary">
        Salary
      </Nav.Link>

          </>
        );

      default:
        return null;
    }
  };

  return (
    <Navbar
      bg="dark"
      variant="dark"
      expand="lg"
      className="custom-navbar py-2"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 9999
      }}
    >
      <Container fluid>
        <Navbar.Brand as={Link} to={isAuthenticated ? '/' : '/login'} className="d-flex align-items-center">
          <i className="fa-solid fa-store me-2"></i>
          <span>Fresh Super Market</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
          <Nav className="align-items-center">
            {isAuthenticated && getNavLinks()}

            {!isAuthenticated ? (
              <>
                <Nav.Link as={NavLink} to="/login">Login</Nav.Link>
                <Nav.Link as={NavLink} to="/register">Register</Nav.Link>
              </>
            ) : (
              <>
                <span className="text-white me-3">
                  <i className="fa-solid fa-user-circle me-1"></i>
                  {user?.username || user?.first_name || 'User'} ({role})
                </span>
                <Button variant="outline-light" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;