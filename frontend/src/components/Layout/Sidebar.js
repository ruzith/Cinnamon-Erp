import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    Box,
    Typography,
    Divider,
    Collapse,
    alpha,
    Toolbar
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { menuItems } from './SidebarMenu';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = React.useState({});

    const handleClick = (path) => {
        navigate(path);
    };

    const handleCollapse = (itemId) => {
        setOpen(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    const renderMenuItem = (item, depth = 0) => {
        const isSelected = location.pathname === item.path;
        const hasSubItems = item.subItems && item.subItems.length > 0;

        return (
            <React.Fragment key={item.text}>
                <ListItem
                    disablePadding
                    sx={{
                        display: 'block',
                        mb: 0.5,
                        height: 72,
                    }}
                >
                    <ListItemButton
                        onClick={() => hasSubItems ? handleCollapse(item.text) : handleClick(item.path)}
                        sx={{
                            height: '100%',
                            px: 2.5,
                            ml: depth * 2,
                            borderRadius: '12px',
                            position: 'relative',
                            '&:hover': {
                                backgroundColor: (theme) =>
                                    alpha(theme.palette.primary.main, 0.08),
                            },
                            ...(isSelected && {
                                backgroundColor: (theme) =>
                                    alpha(theme.palette.primary.main, 0.12),
                                '&:hover': {
                                    backgroundColor: (theme) =>
                                        alpha(theme.palette.primary.main, 0.16),
                                },
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    left: 0,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    height: '60%',
                                    width: '4px',
                                    backgroundColor: 'primary.main',
                                    borderRadius: '0 4px 4px 0',
                                },
                            }),
                        }}
                    >
                        <ListItemIcon
                            sx={{
                                minWidth: 40,
                                color: isSelected ? 'primary.main' : 'inherit',
                                '& svg': {
                                    fontSize: 24,
                                    transition: '0.2s',
                                    ...(isSelected && {
                                        transform: 'scale(1.1)',
                                    }),
                                },
                            }}
                        >
                            {item.icon}
                        </ListItemIcon>
                        <ListItemText
                            primary={item.text}
                            primaryTypographyProps={{
                                fontSize: '0.875rem',
                                fontWeight: isSelected ? 600 : 400,
                                color: isSelected ? 'primary.main' : 'text.primary',
                            }}
                        />
                        {hasSubItems && (
                            open[item.text] ? <ExpandLess /> : <ExpandMore />
                        )}
                    </ListItemButton>
                </ListItem>

                {hasSubItems && (
                    <Collapse in={open[item.text]} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {item.subItems.map((subItem) =>
                                renderMenuItem(subItem, depth + 1)
                            )}
                        </List>
                    </Collapse>
                )}
            </React.Fragment>
        );
    };

    return (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            <Box
                sx={{
                    flex: 1,
                    px: 2,
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': {
                        width: '6px',
                        background: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: (theme) =>
                            theme.palette.mode === 'light'
                                ? 'rgba(0, 0, 0, 0.2)'
                                : 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '3px',
                        '&:hover': {
                            background: (theme) =>
                                theme.palette.mode === 'light'
                                    ? 'rgba(0, 0, 0, 0.3)'
                                    : 'rgba(255, 255, 255, 0.3)',
                        },
                    },
                    '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                    },
                    scrollbarWidth: 'thin',
                    scrollbarColor: (theme) => `
            ${theme.palette.mode === 'light'
                            ? 'rgba(0, 0, 0, 0.2)'
                            : 'rgba(255, 255, 255, 0.2)'}
            transparent`,
                }}
            >
                <List sx={{ px: 1 }}>
                    {menuItems.map((item) => renderMenuItem(item))}
                </List>
            </Box>

            <Divider sx={{ mt: 2 }} />

            <Box
                sx={{
                    p: 2,
                    textAlign: 'center',
                }}
            >
                <Typography
                    variant="caption"
                    sx={{
                        color: 'text.secondary',
                        fontSize: '0.75rem',
                    }}
                >
                    © 2024 Cinnamon ERP
                </Typography>
            </Box>
        </Box>
    );
};

export default Sidebar; 