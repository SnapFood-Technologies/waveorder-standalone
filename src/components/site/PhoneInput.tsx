// Enhanced Phone Input Component
import React, { useState, useEffect } from 'react'
import { Phone } from 'lucide-react'

interface PhoneInputProps {
  value: string
  onChange: (phone: string) => void
  storeData: any
  primaryColor: string
  disabled?: boolean
  required?: boolean
  translations: any
}

// Country configurations based on business location
const COUNTRY_CONFIGS = {
  AL: { // Albania - 9 digits after +355
    prefix: '+355',
    placeholder: '68 123 4567',
    pattern: /^(\+355|355)0?[6-9]\d{8}$/,
    flag: '🇦🇱',
    name: 'Albania',
    format: (num: string) => {
      const clean = num.replace(/\D/g, '')
      if (clean.length >= 8) {
        return clean.replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3')
      }
      return clean
    }
  },
  US: { // United States - 10 digits after +1
    prefix: '+1',
    placeholder: '(555) 123-4567',
    pattern: /^(\+1|1)[2-9]\d{9}$/,
    flag: '🇺🇸',
    name: 'United States',
    format: (num: string) => {
      const clean = num.replace(/\D/g, '')
      if (clean.length >= 10) {
        return clean.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
      }
      return clean
    }
  },
  GR: { // Greece - 10 digits after +30
    prefix: '+30',
    placeholder: '694 123 4567',
    pattern: /^(\+30|30)0?[2-9]\d{9}$/,
    flag: '🇬🇷',
    name: 'Greece',
    format: (num: string) => {
      const clean = num.replace(/\D/g, '')
      if (clean.length >= 10) {
        return clean.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
      }
      return clean
    }
  },
  IT: { // Italy - 9-10 digits after +39 (preserve leading 0 for landlines)
    prefix: '+39',
    placeholder: '345 123 4567',
    pattern: /^(\+39|39)([0-9]{9,10})$/,
    flag: '🇮🇹',
    name: 'Italy',
    format: (num: string) => {
      const clean = num.replace(/\D/g, '')
      if (clean.length >= 10) {
        return clean.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
      }
      return clean
    }
  },
  ES: { // Spain - 9 digits after +34
    prefix: '+34',
    placeholder: '612 345 678',
    pattern: /^(\+34|34)[6-9]\d{8}$/,
    flag: '🇪🇸',
    name: 'Spain',
    format: (num: string) => {
      const clean = num.replace(/\D/g, '')
      if (clean.length >= 9) {
        return clean.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')
      }
      return clean
    }
  },
  DEFAULT: {
    prefix: '+1',
    placeholder: 'Enter phone number',
    pattern: /^\+?[\d]{10,15}$/,
    flag: '🌍',
    name: 'Other',
    format: (num: string) => num
  }
}

// Detect country from user's location and business data
function detectCountryFromBusiness(storeData: any): keyof typeof COUNTRY_CONFIGS {
  // PRIMARY: Check business latitude/longitude coordinates (most reliable for business location)
  if (storeData?.storeLatitude && storeData?.storeLongitude) {
    const lat = storeData.storeLatitude
    const lng = storeData.storeLongitude
    
    // Albania boundaries: approximately 39.6-42.7°N, 19.3-21.1°E
    if (lat >= 39.6 && lat <= 42.7 && lng >= 19.3 && lng <= 21.1) {
      return 'AL'
    }
    
    // Greece boundaries: approximately 34.8-41.8°N, 19.3-28.2°E
    if (lat >= 34.8 && lat <= 41.8 && lng >= 19.3 && lng <= 28.2) {
      return 'GR'
    }
    
    // Italy boundaries: approximately 35.5-47.1°N, 6.6-18.5°E
    if (lat >= 35.5 && lat <= 47.1 && lng >= 6.6 && lng <= 18.5) {
      return 'IT'
    }
    
    // Spain boundaries: approximately 36.0-43.8°N, -9.3 to 4.3°E
    if (lat >= 36.0 && lat <= 43.8 && lng >= -9.3 && lng <= 4.3) {
      return 'ES'
    }
    
    // United States boundaries: approximately 24-71°N, -180 to -66°W
    if (lat >= 24 && lat <= 71 && lng >= -180 && lng <= -66) {
      return 'US'
    }
  }
  
  // SECONDARY: Check whatsapp number prefix
  if (storeData?.whatsappNumber?.startsWith('+355')) return 'AL'
  if (storeData?.whatsappNumber?.startsWith('+30')) return 'GR'
  if (storeData?.whatsappNumber?.startsWith('+39')) return 'IT'
  if (storeData?.whatsappNumber?.startsWith('+34')) return 'ES'
  if (storeData?.whatsappNumber?.startsWith('+1')) return 'US'
  
  // TERTIARY: Check business indicators
  if (storeData?.currency === 'ALL' || storeData?.language === 'sq') return 'AL'
  if (storeData?.currency === 'EUR' && storeData?.language === 'el') return 'GR'
  if (storeData?.currency === 'EUR' && storeData?.language === 'it') return 'IT'
  if (storeData?.currency === 'EUR' && storeData?.language === 'es') return 'ES'
  
  // DEFAULT: Use US if all detection methods fail
  return 'US'
}

// Detect country from the phone number prefix that user typed
function detectCountryFromPrefix(phoneValue: string): keyof typeof COUNTRY_CONFIGS {
  if (phoneValue.startsWith('+355')) return 'AL'
  if (phoneValue.startsWith('+30')) return 'GR'
  if (phoneValue.startsWith('+39')) return 'IT'
  if (phoneValue.startsWith('+34')) return 'ES'
  if (phoneValue.startsWith('+1')) return 'US'
  
  // If no + but starts with country code
  if (phoneValue.startsWith('355')) return 'AL'
  if (phoneValue.startsWith('30')) return 'GR'
  if (phoneValue.startsWith('39')) return 'IT'
  if (phoneValue.startsWith('34')) return 'ES'
  if (phoneValue.startsWith('1')) return 'US'
  
  return 'DEFAULT'
}

export function PhoneInput({ 
  value, 
  onChange, 
  storeData, 
  primaryColor, 
  disabled, 
  required, 
  translations 
}: PhoneInputProps) {
  const [country, setCountry] = useState<keyof typeof COUNTRY_CONFIGS>('DEFAULT')
  const [isValid, setIsValid] = useState(true)
  const [hasUserInput, setHasUserInput] = useState(false)
  const [isTouched, setIsTouched] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // FIXED: Only initialize once when component mounts and there's no existing value
  useEffect(() => {
    if (!isInitialized && !value && storeData) {
      const detectedCountry = detectCountryFromBusiness(storeData)
      setCountry(detectedCountry)
      setIsInitialized(true)
      
      // Initialize with prefix only if no value exists
      if (detectedCountry !== 'DEFAULT') {
        const config = COUNTRY_CONFIGS[detectedCountry]
        onChange(config.prefix + ' ')
      }
    } else if (!isInitialized && value) {
      // If there's already a value, detect country from it
      const detectedFromValue = detectCountryFromPrefix(value)
      if (detectedFromValue !== 'DEFAULT') {
        setCountry(detectedFromValue)
      } else {
        const detectedFromBusiness = detectCountryFromBusiness(storeData)
        setCountry(detectedFromBusiness)
      }
      setIsInitialized(true)
    }
  }, [storeData, value, onChange, isInitialized])

  // Dynamic country detection based on user input (only after initialization)
  useEffect(() => {
    if (value && hasUserInput && isInitialized) {
      const detectedCountry = detectCountryFromPrefix(value)
      if (detectedCountry !== 'DEFAULT' && detectedCountry !== country) {
        setCountry(detectedCountry)
      }
    }
  }, [value, hasUserInput, isInitialized, country])

  // Validation effect
  useEffect(() => {
    if (value && country !== 'DEFAULT' && isInitialized) {
      const config = COUNTRY_CONFIGS[country]
      
      // Check if user has input beyond just the prefix
      const hasActualInput = value.length > config.prefix.length + 1
      
      if (hasActualInput) {
        // Clean the phone number for validation
        const cleanPhone = value.replace(/[^\d+]/g, '')
        const isValidPhone = config.pattern.test(cleanPhone)
        setIsValid(isValidPhone)
      } else {
        setIsValid(true) // Don't show error for just the prefix
      }
    } else {
      setIsValid(true)
    }
  }, [value, country, isInitialized])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setHasUserInput(true)
    onChange(inputValue)
  }

  const handleBlur = () => {
    setIsTouched(true)
  }

  const config = COUNTRY_CONFIGS[country]

  // Get validation message based on detected country
  const getValidationMessage = () => {
    switch (country) {
      case 'AL':
        return 'Please enter a valid Albanian phone number'
      case 'GR':
        return 'Please enter a valid Greek phone number'
      case 'IT':
        return 'Please enter a valid Italian phone number'
      case 'ES':
        return 'Please enter a valid Spanish phone number'
      case 'US':
        return 'Please enter a valid US phone number'
      default:
        return 'Please enter a valid phone number'
    }
  }

  // Get format example based on detected country
  const getFormatExample = () => {
    switch (country) {
      case 'AL':
        return 'Format: +355 68 123 4567'
      case 'GR':
        return 'Format: +30 694 123 4567'
      case 'IT':
        return 'Format: +39 34 3123 4567'
      case 'ES':
        return 'Format: +34 612 345 678'
      case 'US':
        return 'Format: +1 (555) 123-4567'
      default:
        return 'Enter your WhatsApp number with country code'
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {translations.whatsappNumber || 'WhatsApp Number'} {required && '*'}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          <span className="text-lg">{config.flag}</span>
          <Phone className="w-4 h-4 text-gray-400" />
        </div>
        <input
          type="tel"
          required={required}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={`w-full pl-16 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            !isValid && value && (hasUserInput || isTouched) ? 'border-red-300' : 'border-gray-200'
          }`}
          style={{ 
            '--focus-border-color': primaryColor,
            borderColor: !isValid && value && (hasUserInput || isTouched) ? '#fca5a5' : undefined
          } as React.CSSProperties}
          onFocus={(e) => !disabled && (e.target.style.borderColor = primaryColor)}
          placeholder={config.placeholder}
        />
      </div>
      
      {!isValid && value && (hasUserInput || isTouched) && (
        <p className="text-red-600 text-sm mt-1">
          {getValidationMessage()}
        </p>
      )}
      
      <p className="text-gray-500 text-xs mt-1">
        {getFormatExample()}
      </p>
    </div>
  )
}