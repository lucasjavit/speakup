import styles from './TimePicker.module.css';

export interface TimePickerProps {
  value: string; // Format: "HH:mm" (24h)
  onChange: (value: string) => void;
  id?: string;
}

function parse24hTime(time: string): { hour: number; minute: number; period: 'AM' | 'PM' } {
  const [h, m] = time.split(':').map(Number);
  const hour24 = h || 0;
  const minute = m || 0;

  if (hour24 === 0) {
    return { hour: 12, minute, period: 'AM' };
  } else if (hour24 === 12) {
    return { hour: 12, minute, period: 'PM' };
  } else if (hour24 > 12) {
    return { hour: hour24 - 12, minute, period: 'PM' };
  } else {
    return { hour: hour24, minute, period: 'AM' };
  }
}

function to24hTime(hour: number, minute: number, period: 'AM' | 'PM'): string {
  let hour24: number;

  if (period === 'AM') {
    hour24 = hour === 12 ? 0 : hour;
  } else {
    hour24 = hour === 12 ? 12 : hour + 12;
  }

  return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

export function TimePicker({ value, onChange, id }: TimePickerProps) {
  const { hour, minute, period } = parse24hTime(value);

  const handleHourChange = (newHour: number) => {
    onChange(to24hTime(newHour, minute, period));
  };

  const handleMinuteChange = (newMinute: number) => {
    onChange(to24hTime(hour, newMinute, period));
  };

  const handlePeriodChange = (newPeriod: 'AM' | 'PM') => {
    onChange(to24hTime(hour, minute, newPeriod));
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  return (
    <div className={styles.container}>
      <select
        id={id}
        className={`${styles.select} ${styles.hourSelect}`}
        value={hour}
        onChange={(e) => handleHourChange(Number(e.target.value))}
      >
        {hours.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>

      <span className={styles.separator}>:</span>

      <select
        className={`${styles.select} ${styles.minuteSelect}`}
        value={minute}
        onChange={(e) => handleMinuteChange(Number(e.target.value))}
      >
        {minutes.map((m) => (
          <option key={m} value={m}>
            {m.toString().padStart(2, '0')}
          </option>
        ))}
      </select>

      <select
        className={`${styles.select} ${styles.periodSelect}`}
        value={period}
        onChange={(e) => handlePeriodChange(e.target.value as 'AM' | 'PM')}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}
