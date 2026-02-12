import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { conversationService } from '@/services';
import { useCallStore } from '@/stores/callStore';
import { useAuthStore } from '@/stores/authStore';
import type { Conversation, CallInfo } from '@/types';

interface ActiveCallCheckResult {
  isChecking: boolean;
  activeConversation: Conversation | null;
}

/**
 * Hook to check for active conversations on page load.
 * If user was in an active call before refresh, this will detect it
 * and allow them to rejoin.
 */
export function useActiveCallCheck(): ActiveCallCheckResult {
  const [isChecking, setIsChecking] = useState(true);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { setCallInfo, callInfo } = useCallStore();

  useEffect(() => {
    async function checkActiveConversation() {
      // Don't check if not authenticated or already in a call
      if (!isAuthenticated || !user || callInfo) {
        setIsChecking(false);
        return;
      }

      try {
        const conversation = await conversationService.getActiveConversation();

        if (conversation && conversation.status === 'ACTIVE') {
          setActiveConversation(conversation);

          // Determine partner info
          const isUserA = conversation.userA.id === user.id;
          const partner = isUserA ? conversation.userB : conversation.userA;

          // Set call info in store so Call page can use it
          const callInfoData: CallInfo = {
            conversationId: conversation.id,
            peerId: partner.id,
            partnerName: partner.name,
            partnerAvatar: partner.avatarUrl,
            partnerCountry: null,
            topic: conversation.topic || 'Free conversation',
            isInitiator: false, // On reconnection, we're not initiator
            startedAt: conversation.startedAt ? new Date(conversation.startedAt) : null,
            sessionId: conversation.sessionId || '',
            callDurationSeconds: conversation.callDurationSeconds,
            breakDurationSeconds: conversation.breakDurationSeconds,
          };

          setCallInfo(callInfoData);

          // Navigate to call page to rejoin
          navigate('/call', { replace: true });
        }
      } catch (error) {
        console.error('Error checking active conversation:', error);
      } finally {
        setIsChecking(false);
      }
    }

    checkActiveConversation();
  }, [isAuthenticated, user, callInfo, setCallInfo, navigate]);

  return { isChecking, activeConversation };
}
