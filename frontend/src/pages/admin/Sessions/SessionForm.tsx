import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Input, TimePicker, TimezoneSelect } from '@/components/ui';
import { adminService } from '@/services';
import type { DayOfWeek, CreateSessionRequest } from '@/types';
import styles from './SessionForm.module.css';

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
  { value: 'SUNDAY', label: 'Sunday' },
];

export function SessionForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('08:00');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>([]);
  const [callDurationMinutes, setCallDurationMinutes] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (id) {
      loadSession();
    }
  }, [id]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const session = await adminService.getSession(id!);
      setName(session.name);
      setStartTime(session.startTime);
      setEndTime(session.endTime);
      setTimezone(session.timezone);
      setDaysOfWeek(session.daysOfWeek);
      setCallDurationMinutes(Math.round(session.callDurationSeconds / 60));
    } catch (err) {
      setError('Failed to load session');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day: DayOfWeek) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !startTime || !endTime || !timezone || daysOfWeek.length === 0) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const data: CreateSessionRequest = {
        name,
        startTime,
        endTime,
        timezone,
        daysOfWeek,
        callDurationSeconds: callDurationMinutes * 60,
      };

      if (isEditing) {
        await adminService.updateSession(id!, data);
      } else {
        await adminService.createSession(data);
      }

      navigate('/admin/sessions');
    } catch (err) {
      setError('Failed to save session');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <h2 className={styles.title}>{isEditing ? 'Edit Session' : 'Create Session'}</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.field}>
            <label htmlFor="name" className={styles.label}>
              Session Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning Session"
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="startTime" className={styles.label}>
                Start Time
              </label>
              <TimePicker
                id="startTime"
                value={startTime}
                onChange={setStartTime}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="endTime" className={styles.label}>
                End Time
              </label>
              <TimePicker
                id="endTime"
                value={endTime}
                onChange={setEndTime}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="timezone" className={styles.label}>
              Timezone
            </label>
            <TimezoneSelect
              id="timezone"
              value={timezone}
              onChange={setTimezone}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Days of Week</label>
            <div className={styles.daysGrid}>
              {DAYS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  className={`${styles.dayButton} ${daysOfWeek.includes(day.value) ? styles.selected : ''}`}
                  onClick={() => handleDayToggle(day.value)}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="callDuration" className={styles.label}>
              Call Duration (minutes)
            </label>
            <Input
              id="callDuration"
              type="number"
              min={1}
              max={60}
              value={callDurationMinutes}
              onChange={(e) => setCallDurationMinutes(Math.max(1, Math.min(60, parseInt(e.target.value) || 1)))}
            />
            <span className={styles.hint}>
              Duration of each 1:1 call between users (1-60 minutes)
            </span>
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={() => navigate('/admin/sessions')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Session'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
