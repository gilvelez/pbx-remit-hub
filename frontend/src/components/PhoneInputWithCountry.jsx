/**
 * PhoneInputWithCountry - Reusable phone input with country code selector
 * Supports: US (+1), Philippines (+63)
 * Returns E.164 formatted phone number
 */
import React, { useState, useEffect } from "react";

// Supported countries
const COUNTRIES = [
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸", placeholder: "555 123 4567", digits: 10 },
  { code: "PH", name: "Philippines", dialCode: "+63", flag: "🇵🇭", placeholder: "917 123 4567", digits: 10 },
];

export default function PhoneInputWithCountry({ 
  value, 
  onChange, 
  onValidChange,
  disabled = false,
  error = null,
}) {
  const [country, setCountry] = useState(COUNTRIES[0]); // Default to US
  const [localNumber, setLocalNumber] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [validationError, setValidationError] = useState(null);

  // Parse initial value if provided (E.164 format)
  useEffect(() => {
    if (value && value.startsWith("+")) {
      // Try to detect country from value
      for (const c of COUNTRIES) {
        if (value.startsWith(c.dialCode)) {
          setCountry(c);
          setLocalNumber(value.slice(c.dialCode.length));
          break;
        }
      }
    }
  }, []);

  // Validate and format number
  const validateNumber = (num, selectedCountry) => {
    // Remove all non-digits
    const digitsOnly = num.replace(/\D/g, "");
    
    // For PH, handle leading 0 (e.g., 09171234567 → 9171234567)
    let normalizedDigits = digitsOnly;
    if (selectedCountry.code === "PH" && digitsOnly.startsWith("0") && digitsOnly.length === 11) {
      normalizedDigits = digitsOnly.slice(1);
    }
    
    // Check length
    if (normalizedDigits.length < selectedCountry.digits) {
      return { valid: false, error: `Enter a valid phone number for ${selectedCountry.name}`, e164: null };
    }
    
    if (normalizedDigits.length > selectedCountry.digits) {
      return { valid: false, error: `Phone number too long for ${selectedCountry.name}`, e164: null };
    }
    
    // Build E.164
    const e164 = `${selectedCountry.dialCode}${normalizedDigits}`;
    return { valid: true, error: null, e164 };
  };

  // Handle local number change
  const handleNumberChange = (e) => {
    const input = e.target.value;
    // Only allow digits and spaces
    const cleaned = input.replace(/[^\d\s]/g, "");
    setLocalNumber(cleaned);
    
    const validation = validateNumber(cleaned, country);
    setValidationError(validation.error);
    
    // Notify parent
    if (onChange) {
      onChange({
        country_code: country.dialCode,
        local_number: cleaned.replace(/\D/g, ""),
        phone_e164: validation.e164,
        isValid: validation.valid,
      });
    }
    
    if (onValidChange) {
      onValidChange(validation.valid);
    }
  };

  // Handle country change
  const handleCountryChange = (newCountry) => {
    setCountry(newCountry);
    setShowDropdown(false);
    
    // Re-validate with new country
    const validation = validateNumber(localNumber, newCountry);
    setValidationError(validation.error);
    
    if (onChange) {
      onChange({
        country_code: newCountry.dialCode,
        local_number: localNumber.replace(/\D/g, ""),
        phone_e164: validation.e164,
        isValid: validation.valid,
      });
    }
    
    if (onValidChange) {
      onValidChange(validation.valid);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {/* Country Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setShowDropdown(!showDropdown)}
            disabled={disabled}
            className="h-12 px-3 bg-gray-100 border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
            data-testid="country-selector"
          >
            <span className="text-xl">{country.flag}</span>
            <span className="text-sm font-medium text-gray-700">{country.dialCode}</span>
            <svg className={`w-4 h-4 text-gray-400 transition ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleCountryChange(c)}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition text-left ${
                    country.code === c.code ? 'bg-gray-50' : ''
                  }`}
                  data-testid={`country-option-${c.code}`}
                >
                  <span className="text-2xl">{c.flag}</span>
                  <div className="flex-1">
                    <p className="font-medium text-[#0A2540]">{c.name}</p>
                    <p className="text-sm text-gray-500">{c.dialCode}</p>
                  </div>
                  {country.code === c.code && (
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center">More countries coming soon</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Phone Number Input */}
        <input
          type="tel"
          value={localNumber}
          onChange={handleNumberChange}
          placeholder={country.placeholder}
          disabled={disabled}
          className="flex-1 h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
          data-testid="phone-number-input"
        />
      </div>
      
      {/* Validation Error */}
      {(validationError || error) && localNumber.length > 0 && (
        <p className="text-xs text-red-500 ml-1" data-testid="phone-validation-error">
          {error || validationError}
        </p>
      )}
    </div>
  );
}

// Export countries for external use
export { COUNTRIES };
