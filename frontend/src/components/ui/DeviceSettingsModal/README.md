# DeviceSettingsModal Component

Modal para configuração de dispositivos (microfone, câmera, alto-falante) durante chamadas.

## Uso

```tsx
import { DeviceSettingsModal } from '@/components/ui/DeviceSettingsModal';

<DeviceSettingsModal
  isOpen={showDeviceSettings}
  onClose={() => setShowDeviceSettings(false)}
  audioDevices={audioDevices}
  videoDevices={videoDevices}
  audioOutputDevices={audioOutputDevices}
  selectedAudioDevice={selectedAudioDevice}
  selectedVideoDevice={selectedVideoDevice}
  selectedAudioOutputDevice={selectedAudioOutputDevice}
  onAudioDeviceChange={handleAudioDeviceChange}
  onVideoDeviceChange={handleVideoDeviceChange}
  onAudioOutputDeviceChange={handleAudioOutputDeviceChange}
/>
```

## Props

| Prop | Tipo | Descrição |
|------|------|-----------|
| `isOpen` | `boolean` | Controla se o modal está visível |
| `onClose` | `() => void` | Callback quando o modal é fechado |
| `audioDevices` | `MediaDeviceOption[]` | Lista de microfones disponíveis |
| `videoDevices` | `MediaDeviceOption[]` | Lista de câmeras disponíveis |
| `audioOutputDevices` | `MediaDeviceOption[]` | Lista de alto-falantes disponíveis |
| `selectedAudioDevice` | `string` | ID do microfone selecionado |
| `selectedVideoDevice` | `string` | ID da câmera selecionada |
| `selectedAudioOutputDevice` | `string` | ID do alto-falante selecionado |
| `onAudioDeviceChange` | `(deviceId: string) => void` | Callback para mudança de microfone |
| `onVideoDeviceChange` | `(deviceId: string) => void` | Callback para mudança de câmera |
| `onAudioOutputDeviceChange` | `(deviceId: string) => void` | Callback para mudança de alto-falante |

## Características

- ✨ Design moderno com backdrop blur
- 🎨 Animações suaves (fadeIn + slideUp)
- 📱 Totalmente responsivo
- ⚙️ Ícones para cada tipo de dispositivo
- 🎯 Renderização condicional (só mostra dispositivos disponíveis)
- 🖱️ Fecha ao clicar no backdrop
- ⌨️ Botão "Done" para fechar
- 🎨 Usa o componente `Select` para consistência

## Integração no Call

O modal é acionado por um botão de configurações (⚙️) nos controles da chamada:

```tsx
<button
  onClick={() => setShowDeviceSettings(true)}
  className={styles.controlButton}
  title="Device settings"
>
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.14,12.94c0.04-0.3,0.06-0.61..."/>
  </svg>
</button>
```

O botão só aparece se houver dispositivos disponíveis:

```tsx
{callState === 'connected' && (audioDevices.length > 0 || videoDevices.length > 0 || audioOutputDevices.length > 0) && (
  // ... botão de settings
)}
```

## Estilização

O modal usa CSS Modules e segue o design system da aplicação:

- **Backdrop**: `rgba(0, 0, 0, 0.7)` com blur de 4px
- **Modal**: Fundo escuro (`#1a1a2e`), bordas arredondadas (16px)
- **Animações**: fadeIn (0.2s) + slideUp (0.3s)
- **Scrollbar**: Customizada para webkit browsers
- **Seções**: Cabeçalhos com ícones e gap consistente
- **Footer**: Botão primário alinhado à direita

## MediaDeviceOption

```tsx
interface MediaDeviceOption {
  deviceId: string;
  label: string;
}
```

## Exemplo Completo

Ver `Call.tsx` para implementação completa:
- Estado para controlar abertura/fechamento
- Enumeração de dispositivos
- Handlers para mudança de dispositivos
- Integração com PeerJS
