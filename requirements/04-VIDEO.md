# Sistema de Vídeo - SpeakUp

## Visão Geral

O sistema de vídeo utiliza **LiveKit** (servidor WebRTC open-source) para gerenciar chamadas de vídeo 1x1 entre os usuários.

---

## Por que LiveKit?

| Critério | LiveKit | Twilio | Agora |
|----------|---------|--------|-------|
| Custo | Gratuito (self-hosted) | ~$0.004/min | ~$0.001/min |
| Controle | Total | Limitado | Limitado |
| Privacidade | Dados locais | Cloud terceiros | Cloud terceiros |
| Escalabilidade | Horizontal | Automática | Automática |
| Complexidade | Média | Baixa | Baixa |

**Decisão**: LiveKit self-hosted para custo zero e controle total.

---

## Arquitetura do LiveKit

```
┌──────────────┐     ┌──────────────┐
│   User A     │     │   User B     │
│   Browser    │     │   Browser    │
└──────┬───────┘     └───────┬──────┘
       │                     │
       │    WebRTC Media     │
       │◄───────────────────►│
       │                     │
       └──────────┬──────────┘
                  │
                  ▼
         ┌───────────────┐
         │  LiveKit SFU  │
         │   Server      │
         │               │
         │  - Rooms      │
         │  - Tracks     │
         │  - Recording  │
         └───────┬───────┘
                 │
                 ▼
         ┌───────────────┐
         │   Backend     │
         │  (Spring)     │
         │               │
         │ - Room mgmt   │
         │ - Token gen   │
         │ - Webhooks    │
         └───────────────┘
```

---

## Fluxo de uma Chamada

### 1. Criação da Sala (Backend)
```java
// Quando match é encontrado
public RoomInfo createRoom(String matchId, String userAId, String userBId) {
    String roomName = "session_" + matchId;

    // Criar sala no LiveKit
    RoomServiceClient roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
    roomService.createRoom(CreateRoomRequest.newBuilder()
        .setName(roomName)
        .setEmptyTimeout(300)  // 5 min timeout se vazia
        .setMaxParticipants(2)
        .build());

    return new RoomInfo(roomName, matchId);
}
```

### 2. Geração de Token (Backend)
```java
public String generateToken(String roomName, String userId, String userName) {
    AccessToken token = new AccessToken(apiKey, apiSecret);

    token.setIdentity(userId);
    token.setName(userName);
    token.setTtl(Duration.ofHours(2));

    token.addGrants(new VideoGrant()
        .setRoomJoin(true)
        .setRoom(roomName)
        .setCanPublish(true)
        .setCanSubscribe(true)
        .setCanPublishData(true));  // Para chat de texto

    return token.toJwt();
}
```

### 3. Conexão do Frontend (React)
```tsx
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';

function VideoRoom({ token, roomName }: Props) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={import.meta.env.VITE_LIVEKIT_URL}
      connect={true}
      audio={true}
      video={true}
      onDisconnected={() => handleDisconnect()}
    >
      <VideoConference />
      <SessionTimer duration={600} /> {/* 10 min */}
      <TextChat />
    </LiveKitRoom>
  );
}
```

### 4. Eventos do LiveKit (Webhooks)
```java
// POST /api/livekit/webhook
@PostMapping("/webhook")
public void handleWebhook(@RequestBody WebhookEvent event) {
    switch (event.getEvent()) {
        case "room_started":
            log.info("Room started: {}", event.getRoom().getName());
            break;

        case "participant_joined":
            handleParticipantJoined(event);
            break;

        case "participant_left":
            handleParticipantLeft(event);
            break;

        case "room_finished":
            handleRoomFinished(event);
            startTranscriptionJob(event.getRoom().getName());
            break;

        case "track_published":
            // Áudio/vídeo publicado
            break;
    }
}
```

---

## Configuração do LiveKit Server

### livekit.yaml
```yaml
port: 7880
rtc:
  port_range_start: 50000
  port_range_end: 60000
  tcp_port: 7881
  use_external_ip: true

redis:
  address: redis:6379

keys:
  API_KEY: YOUR_API_KEY
  API_SECRET: YOUR_API_SECRET

room:
  auto_create: false
  max_participants: 2

logging:
  level: info
```

### Docker Compose
```yaml
livekit:
  image: livekit/livekit-server:v1.5
  ports:
    - "7880:7880"     # HTTP/WebSocket API
    - "7881:7881"     # RTC over TCP
    - "50000-60000:50000-60000/udp"  # WebRTC media
  volumes:
    - ./livekit.yaml:/etc/livekit.yaml
  command: --config /etc/livekit.yaml
  environment:
    - LIVEKIT_KEYS=API_KEY:API_SECRET
```

---

## Transcrição de Áudio

### Opção 1: LiveKit Egress + Deepgram (Recomendado)

```
LiveKit Room
    │
    ▼
[Egress Service] ──── Audio Stream ────► [Deepgram API]
    │                                          │
    │                                          ▼
    │                                   [Transcription]
    │                                          │
    └──── Recording File ─────────────────────►│
                                               ▼
                                        [Storage/Analysis]
```

#### Configuração do Egress
```java
// Iniciar gravação ao começar sessão
public void startRecording(String roomName) {
    EgressServiceClient egressService = new EgressServiceClient(livekitUrl, apiKey, apiSecret);

    RoomCompositeEgressRequest request = RoomCompositeEgressRequest.newBuilder()
        .setRoomName(roomName)
        .setAudioOnly(true)  // Só precisamos do áudio para transcrição
        .setFile(EncodedFileOutput.newBuilder()
            .setFilepath("/recordings/{room_name}_{time}.ogg")
            .build())
        .build();

    egressService.startRoomCompositeEgress(request);
}
```

### Opção 2: Transcrição em Tempo Real

```typescript
// No frontend, capturar áudio e enviar para transcrição
import { useLocalParticipant } from '@livekit/components-react';

function useRealTimeTranscription() {
  const { localParticipant } = useLocalParticipant();

  useEffect(() => {
    const audioTrack = localParticipant.getTrack(Track.Source.Microphone);
    if (audioTrack) {
      // Stream para serviço de transcrição
      streamToTranscription(audioTrack.mediaStreamTrack);
    }
  }, [localParticipant]);
}
```

---

## Timer e Rotação

### Timer no Frontend
```tsx
function SessionTimer({ duration, onComplete }: Props) {
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Aviso de 1 minuto
  useEffect(() => {
    if (remaining === 60) {
      showWarning("1 minuto restante!");
      playSound("warning");
    }
  }, [remaining]);

  return (
    <div className="timer">
      {formatTime(remaining)}
    </div>
  );
}
```

### Sincronização de Timer (Backend)
```java
// Timer autoritativo no backend para evitar manipulação
@Scheduled(fixedRate = 1000)
public void updateSessionTimers() {
    activeSessions.forEach(session -> {
        long elapsed = now() - session.getStartedAt();
        long remaining = SESSION_DURATION - elapsed;

        if (remaining <= 0) {
            endSession(session);
        } else if (remaining == 60_000) {
            sendWarning(session, "1 minuto restante");
        }

        // Sync com frontend via WebSocket
        broadcastTimerUpdate(session, remaining);
    });
}
```

---

## Qualidade de Vídeo

### Configurações Recomendadas
```typescript
const videoConstraints = {
  width: { ideal: 1280, max: 1920 },
  height: { ideal: 720, max: 1080 },
  frameRate: { ideal: 30, max: 30 },
};

const audioConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};
```

### Adaptive Bitrate
- LiveKit ajusta automaticamente baseado na conexão
- Prioriza áudio sobre vídeo quando conexão é ruim
- Usuário pode desabilitar vídeo manualmente

---

## Tratamento de Erros

### Reconexão Automática
```tsx
<LiveKitRoom
  onDisconnected={(reason) => {
    if (reason === DisconnectReason.DUPLICATE_IDENTITY) {
      // Usuário abriu em outra aba
      showError("Você já está conectado em outra janela");
    } else {
      // Tentar reconectar
      attemptReconnect();
    }
  }}
/>
```

### Fallback para Áudio
```tsx
function handleVideoError() {
  // Se webcam falhar, continuar só com áudio
  localParticipant.setCameraEnabled(false);
  showNotification("Vídeo desabilitado. Continuando com áudio.");
}
```

---

## Requisitos de Rede

### Portas Necessárias
| Porta | Protocolo | Uso |
|-------|-----------|-----|
| 7880 | TCP | LiveKit API/WebSocket |
| 7881 | TCP | RTC over TCP (fallback) |
| 50000-60000 | UDP | WebRTC media |

### TURN Server (Opcional)
Para usuários atrás de NAT restritivo:
```yaml
# Usar Coturn ou serviço TURN
turn:
  enabled: true
  domain: turn.speakup.com
  tls_port: 5349
  udp_port: 3478
```

---

## Chat de Texto

### Usando Data Channels do LiveKit
```typescript
function TextChat() {
  const { localParticipant, room } = useLiveKit();

  const sendMessage = (text: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({
      type: 'chat',
      text,
      sender: localParticipant.identity,
      timestamp: Date.now()
    }));

    localParticipant.publishData(data, DataPacket_Kind.RELIABLE);
  };

  useEffect(() => {
    room.on(RoomEvent.DataReceived, (payload, participant) => {
      const message = JSON.parse(new TextDecoder().decode(payload));
      if (message.type === 'chat') {
        addMessage(message);
      }
    });
  }, [room]);

  return <ChatUI onSend={sendMessage} />;
}
```

---

## Métricas

### Métricas a Coletar
```
- video.connection.success_rate
- video.connection.time_to_first_frame
- video.quality.resolution_changes
- video.quality.packet_loss
- video.session.duration_actual
- video.audio.transcription_accuracy
```

---

## Próximos Passos

- [ ] Configurar LiveKit server local
- [ ] Implementar VideoService no backend
- [ ] Criar componentes React para vídeo
- [ ] Configurar Egress para gravação
- [ ] Integrar com Deepgram
- [ ] Testar em diferentes condições de rede
