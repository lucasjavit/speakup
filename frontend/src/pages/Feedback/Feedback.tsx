import { useState } from 'react';
import { Card } from '@/components/ui';
import { feedbackService } from '@/services';
import type { FeedbackType } from '@/types';
import toast from 'react-hot-toast';
import styles from './Feedback.module.css';

export function Feedback() {
  const [type, setType] = useState<FeedbackType>('SUGGESTION');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

  const validate = (): boolean => {
    const newErrors: { title?: string; description?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 255) {
      newErrors.title = 'Title must not exceed 255 characters';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.length > 5000) {
      newErrors.description = 'Description must not exceed 5000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await feedbackService.createFeedback({
        type,
        title: title.trim(),
        description: description.trim(),
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
      });

      toast.success('Feedback submitted successfully!');
      
      // Reset form
      setTitle('');
      setDescription('');
      setErrors({});
    } catch (error: any) {
      console.error('Failed to submit feedback:', error);
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Send Your Feedback</h1>
        <p className={styles.description}>
          We value your feedback! Let us know about bugs you've encountered or share your suggestions 
          to help us improve the platform. For bug reports, you can also use the floating button 
          in the bottom-right corner which automatically captures a screenshot.
        </p>
      </div>

      <Card>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label htmlFor="feedback-type" className={styles.label}>
              Type<span className={styles.required}>*</span>
            </label>
            <select
              id="feedback-type"
              className={styles.select}
              value={type}
              onChange={(e) => setType(e.target.value as FeedbackType)}
              disabled={isSubmitting}
            >
              <option value="BUG">Bug Report</option>
              <option value="SUGGESTION">Suggestion</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="feedback-title" className={styles.label}>
              Title<span className={styles.required}>*</span>
            </label>
            <input
              id="feedback-title"
              type="text"
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of your feedback"
              maxLength={255}
              disabled={isSubmitting}
            />
            {errors.title && <div className={styles.error}>{errors.title}</div>}
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="feedback-description" className={styles.label}>
              Description<span className={styles.required}>*</span>
            </label>
            <textarea
              id="feedback-description"
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide details about your feedback..."
              maxLength={5000}
              disabled={isSubmitting}
            />
            {errors.description && <div className={styles.error}>{errors.description}</div>}
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </Card>
    </div>
  );
}
