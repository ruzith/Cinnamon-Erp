import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
} from '@mui/material';
import { Link } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LandscapeIcon from '@mui/icons-material/Landscape';
import PeopleIcon from '@mui/icons-material/People';
import WorkIcon from '@mui/icons-material/Work';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BuildIcon from '@mui/icons-material/Build';
import FactoryIcon from '@mui/icons-material/Factory';
import InventoryIcon from '@mui/icons-material/Inventory';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BadgeIcon from '@mui/icons-material/Badge';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Land Management', icon: <LandscapeIcon />, path: '/lands' },
  { text: 'User Management', icon: <PeopleIcon />, path: '/users' },
  { text: 'Employee Management', icon: <WorkIcon />, path: '/employees' },
  { text: 'Task Management', icon: <AssignmentIcon />, path: '/tasks' },
  { text: 'Cutting Management', icon: <BuildIcon />, path: '/cutting' },
  { text: 'Manufacturing', icon: <FactoryIcon />, path: '/manufacturing' },
  { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
  { text: 'Sales', icon: <StorefrontIcon />, path: '/sales' },
  { text: 'Asset Management', icon: <AccountBalanceIcon />, path: '/assets' },
  { text: 'Accounting', icon: <ReceiptIcon />, path: '/accounting' },
  { text: 'Loan Book', icon: <AccountBalanceWalletIcon />, path: '/loans' },
  { text: 'HR', icon: <BadgeIcon />, path: '/hr' },
  { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

function SidebarMenu() {
  return (
    <div>
      <Toolbar />
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem button key={item.text} component={Link} to={item.path}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </div>
  );
}

export default SidebarMenu; 