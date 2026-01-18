import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, ConfirmDialog } from '@/components/ui';
import { useConfirm } from '@/hooks';
import { adminService } from '@/services';
import type { Session, SessionStatus } from '@/types';
import styles from './Sessions.module.css';

const DAY_NAMES: Record<string, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
};

export function AdminSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { confirm, confirmState } = useConfirm();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllSessions();
      setSessions(data);
    } catch (err) {
      setError('Failed to load sessions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: SessionStatus) => {
    try {
      await adminService.updateSessionStatus(id, status);
      loadSessions();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Session',
      message: 'Are you sure you want to delete this session? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await adminService.deleteSession(id);
      loadSessions();
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <>
      <ConfirmDialog {...confirmState} />
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Practice Sessions</h2>
          <Link to="/admin/sessions/new">
            <Button>Create Session</Button>
          </Link>
        </div>

        {sessions.length === 0 ? (
          <Card className={styles.empty}>
            <p>No sessions found. Create your first session to get started.</p>
          </Card>
        ) : (
          <div className={styles.grid}>
            {sessions.map((session) => (
              <Card key={session.id} className={styles.sessionCard}>
                <div className={styles.sessionHeader}>
                  <h3 className={styles.sessionName}>{session.name}</h3>
                  <span
                    className={`${styles.status} ${session.status === 'ACTIVE' ? styles.active : styles.inactive}`}
                  >
                    {session.status}
                  </span>
                </div>

                <div className={styles.sessionTime}>
                  {session.startTime} - {session.endTime}
                </div>

                <div className={styles.sessionTimezone}>{session.timezone}</div>

                <div className={styles.sessionDays}>
                  {session.daysOfWeek.map((day) => (
                    <span key={day} className={styles.day}>
                      {DAY_NAMES[day]}
                    </span>
                  ))}
                </div>

                {session.currentlyRunning && (
                  <div className={styles.running}>Currently Running</div>
                )}

                <div className={styles.actions}>
                  <Link to={`/admin/sessions/${session.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleStatusChange(
                        session.id,
                        session.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
                      )
                    }
                  >
                    {session.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(session.id)}>
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
