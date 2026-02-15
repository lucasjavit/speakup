# Select Component

Um componente Select moderno e acessível para a aplicação SpeakUp.

## Características

- ✨ Design moderno e consistente com outros componentes UI
- 🎨 Suporte a temas através de CSS variables
- ♿ Acessível (ARIA labels, keyboard navigation)
- 🎯 Label, hint e mensagens de erro integrados
- 🔒 Suporte a opções desabilitadas
- 📱 Responsivo
- 🎭 Estados de focus, hover e disabled

## Importação

```tsx
import { Select } from '@/components/ui/Select';
import type { SelectOption } from '@/components/ui/Select';
```

## Uso Básico

```tsx
<Select
  label="Device"
  options={[
    { value: 'camera', label: 'Camera' },
    { value: 'microphone', label: 'Microphone' },
    { value: 'speaker', label: 'Speaker' },
  ]}
  onChange={(value) => console.log(value)}
/>
```

## Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `options` | `SelectOption[]` | - | **Obrigatório**. Array de opções do select |
| `label` | `string` | - | Label exibido acima do select |
| `placeholder` | `string` | - | Opção placeholder desabilitada |
| `error` | `string` | - | Mensagem de erro (muda estilo para vermelho) |
| `hint` | `string` | - | Texto de ajuda exibido abaixo |
| `onChange` | `(value: string) => void` | - | Callback quando o valor muda |
| `value` | `string` | - | Valor controlado do select |
| `disabled` | `boolean` | `false` | Desabilita o select |
| `id` | `string` | - | ID HTML (gerado automaticamente se não fornecido) |

### SelectOption

```tsx
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
```

## Exemplos

### Com Placeholder

```tsx
<Select
  label="Language"
  placeholder="Select a language"
  options={[
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'pt', label: 'Portuguese' },
  ]}
  onChange={(value) => console.log(value)}
/>
```

### Com Erro

```tsx
<Select
  label="Country"
  error="Please select a country"
  options={countries}
  onChange={(value) => setCountry(value)}
/>
```

### Com Hint

```tsx
<Select
  label="Audio Quality"
  hint="Higher quality requires more bandwidth"
  options={qualityOptions}
  onChange={(value) => setQuality(value)}
/>
```

### Opções Desabilitadas

```tsx
<Select
  label="Plan"
  options={[
    { value: 'free', label: 'Free' },
    { value: 'pro', label: 'Pro - $19.99/mo' },
    { value: 'enterprise', label: 'Enterprise', disabled: true },
  ]}
  onChange={(value) => setPlan(value)}
/>
```

### Select Desabilitado

```tsx
<Select
  label="Status"
  disabled
  value="active"
  options={statusOptions}
  onChange={(value) => setStatus(value)}
/>
```

## Estilização

O componente usa CSS Modules e CSS variables para temas:

```css
--color-primary: Cor principal (focus, ativo)
--color-border: Cor da borda
--color-bg-primary: Fundo do select
--color-bg-secondary: Fundo quando desabilitado
--color-text-primary: Cor do texto
--color-text-secondary: Cor do texto secundário (label, hint)
--color-text-muted: Cor do placeholder
--color-error: Cor de erro
--radius-md: Border radius
--transition-fast: Duração da transição
```

## Acessibilidade

- ✅ Labels associados corretamente com `htmlFor`/`id`
- ✅ `aria-invalid` quando há erro
- ✅ `aria-describedby` para hints e erros
- ✅ `role="alert"` para mensagens de erro
- ✅ Navegação por teclado nativa do select
- ✅ Estados visuais claros (focus, hover, disabled)

## CSS Variables Usadas

| Variable | Valor Padrão | Uso |
|----------|--------------|-----|
| `--color-primary` | `#667eea` | Borda em focus |
| `--color-border` | `#e2e8f0` | Borda padrão |
| `--color-bg-primary` | `#ffffff` | Fundo |
| `--color-bg-secondary` | `#f8fafc` | Fundo desabilitado |
| `--color-text-primary` | `#1e293b` | Texto principal |
| `--color-text-secondary` | `#64748b` | Label e hint |
| `--color-text-muted` | `#94a3b8` | Placeholder |
| `--color-error` | `#ef4444` | Estado de erro |
| `--radius-md` | `8px` | Border radius |
| `--transition-fast` | `150ms ease` | Transições |
