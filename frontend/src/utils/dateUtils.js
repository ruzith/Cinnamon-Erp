import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return '';
  
  // Get user's timezone from localStorage or default to 'Asia/Colombo'
  const userTimeZone = localStorage.getItem('timeZone') || 'Asia/Colombo';
  
  return dayjs(date).tz(userTimeZone).format(format);
};

export const getCurrentDateTime = () => {
  const userTimeZone = localStorage.getItem('timeZone') || 'Asia/Colombo';
  return dayjs().tz(userTimeZone);
};

export const convertToUTC = (date) => {
  if (!date) return null;
  return dayjs(date).utc().format();
};

export const convertFromUTC = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return '';
  const userTimeZone = localStorage.getItem('timeZone') || 'Asia/Colombo';
  return dayjs.utc(date).tz(userTimeZone).format(format);
}; 