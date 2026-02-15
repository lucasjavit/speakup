import { Select } from '../Select';
import type { SelectOption } from '../Select';
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

  const hourOptions: SelectOption[] = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  }));

  const minuteOptions: SelectOption[] = Array.from({ length: 12 }, (_, i) => ({
    value: String(i * 5),
    label: (i * 5).toString().padStart(2, '0'),
  }));

  const periodOptions: SelectOption[] = [
    { value: 'AM', label: 'AM' },
    { value: 'PM', label: 'PM' },
  ];

  return (
    <div className={styles.container}>
      <Select
        id={id}
        value={String(hour)}
        onChange={(value) => handleHourChange(Number(value))}
        options={hourOptions}
        className={styles.hourSelect}
      />

      <span className={styles.separator}>:</span>

      <Select
        value={String(minute)}
        onChange={(value) => handleMinuteChange(Number(value))}
        options={minuteOptions}
        className={styles.minuteSelect}
      />

      <Select
        value={period}
        onChange={(value) => handlePeriodChange(value as 'AM' | 'PM')}
        options={periodOptions}
        className={styles.periodSelect}
      />
    </div>
  );
}
