/**
 * Select Component - Usage Examples
 * 
 * A modern, accessible select component with label, error states, and hints.
 */

import { Select } from './Select';

// Example 1: Basic usage
export function BasicSelect() {
  return (
    <Select
      label="Country"
      options={[
        { value: 'us', label: 'United States' },
        { value: 'ca', label: 'Canada' },
        { value: 'uk', label: 'United Kingdom' },
        { value: 'br', label: 'Brazil' },
      ]}
      onChange={(value) => console.log('Selected:', value)}
    />
  );
}

// Example 2: With placeholder
export function SelectWithPlaceholder() {
  return (
    <Select
      label="Language"
      placeholder="Select a language"
      options={[
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Spanish' },
        { value: 'pt', label: 'Portuguese' },
        { value: 'fr', label: 'French' },
      ]}
      onChange={(value) => console.log('Selected:', value)}
    />
  );
}

// Example 3: With error state
export function SelectWithError() {
  return (
    <Select
      label="Device"
      error="Please select a device"
      options={[
        { value: 'camera', label: 'Camera' },
        { value: 'microphone', label: 'Microphone' },
        { value: 'speaker', label: 'Speaker' },
      ]}
      onChange={(value) => console.log('Selected:', value)}
    />
  );
}

// Example 4: With hint
export function SelectWithHint() {
  return (
    <Select
      label="Audio Quality"
      hint="Higher quality requires more bandwidth"
      options={[
        { value: 'low', label: 'Low (32kbps)' },
        { value: 'medium', label: 'Medium (64kbps)' },
        { value: 'high', label: 'High (128kbps)' },
      ]}
      onChange={(value) => console.log('Selected:', value)}
    />
  );
}

// Example 5: Disabled options
export function SelectWithDisabledOptions() {
  return (
    <Select
      label="Plan"
      options={[
        { value: 'free', label: 'Free' },
        { value: 'basic', label: 'Basic - $9.99/mo' },
        { value: 'pro', label: 'Pro - $19.99/mo' },
        { value: 'enterprise', label: 'Enterprise - Contact us', disabled: true },
      ]}
      onChange={(value) => console.log('Selected:', value)}
    />
  );
}

// Example 6: Disabled select
export function DisabledSelect() {
  return (
    <Select
      label="Status"
      disabled
      value="active"
      options={[
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ]}
      onChange={(value) => console.log('Selected:', value)}
    />
  );
}

// Example 7: Device selector (real-world example)
export function DeviceSelect() {
  const devices = [
    { value: '', label: 'Default device' },
    { value: 'dev1', label: 'Intelbras CAM-720p (0c45:6366)' },
    { value: 'dev2', label: 'Logitech HD Webcam C525' },
    { value: 'dev3', label: 'Microsoft LifeCam HD-3000' },
  ];

  return (
    <Select
      label="Camera"
      hint="Select your preferred camera device"
      options={devices}
      onChange={(value) => console.log('Selected device:', value)}
    />
  );
}
