import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Box
} from '@mui/material';
import {
  Dashboard,
  Terrain,
  People,
  Assignment,
  LocalFlorist,
  Inventory,
  ShoppingCart,
  Business,
  AccountBalance,
  Book,
  Assessment,
  Settings,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material';
import { useState } from 'react';

const menuItems = [
  { path: '/', icon: <Dashboard />, label: 'Dashboard' },
  { path: '/lands', icon: <Terrain />, label: 'Land Management' },
  { path: '/users', icon: <People />, label: 'User Management' },
  { path: '/employees', icon: <People />, label: 'Employee Management' },
  { path: '/tasks', icon: <Assignment />, label: 'Task Management' },
  {
    label: 'Operations',
    icon: <LocalFlorist />,
    children: [
      { path: '/cutting', label: 'Cutting Management' },
      { path: '/manufacturing', label: 'Manufacturing' }
    ]
  },
  { path: '/inventory', icon: <Inventory />, label: 'Inventory' },
  { path: '/sales', icon: <ShoppingCart />, label: 'Sales' },
  { path: '/assets', icon: <Business />, label: 'Asset Management' },
  { path: '/accounting', icon: <AccountBalance />, label: 'Accounting' },
  { path: '/loans', icon: <Book />, label: 'Loan Book' },
  { path: '/reports', icon: <Assessment />, label: 'Reports' },
  { path: '/settings', icon: <Settings />, label: 'Settings' }
];

const Sidebar = ({ width = 240 }) => {
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState('');

  const handleSubmenuClick = (label) => {
    setOpenSubmenu(openSubmenu === label ? '' : label);
  };

  const renderMenuItem = (item) => {
    if (item.children) {
      return (
        <div key={item.label}>
          <ListItem button onClick={() => handleSubmenuClick(item.label)}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
            {openSubmenu === item.label ? <ExpandLess /> : <ExpandMore />}
          </ListItem>
          <Collapse in={openSubmenu === item.label} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map((child) => (
                <ListItem
                  button
                  key={child.path}
                  component={Link}
                  to={child.path}
                  selected={location.pathname === child.path}
                  sx={{ pl: 4 }}
                >
                  <ListItemText primary={child.label} />
                </ListItem>
              ))}
            </List>
          </Collapse>
        </div>
      );
    }

    return (
      <ListItem
        button
        key={item.path}
        component={Link}
        to={item.path}
        selected={location.pathname === item.path}
      >
        <ListItemIcon>{item.icon}</ListItemIcon>
        <ListItemText primary={item.label} />
      </ListItem>
    );
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: width,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="div">
          Cinnamon ERP
        </Typography>
      </Box>
      <List>
        {menuItems.map((item) => renderMenuItem(item))}
      </List>
    </Drawer>
  );
};

export default Sidebar; 