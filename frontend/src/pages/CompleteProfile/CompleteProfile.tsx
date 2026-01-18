import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import styles from './CompleteProfile.module.css';

type Language = 'ENGLISH' | 'PORTUGUESE' | 'SPANISH' | 'FRENCH' | 'GERMAN' | 'ITALIAN' | 'JAPANESE' | 'KOREAN' | 'MANDARIN';
type ProficiencyLevel = 'BEGINNER' | 'ELEMENTARY' | 'INTERMEDIATE' | 'UPPER_INTERMEDIATE' | 'ADVANCED' | 'FLUENT';

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
  const { token } = useAuthStore();
  const [nativeLanguage, setNativeLanguage] = useState<Language | ''>('');
  const [targetLanguage, setTargetLanguage] = useState<Language | ''>('');
  const [proficiencyLevel, setProficiencyLevel] = useState<ProficiencyLevel | ''>('');
  const [timezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nativeLanguage || !targetLanguage || !proficiencyLevel) {
      setError('Please fill in all fields');
      return;
    }

    if (nativeLanguage === targetLanguage) {
      setError('Native and target languages must be different');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/v1/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nativeLanguage,
          targetLanguage,
          proficiencyLevel,
          timezone,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      navigate('/');
    } catch (err) {
      console.error('Profile update error:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Complete Your Profile</h1>
          <p className={styles.subtitle}>
            Tell us about your language learning goals
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.field}>
            <label htmlFor="nativeLanguage" className={styles.label}>
              Native Language
            </label>
            <select
              id="nativeLanguage"
              value={nativeLanguage}
              onChange={(e) => setNativeLanguage(e.target.value as Language)}
              className={styles.select}
            >
              <option value="">Select your native language</option>
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="targetLanguage" className={styles.label}>
              Language You Want to Practice
            </label>
            <select
              id="targetLanguage"
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value as Language)}
              className={styles.select}
            >
              <option value="">Select target language</option>
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="proficiencyLevel" className={styles.label}>
              Your Level in {targetLanguage ? languages.find(l => l.value === targetLanguage)?.label : 'Target Language'}
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

          <div className={styles.field}>
            <label className={styles.label}>Timezone</label>
            <p className={styles.timezone}>{timezone}</p>
          </div>

          <Button
            type="submit"
            fullWidth
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Complete Profile'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
