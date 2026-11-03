/**
 * Formats a phone number into a standardized format
 * @param {string|number} phone - The phone number to format
 * @param {Object} [options] - Formatting options
 * @param {string} [options.country='KH'] - Country code for formatting (KH, US, CA, UK, etc.)
 * @param {boolean} [options.withCountryCode=false] - Whether to include country code
 * @param {boolean} [options.keepZeroPrefix=true] - For KH: keeps leading 0 when withCountryCode=false
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(phone, options = {}) {
    const defaults = {
      country: 'KH', // Cambodia as default
      withCountryCode: false,
      keepZeroPrefix: true // For Cambodia numbers
    };
    const config = {...defaults, ...options};
    
    // Convert to string and remove all non-digit characters
    let cleaned = String(phone).replace(/\D/g, '');
    
    // Handle different country formats
    switch(config.country.toUpperCase()) {
      case 'KH': // Cambodia - default
        // Cambodia formats:
        // Local: 012 345 678 or 097 123 4567
        // International: +855 12 345 678 or +855 97 123 4567
        if (cleaned.startsWith('855')) {
          // Already has country code
          const match = cleaned.match(/^855(\d{2})(\d{3})(\d{3,4})$/);
          if (match) {
            return config.withCountryCode 
              ? `+855 ${match[1]} ${match[2]} ${match[3]}`
              : (config.keepZeroPrefix ? `0${match[1]} ${match[2]} ${match[3]}` : `${match[1]} ${match[2]} ${match[3]}`);
          }
        } else if (cleaned.startsWith('0')) {
          // Local format with leading 0
          const match = cleaned.match(/^0(\d{2})(\d{3})(\d{3,4})$/);
          if (match) {
            return config.withCountryCode 
              ? `+855 ${match[1]} ${match[2]} ${match[3]}`
              : (config.keepZeroPrefix ? `0${match[1]} ${match[2]} ${match[3]}` : `${match[1]} ${match[2]} ${match[3]}`);
          }
        } else {
          // No country code or leading zero (treat as local without 0)
          const match = cleaned.match(/^(\d{2})(\d{3})(\d{3,4})$/);
          if (match) {
            return config.withCountryCode 
              ? `+855 ${match[1]} ${match[2]} ${match[3]}`
              : (config.keepZeroPrefix ? `0${match[1]} ${match[2]} ${match[3]}` : `${match[1]} ${match[2]} ${match[3]}`);
          }
        }
        break;
  
        case 'US':
            case 'CA':
              // US/Canada format: (123) 456-7890 or +1 (123) 456-7890
              if (cleaned.length === 10) {
                const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
                if (match) {
                  return config.withCountryCode 
                    ? `+1 (${match[1]}) ${match[2]}-${match[3]}`
                    : `(${match[1]}) ${match[2]}-${match[3]}`;
                }
              } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
                const match = cleaned.match(/^1(\d{3})(\d{3})(\d{4})$/);
                if (match) {
                  return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
                }
              }
              break;
              
            case 'UK':
              // UK format: 01234 567890 or +44 1234 567890
              if (cleaned.length === 10 || cleaned.length === 11) {
                if (cleaned.startsWith('0')) {
                  const match = cleaned.match(/^0(\d{4,5})(\d{6})$/);
                  if (match) {
                    return config.withCountryCode
                      ? `+44 ${match[1]} ${match[2]}`
                      : `${match[1]} ${match[2]}`;
                  }
                } else if (cleaned.startsWith('44')) {
                  const match = cleaned.match(/^44(\d{4,5})(\d{6})$/);
                  if (match) {
                    return `+44 ${match[1]} ${match[2]}`;
                  }
                }
              }
              break;
              
            case 'AU':
              // Australia format: (02) 1234 5678 or +61 2 1234 5678

              if (cleaned.length === 9 || cleaned.length === 10) {
                if (cleaned.startsWith('0')) {
                  const match = cleaned.match(/^0(\d)(\d{4})(\d{4})$/);
                  if (match) {
                    return config.withCountryCode
                      ? `+61 ${match[1]} ${match[2]} ${match[3]}`
                      : `(${match[1]}${match[1]}) ${match[2]} ${match[3]}`;
                  }
                } else if (cleaned.startsWith('61')) {
                  const match = cleaned.match(/^61(\d)(\d{4})(\d{4})$/);
                  if (match) {
                    return `+61 ${match[1]} ${match[2]} ${match[3]}`;
                  }
                }
              }
              break;
              
            case 'KH': // Cambodia
              // Cambodia format: 012 345 678 or +855 12 345 678
              if (cleaned.length === 9 || cleaned.length === 11) {
                if (cleaned.startsWith('0')) {
                  const match = cleaned.match(/^0(\d{2})(\d{3})(\d{3,4})$/);
                  if (match) {
                    return config.withCountryCode
                      ? `+855 ${match[1]} ${match[2]} ${match[3]}`
                      : `0${match[1]} ${match[2]} ${match[3]}`;
                  }
                } else if (cleaned.startsWith('855')) {
                  const match = cleaned.match(/^855(\d{2})(\d{3})(\d{3,4})$/);
                  if (match) {
                    return `+855 ${match[1]} ${match[2]} ${match[3]}`;
                  }
                }
              }
              break;
              
            default:
              // Default international format: +[country code] [number]
              if (cleaned.length > 3) {
                return `+${cleaned}`;
              }
          }
    
    // Fallback: return the original number if no formatting matched
    return phone;
  }


//   // Direct usage without imports
// const phone1 = formatPhoneNumber('012345678'); // 012 345 678
// const phone2 = formatPhoneNumber('0971234567', {withCountryCode: true}); // +855 97 123 4567

// // Cambodian numbers - default behavior
// formatPhoneNumber('012345678'); // 012 345 678
// formatPhoneNumber('0971234567'); // 097 123 4567
// formatPhoneNumber('12345678'); // 012 345 678 (auto-adds 0 if missing)

// // With country code
// formatPhoneNumber('85512345678', {withCountryCode: true}); // +855 12 345 678
// formatPhoneNumber('012345678', {withCountryCode: true}); // +855 12 345 678

// // Without zero prefix
// formatPhoneNumber('12345678', {keepZeroPrefix: false}); // 12 345 678
// formatPhoneNumber('012345678', {keepZeroPrefix: false}); // 12 345 678

// // Other countries still work
// formatPhoneNumber('1234567890', {country: 'US'}); // (123) 456-7890
