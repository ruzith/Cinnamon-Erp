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
    Toolbar,
    Paper,
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { menuItems } from './SidebarMenu';
import { motion } from 'framer-motion';

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

    const renderMenuItem = (item, depth = 0, index) => {
        const isSelected = location.pathname === item.path;
        const hasSubItems = item.subItems && item.subItems.length > 0;

        return (
            <motion.div
                key={item.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
            >
                <ListItem
                    disablePadding
                    sx={{
                        display: 'block',
                        mb: 0.8,
                    }}
                >
                    <ListItemButton
                        onClick={() => hasSubItems ? handleCollapse(item.text) : handleClick(item.path)}
                        sx={{
                            minHeight: 48,
                            px: 2.5,
                            ml: depth * 2,
                            borderRadius: '12px',
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: (theme) =>
                                    isSelected
                                        ? `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(theme.palette.primary.main, 0.05)})`
                                        : 'transparent',
                                opacity: isSelected ? 1 : 0,
                                transition: 'opacity 0.3s ease',
                            },
                            '&:hover': {
                                backgroundColor: (theme) =>
                                    alpha(theme.palette.primary.main, 0.08),
                                transform: 'translateX(4px)',
                                '& .MuiListItemIcon-root': {
                                    transform: 'scale(1.1)',
                                },
                            },
                            ...(isSelected && {
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    left: 0,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    height: '60%',
                                    width: '4px',
                                    background: (theme) => `linear-gradient(180deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.6)})`,
                                    borderRadius: '0 4px 4px 0',
                                    boxShadow: (theme) => `0 0 8px ${alpha(theme.palette.primary.main, 0.4)}`,
                                },
                            }),
                        }}
                    >
                        <ListItemIcon
                            sx={{
                                minWidth: 40,
                                color: isSelected ? 'primary.main' : 'text.secondary',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '& svg': {
                                    fontSize: 24,
                                    transition: '0.3s',
                                    ...(isSelected && {
                                        transform: 'scale(1.1)',
                                        filter: (theme) => `drop-shadow(0 0 6px ${alpha(theme.palette.primary.main, 0.4)})`,
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
                                fontWeight: isSelected ? 600 : 500,
                                color: isSelected ? 'primary.main' : 'text.primary',
                                sx: {
                                    transition: 'all 0.3s ease',
                                    ...(isSelected && {
                                        textShadow: (theme) => `0 0 8px ${alpha(theme.palette.primary.main, 0.4)}`,
                                    }),
                                }
                            }}
                        />
                        {hasSubItems && (
                            <Box
                                component={motion.div}
                                animate={{ rotate: open[item.text] ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {open[item.text] ? <ExpandLess /> : <ExpandMore />}
                            </Box>
                        )}
                    </ListItemButton>
                </ListItem>

                {hasSubItems && (
                    <Collapse in={open[item.text]} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {item.subItems.map((subItem, subIndex) =>
                                renderMenuItem(subItem, depth + 1, subIndex)
                            )}
                        </List>
                    </Collapse>
                )}
            </motion.div>
        );
    };

    return (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                bgcolor: (theme) => alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(10px)',
            }}
        >
            <Box
                sx={{
                    flex: 1,
                    px: 2,
                    py: 2,
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': {
                        width: '6px',
                        background: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: (theme) =>
                            alpha(theme.palette.primary.main, 0.2),
                        borderRadius: '3px',
                        '&:hover': {
                            background: (theme) =>
                                alpha(theme.palette.primary.main, 0.3),
                        },
                    },
                    '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                    },
                    scrollbarWidth: 'thin',
                    scrollbarColor: (theme) => `
                        ${alpha(theme.palette.primary.main, 0.2)}
                        transparent
                    `,
                }}
            >
                <List sx={{ px: 1 }}>
                    {menuItems.map((item, index) => renderMenuItem(item, 0, index))}
                </List>
            </Box>

            <Divider sx={{
                my: 2,
                borderColor: (theme) => alpha(theme.palette.divider, 0.1),
                background: (theme) => `linear-gradient(90deg,
                    ${alpha(theme.palette.primary.main, 0.1)} 0%,
                    ${alpha(theme.palette.primary.main, 0.05)} 50%,
                    ${alpha(theme.palette.primary.main, 0)} 100%
                )`,
            }} />

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
                        opacity: 0.8,
                        transition: 'opacity 0.3s ease',
                        '&:hover': {
                            opacity: 1,
                        },
                    }}
                >
                    © {new Date().getFullYear()} Cinnamon ERP
                </Typography>
            </Box>
        </Box>
    );
};

export default Sidebar;