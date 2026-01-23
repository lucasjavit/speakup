import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { UserLevel } from '@/components/ui/UserLevel';
import { useAuthStore } from '@/stores/authStore';
import { userService, authService } from '@/services';
import styles from './CompleteProfile.module.css';

type Tab = 'profile';
type Language = 'ENGLISH' | 'PORTUGUESE' | 'SPANISH' | 'FRENCH' | 'GERMAN' | 'ITALIAN' | 'JAPANESE' | 'KOREAN' | 'MANDARIN';
type ProficiencyLevel = 'BEGINNER' | 'ELEMENTARY' | 'INTERMEDIATE' | 'UPPER_INTERMEDIATE' | 'ADVANCED' | 'FLUENT';

interface Country {
  name: string;
  code: string;
}

const languages: { value: Language; label: string }[] = [
  { value: 'ENGLISH', label: 'English' },
  { value: 'PORTUGUESE', label: 'Portuguese' },
  { value: 'SPANISH', label: 'Spanish' },
  { value: 'FRENCH', label: 'French' },
  { value: 'GERMAN', label: 'German' },
  { value: 'ITALIAN', label: 'Italian' },
  { value: 'JAPANESE', label: 'Japanese' },
  { value: 'KOREAN', label: 'Korean' },
  { value: 'MANDARIN', label: 'Chinese (Mandarin)' },
];

const proficiencyLevels: { value: ProficiencyLevel; label: string; description: string }[] = [
  { value: 'BEGINNER', label: 'Beginner (A1)', description: 'Just starting out' },
  { value: 'ELEMENTARY', label: 'Elementary (A2)', description: 'Basic phrases and vocabulary' },
  { value: 'INTERMEDIATE', label: 'Intermediate (B1)', description: 'Can hold simple conversations' },
  { value: 'UPPER_INTERMEDIATE', label: 'Upper Intermediate (B2)', description: 'Comfortable in most situations' },
  { value: 'ADVANCED', label: 'Advanced (C1)', description: 'Fluent with occasional mistakes' },
  { value: 'FLUENT', label: 'Fluent (C2)', description: 'Near-native speaker' },
];

export function CompleteProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token, user, setUser } = useAuthStore();

  const currentTab = (searchParams.get('tab') as Tab) || 'profile';
  const [idNumber, setIdNumber] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState<Language | ''>('');
  const [targetLanguage, setTargetLanguage] = useState<Language | ''>('');
  const [proficiencyLevel, setProficiencyLevel] = useState<ProficiencyLevel | ''>('');
  const [timezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dataConsent, setDataConsent] = useState(false);

  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [pendingCity, setPendingCity] = useState<string | null>(null);

  const isEditMode = user?.profileCompleted ?? false;

  // Fetch fresh user data from API when editing - runs on every navigation to this page
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isEditMode || !token) return;

      try {
        const userData = await authService.getCurrentUser();
        if (userData) {
          setUser(userData);
          setIdNumber(userData.maskedIdNumber || '');
          setCountry(userData.country || '');
          setAddress(userData.address || '');
          setNativeLanguage((userData.nativeLanguage as Language) || '');
          setTargetLanguage((userData.targetLanguage as Language) || '');
          setProficiencyLevel((userData.proficiencyLevel as ProficiencyLevel) || '');
          // Store the city to be set after cities are loaded
          setPendingCity(userData.city || null);
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      }
    };

    // Reset states for fresh load
    setIdNumber('');
    setCountry('');
    setCity('');
    setAddress('');
    setNativeLanguage('');
    setTargetLanguage('');
    setProficiencyLevel('');
    setPendingCity(null);
    setCities([]);
    // In edit mode, user has already given consent previously
    setDataConsent(isEditMode);

    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  // Load countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2');
        const data = await response.json();
        const sortedCountries = data
          .map((c: { name: { common: string }; cca2: string }) => ({
            name: c.name.common,
            code: c.cca2,
          }))
          .sort((a: Country, b: Country) => a.name.localeCompare(b.name));
        setCountries(sortedCountries);
      } catch (err) {
        console.error('Failed to load countries:', err);
      } finally {
        setIsLoadingCountries(false);
      }
    };
    fetchCountries();
  }, []);

  // Load cities when country changes
  useEffect(() => {
    if (!country) {
      setCities([]);
      return;
    }

    const fetchCities = async () => {
      setIsLoadingCities(true);
      try {
        const response = await fetch('https://countriesnow.space/api/v0.1/countries/cities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ country }),
        });
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          setCities(data.data.sort());
        } else {
          setCities([]);
        }
      } catch (err) {
        console.error('Failed to load cities:', err);
        setCities([]);
      } finally {
        setIsLoadingCities(false);
      }
    };
    fetchCities();
  }, [country]);

  // Set pending city after cities are loaded
  useEffect(() => {
    if (pendingCity && cities.length > 0 && cities.includes(pendingCity)) {
      setCity(pendingCity);
      setPendingCity(null);
    }
  }, [pendingCity, cities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!idNumber || !country || !city) {
      setError('Please fill in all required fields');
      return;
    }

    if (!nativeLanguage || !targetLanguage || !proficiencyLevel) {
      setError('Please fill in all required fields');
      return;
    }

    if (nativeLanguage === targetLanguage) {
      setError('Native and target languages must be different');
      return;
    }

    if (!dataConsent) {
      setError('Please accept the data processing consent to continue');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await userService.completeProfile({
        idNumber,
        country,
        city,
        address: address || undefined,
        nativeLanguage,
        targetLanguage,
        proficiencyLevel,
        timezone,
      });

      // API returns the updated user, merge with existing user to preserve fields like avatarUrl, role
      const updatedUser = { ...user, ...result };
      setUser(updatedUser);

      // Register DATA_PROCESSING consent (only on first registration, not edit)
      if (!isEditMode) {
        try {
          await userService.grantConsent('DATA_PROCESSING');
        } catch (consentErr) {
          console.error('Failed to register consent:', consentErr);
          // Don't block navigation on consent error - profile was saved successfully
        }
      }

      navigate('/');
    } catch (err) {
      console.error('Profile update error:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabChange = (tab: Tab) => {
    setSearchParams({ tab });
  };

  return (
    <div className={styles.container}>
      <div className={styles.layout}>
        {/* Back button - only show in edit mode */}
        {isEditMode && (
          <button
            type="button"
            className={styles.backButton}
            onClick={() => navigate('/')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Home
          </button>
        )}

        {/* Sidebar - only show in edit mode */}

        {/* Content */}
        <div className={styles.content}>
          <Card className={styles.card}>
              <div className={styles.header}>
                {isEditMode && (
                  <div className={styles.avatarSection}>
                    <img
                      src={user?.avatarUrl || '/default-avatar.png'}
                      alt={user?.name}
                      className={styles.avatarLarge}
                    />
                    <span className={styles.avatarName}>{user?.name}</span>
                    <span className={styles.avatarEmail}>{user?.email}</span>
                  </div>
                )}
                <h1 className={styles.title}>{isEditMode ? 'Edit Profile' : 'Complete Your Profile'}</h1>
                <p className={styles.subtitle}>
                  {isEditMode ? 'Update your personal information and preferences' : 'Tell us about your language learning goals'}
                </p>
                {isEditMode && user && <UserLevel user={user} variant="profile" />}
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                {error && <p className={styles.error}>{error}</p>}

                {/* Personal Information Section */}
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className={styles.sectionIcon}>
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    Personal Information
                  </h2>

                  <div className={styles.field}>
                    <label htmlFor="idNumber" className={styles.label}>
                      ID Number <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="idNumber"
                      type="text"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      onFocus={() => {
                        // Clear masked value on focus so user can enter new ID
                        if (isEditMode && idNumber.startsWith('****')) {
                          setIdNumber('');
                        }
                      }}
                      className={styles.input}
                      placeholder={isEditMode ? 'Enter new ID or leave current' : 'Your identification document number'}
                    />
                    {isEditMode && (
                      <span className={styles.fieldHint}>
                        Your current ID is masked for security. Enter a new ID to change it, or leave as is.
                      </span>
                    )}
                  </div>

                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label htmlFor="country" className={styles.label}>
                        Country <span className={styles.required}>*</span>
                      </label>
                      <select
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className={styles.select}
                        disabled={isLoadingCountries}
                      >
                        <option value="">
                          {isLoadingCountries ? 'Loading...' : 'Select country'}
                        </option>
                        {countries.map((c) => (
                          <option key={c.code} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.field}>
                      <label htmlFor="city" className={styles.label}>
                        City <span className={styles.required}>*</span>
                      </label>
                      <select
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className={styles.select}
                        disabled={!country || isLoadingCities}
                      >
                        <option value="">
                          {!country
                            ? 'Select country first'
                            : isLoadingCities
                              ? 'Loading...'
                              : 'Select city'}
                        </option>
                        {cities.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="address" className={styles.label}>
                      Address <span className={styles.optional}>(optional)</span>
                    </label>
                    <input
                      id="address"
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className={styles.input}
                      placeholder="Your full address"
                    />
                  </div>
                </div>

                {/* Language Preferences Section */}
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className={styles.sectionIcon}>
                      <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
                    </svg>
                    Language Preferences
                  </h2>

                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label htmlFor="nativeLanguage" className={styles.label}>
                        Native Language <span className={styles.required}>*</span>
                      </label>
                      <select
                        id="nativeLanguage"
                        value={nativeLanguage}
                        onChange={(e) => setNativeLanguage(e.target.value as Language)}
                        className={styles.select}
                      >
                        <option value="">Select language</option>
                        {languages.map((lang) => (
                          <option key={lang.value} value={lang.value}>
                            {lang.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.field}>
                      <label htmlFor="targetLanguage" className={styles.label}>
                        Target Language <span className={styles.required}>*</span>
                      </label>
                      <select
                        id="targetLanguage"
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value as Language)}
                        className={styles.select}
                      >
                        <option value="">Select language</option>
                        <option value="ENGLISH">English</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="proficiencyLevel" className={styles.label}>
                      Your Level in {targetLanguage ? languages.find(l => l.value === targetLanguage)?.label : 'Target Language'} <span className={styles.required}>*</span>
                    </label>
                    <select
                      id="proficiencyLevel"
                      value={proficiencyLevel}
                      onChange={(e) => setProficiencyLevel(e.target.value as ProficiencyLevel)}
                      className={styles.select}
                    >
                      <option value="">Select your level</option>
                      {proficiencyLevels.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label} - {level.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.timezoneField}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className={styles.timezoneIcon}>
                      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                    </svg>
                    <div>
                      <span className={styles.timezoneLabel}>Timezone</span>
                      <span className={styles.timezoneValue}>{timezone}</span>
                    </div>
                  </div>
                </div>

                {/* Data Consent */}
                <div className={styles.consentSection}>
                  <label className={styles.consentLabel}>
                    <input
                      type="checkbox"
                      checked={dataConsent}
                      onChange={(e) => setDataConsent(e.target.checked)}
                      className={styles.consentCheckbox}
                    />
                    <span className={styles.consentText}>
                      I consent to the collection and processing of my personal data, including my identification document number, location, and language preferences, in accordance with the{' '}
                      <a href="https://gdpr.eu" target="_blank" rel="noopener noreferrer">
                        GDPR (General Data Protection Regulation)
                      </a>
                      {' '}and applicable data protection laws.
                    </span>
                  </label>
                </div>

                <Button
                  type="submit"
                  fullWidth
                  disabled={isSubmitting || !dataConsent}
                >
                  {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Complete Profile'}
                </Button>
              </form>
            </Card>
        </div>
      </div>
    </div>
  );
}
