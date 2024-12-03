import DashboardIcon from '@mui/icons-material/Dashboard';
import LandscapeIcon from '@mui/icons-material/Landscape';
import PeopleIcon from '@mui/icons-material/People';
import WorkIcon from '@mui/icons-material/Work';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BuildIcon from '@mui/icons-material/Build';
import FactoryIcon from '@mui/icons-material/Factory';
import InventoryIcon from '@mui/icons-material/Inventory';
import StorefrontIcon from '@mui/icons-material/Storefront';
import BusinessIcon from '@mui/icons-material/Business';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';

export const menuItems = [
    {
        path: '/',
        text: 'Dashboard',
        icon: <DashboardIcon />
    },
    {
        path: '/lands',
        text: 'Land Management',
        icon: <LandscapeIcon />
    },
    {
        path: '/users',
        text: 'User Management',
        icon: <PeopleIcon />
    },
    {
        path: '/employees',
        text: 'Employee Management',
        icon: <WorkIcon />
    },
    {
        path: '/tasks',
        text: 'Task Management',
        icon: <AssignmentIcon />
    },

    {
        path: '/cutting',
        text: 'Cutting Management',
        icon: <BuildIcon />
    },
    {
        path: '/manufacturing',
        text: 'Manufacturing',
        icon: <FactoryIcon />
    },
    {
        path: '/inventory',
        text: 'Inventory',
        icon: <InventoryIcon />
    },
    {
        path: '/sales',
        text: 'Sales',
        icon: <StorefrontIcon />
    },
    {
        path: '/assets',
        text: 'Asset Management',
        icon: <BusinessIcon />
    },
    {
        path: '/accounting',
        text: 'Accounting',
        icon: <AccountBalanceIcon />
    },
    {
        path: '/loans',
        text: 'Loan Book',
        icon: <AccountBalanceWalletIcon />
    },
    {
        path: '/reports',
        text: 'Reports',
        icon: <AssessmentIcon />
    },
    {
        path: '/settings',
        text: 'Settings',
        icon: <SettingsIcon />
    }
]; 