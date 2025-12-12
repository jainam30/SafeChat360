export const countryCodeToTimezone = {
    // Common codes
    '1': 'America/New_York', // USA/Canada (Defaulting to EST, hard to be precise without more info)
    '44': 'Europe/London',   // UK
    '91': 'Asia/Kolkata',    // India
    '61': 'Australia/Sydney',// Australia
    '86': 'Asia/Shanghai',   // China
    '81': 'Asia/Tokyo',      // Japan
    '49': 'Europe/Berlin',   // Germany
    '33': 'Europe/Paris',    // France (partial list)
    // Fallback
    'default': Intl.DateTimeFormat().resolvedOptions().timeZone
};

export const getTimezoneFromPhone = (phoneNumber) => {
    if (!phoneNumber) return countryCodeToTimezone['default'];

    // Clean number
    const clean = phoneNumber.replace(/[^0-9]/g, '');

    // Check common prefixes
    // This is a simplified check. A robust solution needs a library like libphonenumber-js
    // checking 1, 2, 3 digit prefixes

    for (let i = 4; i >= 1; i--) {
        const prefix = clean.substring(0, i);
        if (countryCodeToTimezone[prefix]) {
            return countryCodeToTimezone[prefix];
        }
    }

    return countryCodeToTimezone['default'];
};
