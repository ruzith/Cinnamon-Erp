import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { createUser, updateUser, getUsers } from '../../features/users/userSlice';
import axios from 'axios';

const UserForm = ({ user, setIsEditing }) => {
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: user ? user.name : '',
    email: user ? user.email : '',
    password: '',
    role: user ? user.role : 'staff',
    status: user ? user.status : 'active'
  });

  const { name, email, password, role, status } = formData;

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (user) {
        dispatch(updateUser({ id: user._id, userData: formData }));
        setIsEditing(false);
      } else {
        dispatch(createUser(formData));
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      // Handle error appropriately
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        dispatch(getUsers());
      } catch (error) {
        console.error('Error fetching users:', error);
        // Handle error appropriately
      }
    };

    fetchUsers();
  }, [dispatch]);

  return (
    <form onSubmit={onSubmit}>
      <div className="form-group">
        <input
          type="text"
          name="name"
          value={name}
          onChange={onChange}
          placeholder="Full Name"
          required
        />
      </div>
      <div className="form-group">
        <input
          type="email"
          name="email"
          value={email}
          onChange={onChange}
          placeholder="Email Address"
          required
        />
      </div>
      {!user && (
        <div className="form-group">
          <input
            type="password"
            name="password"
            value={password}
            onChange={onChange}
            placeholder="Password"
            required
          />
        </div>
      )}
      <div className="form-group">
        <select name="role" value={role} onChange={onChange}>
          <option value="staff">Staff</option>
          <option value="accountant">Accountant</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="form-group">
        <select name="status" value={status} onChange={onChange}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <button type="submit">{user ? 'Update User' : 'Add User'}</button>
    </form>
  );
};

export default UserForm; 