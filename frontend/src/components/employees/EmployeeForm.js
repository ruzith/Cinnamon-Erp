import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createEmployee, updateEmployee } from '../../features/employees/employeeSlice';
import { getDesignations } from '../../features/designations/designationSlice';

const EmployeeForm = ({ employee, setIsEditing }) => {
  const dispatch = useDispatch();
  const { designations } = useSelector((state) => state.designations);

  const [formData, setFormData] = useState({
    name: employee ? employee.name : '',
    nic: employee ? employee.nic : '',
    phone: employee ? employee.phone : '',
    address: employee ? employee.address : '',
    birthday: employee ? new Date(employee.birthday).toISOString().split('T')[0] : '',
    designation_id: employee ? employee.designation_id : '',
    employment_type: employee ? employee.employment_type : 'permanent',
    status: employee ? employee.status : 'active',
    salary_structure_id: employee ? employee.salary_structure_id : '',
    bank_name: employee ? employee.bank_name : '',
    account_number: employee ? employee.account_number : '',
    account_name: employee ? employee.account_name : ''
  });

  useEffect(() => {
    dispatch(getDesignations());
  }, [dispatch]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    
    if (employee) {
      dispatch(updateEmployee({ id: employee.id, employeeData: formData }));
      setIsEditing(false);
    } else {
      dispatch(createEmployee(formData));
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="form-group">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={onChange}
          placeholder="Full Name"
          required
        />
      </div>
      <div className="form-group">
        <input
          type="text"
          name="nic"
          value={formData.nic}
          onChange={onChange}
          placeholder="NIC Number"
          required
        />
      </div>
      <div className="form-group">
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={onChange}
          placeholder="Phone Number"
          required
        />
      </div>
      <div className="form-group">
        <textarea
          name="address"
          value={formData.address}
          onChange={onChange}
          placeholder="Address"
          required
        />
      </div>
      <div className="form-group">
        <input
          type="date"
          name="birthday"
          value={formData.birthday}
          onChange={onChange}
          required
        />
      </div>
      <div className="form-group">
        <select 
          name="designation_id" 
          value={formData.designation_id}
          onChange={onChange}
          required
        >
          <option value="">Select Designation</option>
          {designations.map(designation => (
            <option key={designation.id} value={designation.id}>
              {designation.title}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <select
          name="employment_type"
          value={formData.employment_type}
          onChange={onChange}
          required
        >
          <option value="permanent">Permanent</option>
          <option value="temporary">Temporary</option>
        </select>
      </div>
      <div className="form-group">
        <select
          name="status"
          value={formData.status}
          onChange={onChange}
          required
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div className="form-group">
        <input
          type="text"
          name="bank_name"
          value={formData.bank_name}
          onChange={onChange}
          placeholder="Bank Name"
        />
      </div>
      <div className="form-group">
        <input
          type="text"
          name="account_number"
          value={formData.account_number}
          onChange={onChange}
          placeholder="Account Number"
        />
      </div>
      <div className="form-group">
        <input
          type="text"
          name="account_name"
          value={formData.account_name}
          onChange={onChange}
          placeholder="Account Name"
        />
      </div>
      <button type="submit">
        {employee ? 'Update Employee' : 'Add Employee'}
      </button>
    </form>
  );
};

export default EmployeeForm; 