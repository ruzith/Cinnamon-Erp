import { SvgIcon } from '@mui/material';

const CinnamonLogo = (props) => (
  <SvgIcon {...props} viewBox="0 0 32 32">
    {/* Cinnamon Stick - Main */}
    <path 
      d="M8 24C8 24 12 20 14 16C16 12 16 8 16 8C16 8 16 12 18 16C20 20 24 24 24 24" 
      stroke="#8B4513" 
      strokeWidth="2.5" 
      strokeLinecap="round"
      fill="none"
    />
    
    {/* Cinnamon Texture */}
    <path 
      d="M10 22C10 22 13 19 15 16M13 20C13 20 15 18 17 15M19 20C19 20 21 18 23 15" 
      stroke="#D2691E" 
      strokeWidth="1" 
      strokeLinecap="round"
      fill="none"
      opacity="0.6"
    />
    
    {/* Cinnamon Curl */}
    <path 
      d="M12 6C12 6 16 8 20 6" 
      stroke="#8B4513" 
      strokeWidth="2" 
      strokeLinecap="round"
      fill="none"
      opacity="0.8"
    />
    
    {/* Leaves */}
    <path 
      d="M22 10C22 10 24 8 26 10C28 12 26 14 26 14C26 14 28 12 28 14C28 16 26 18 26 18" 
      stroke="#2E7D32" 
      strokeWidth="1.5" 
      strokeLinecap="round"
      fill="none"
      opacity="0.9"
    />
    
    {/* Small Leaf */}
    <path 
      d="M20 8C20 8 21 7 22 8" 
      stroke="#2E7D32" 
      strokeWidth="1" 
      strokeLinecap="round"
      fill="none"
      opacity="0.7"
    />
  </SvgIcon>
);

export default CinnamonLogo; 