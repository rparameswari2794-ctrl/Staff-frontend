// src/pages/MySalaryWrapper.jsx
import { useSelector } from 'react-redux';
import ManagerSalary from './manager/ManagerSalary';
import StaffSalary from './staff/MySalary';

const MySalaryWrapper = () => {
    const { role } = useSelector((state) => state.auth);
    
    console.log('MySalaryWrapper - User role:', role);
    
    if (role === 'manager') {
        return <ManagerSalary />;
    }
    // Default to staff salary for staff and any other role
    return <StaffSalary />;
};

export default MySalaryWrapper;