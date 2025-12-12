import { getTimezoneFromPhone } from './timeZoneMap';

export const formatTimeForUser = (dateString, userPhoneNumber) => {
    if (!dateString) return '';

    // Check if valid date
    let cleanDateString = dateString;
    // Force UTC if missing Z/offset
    if (dateString && typeof dateString === 'string' && !dateString.endsWith('Z') && !dateString.includes('+')) {
        cleanDateString = dateString + 'Z';
    }

    const date = new Date(cleanDateString);
    if (isNaN(date.getTime())) return dateString;

    const timeZone = getTimezoneFromPhone(userPhoneNumber);

    try {
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: timeZone
        }).format(date);
    } catch (e) {
        console.error("Date formatting error", e);
        // Fallback to local
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
};

export const formatDateForUser = (dateString, userPhoneNumber) => {
    if (!dateString) return '';

    let cleanDateString = dateString;
    if (dateString && !dateString.endsWith('Z') && !dateString.includes('+')) {
        cleanDateString = dateString + 'Z';
    }

    const date = new Date(cleanDateString);
    if (isNaN(date.getTime())) return dateString;

    const timeZone = getTimezoneFromPhone(userPhoneNumber);

    try {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: timeZone
        }).format(date);
    } catch (e) {
        return date.toLocaleString();
    }
};
