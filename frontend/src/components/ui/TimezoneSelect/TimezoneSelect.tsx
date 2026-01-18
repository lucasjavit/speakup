import styles from './TimezoneSelect.module.css';

export interface TimezoneSelectProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

const TIMEZONES = [
  { value: 'Pacific/Midway', label: '(UTC-11:00) Midway Island' },
  { value: 'Pacific/Honolulu', label: '(UTC-10:00) Hawaii' },
  { value: 'America/Anchorage', label: '(UTC-09:00) Alaska' },
  { value: 'America/Los_Angeles', label: '(UTC-08:00) Pacific Time (US & Canada)' },
  { value: 'America/Denver', label: '(UTC-07:00) Mountain Time (US & Canada)' },
  { value: 'America/Phoenix', label: '(UTC-07:00) Arizona' },
  { value: 'America/Chicago', label: '(UTC-06:00) Central Time (US & Canada)' },
  { value: 'America/Mexico_City', label: '(UTC-06:00) Mexico City' },
  { value: 'America/New_York', label: '(UTC-05:00) Eastern Time (US & Canada)' },
  { value: 'America/Bogota', label: '(UTC-05:00) Bogota, Lima' },
  { value: 'America/Caracas', label: '(UTC-04:00) Caracas' },
  { value: 'America/Manaus', label: '(UTC-04:00) Manaus' },
  { value: 'America/Santiago', label: '(UTC-04:00) Santiago' },
  { value: 'America/Sao_Paulo', label: '(UTC-03:00) Brasilia, Sao Paulo' },
  { value: 'America/Buenos_Aires', label: '(UTC-03:00) Buenos Aires' },
  { value: 'America/Fortaleza', label: '(UTC-03:00) Fortaleza' },
  { value: 'Atlantic/South_Georgia', label: '(UTC-02:00) Mid-Atlantic' },
  { value: 'Atlantic/Azores', label: '(UTC-01:00) Azores' },
  { value: 'Europe/London', label: '(UTC+00:00) London, Dublin, Lisbon' },
  { value: 'Africa/Casablanca', label: '(UTC+00:00) Casablanca' },
  { value: 'Europe/Paris', label: '(UTC+01:00) Paris, Berlin, Rome, Madrid' },
  { value: 'Europe/Amsterdam', label: '(UTC+01:00) Amsterdam, Brussels' },
  { value: 'Africa/Lagos', label: '(UTC+01:00) Lagos, West Central Africa' },
  { value: 'Europe/Athens', label: '(UTC+02:00) Athens, Bucharest, Istanbul' },
  { value: 'Africa/Cairo', label: '(UTC+02:00) Cairo' },
  { value: 'Africa/Johannesburg', label: '(UTC+02:00) Johannesburg' },
  { value: 'Europe/Moscow', label: '(UTC+03:00) Moscow, St. Petersburg' },
  { value: 'Asia/Riyadh', label: '(UTC+03:00) Riyadh, Kuwait' },
  { value: 'Africa/Nairobi', label: '(UTC+03:00) Nairobi' },
  { value: 'Asia/Tehran', label: '(UTC+03:30) Tehran' },
  { value: 'Asia/Dubai', label: '(UTC+04:00) Dubai, Abu Dhabi' },
  { value: 'Asia/Baku', label: '(UTC+04:00) Baku' },
  { value: 'Asia/Kabul', label: '(UTC+04:30) Kabul' },
  { value: 'Asia/Karachi', label: '(UTC+05:00) Karachi, Islamabad' },
  { value: 'Asia/Tashkent', label: '(UTC+05:00) Tashkent' },
  { value: 'Asia/Kolkata', label: '(UTC+05:30) Mumbai, New Delhi' },
  { value: 'Asia/Kathmandu', label: '(UTC+05:45) Kathmandu' },
  { value: 'Asia/Dhaka', label: '(UTC+06:00) Dhaka' },
  { value: 'Asia/Almaty', label: '(UTC+06:00) Almaty' },
  { value: 'Asia/Yangon', label: '(UTC+06:30) Yangon' },
  { value: 'Asia/Bangkok', label: '(UTC+07:00) Bangkok, Hanoi, Jakarta' },
  { value: 'Asia/Ho_Chi_Minh', label: '(UTC+07:00) Ho Chi Minh' },
  { value: 'Asia/Shanghai', label: '(UTC+08:00) Beijing, Shanghai' },
  { value: 'Asia/Hong_Kong', label: '(UTC+08:00) Hong Kong' },
  { value: 'Asia/Singapore', label: '(UTC+08:00) Singapore, Kuala Lumpur' },
  { value: 'Asia/Taipei', label: '(UTC+08:00) Taipei' },
  { value: 'Australia/Perth', label: '(UTC+08:00) Perth' },
  { value: 'Asia/Tokyo', label: '(UTC+09:00) Tokyo, Osaka' },
  { value: 'Asia/Seoul', label: '(UTC+09:00) Seoul' },
  { value: 'Australia/Darwin', label: '(UTC+09:30) Darwin' },
  { value: 'Australia/Adelaide', label: '(UTC+09:30) Adelaide' },
  { value: 'Australia/Sydney', label: '(UTC+10:00) Sydney, Melbourne' },
  { value: 'Australia/Brisbane', label: '(UTC+10:00) Brisbane' },
  { value: 'Pacific/Guam', label: '(UTC+10:00) Guam' },
  { value: 'Pacific/Noumea', label: '(UTC+11:00) Noumea' },
  { value: 'Pacific/Auckland', label: '(UTC+12:00) Auckland, Wellington' },
  { value: 'Pacific/Fiji', label: '(UTC+12:00) Fiji' },
  { value: 'Pacific/Tongatapu', label: '(UTC+13:00) Tongatapu' },
];

export function TimezoneSelect({ value, onChange, id }: TimezoneSelectProps) {
  return (
    <select
      id={id}
      className={styles.select}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {TIMEZONES.map((tz) => (
        <option key={tz.value} value={tz.value}>
          {tz.label}
        </option>
      ))}
    </select>
  );
}
