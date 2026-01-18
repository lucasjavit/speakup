# Guia de Boas Práticas - Frontend React

## Índice

1. [Estrutura do Projeto](#estrutura-do-projeto)
2. [Componentes](#componentes)
3. [TypeScript](#typescript)
4. [Estado e Data Fetching](#estado-e-data-fetching)
5. [Estilização](#estilização)
6. [Testes](#testes)
7. [Performance](#performance)
8. [Acessibilidade](#acessibilidade)
9. [Segurança](#segurança)
10. [Convenções de Código](#convenções-de-código)

---

## Estrutura do Projeto

### Organização de Pastas

```
src/
├── assets/              # Imagens, fontes, arquivos estáticos
│   ├── images/
│   └── fonts/
├── components/          # Componentes reutilizáveis
│   ├── ui/              # Componentes de UI genéricos
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   └── index.ts     # Barrel export
│   └── common/          # Componentes de negócio compartilhados
│       ├── UserAvatar/
│       └── LanguageSelector/
├── features/            # Módulos por funcionalidade
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types.ts
│   │   └── index.ts
│   ├── session/
│   └── user/
├── hooks/               # Hooks globais reutilizáveis
│   ├── useLocalStorage.ts
│   └── useDebounce.ts
├── lib/                 # Configurações de libs externas
│   ├── axios.ts
│   └── queryClient.ts
├── pages/               # Páginas/rotas da aplicação
│   ├── Home/
│   ├── Login/
│   └── Session/
├── services/            # Chamadas de API
│   ├── api.ts
│   └── userService.ts
├── stores/              # Estado global (Zustand/Context)
│   └── authStore.ts
├── styles/              # Estilos globais
│   ├── globals.css
│   └── variables.css
├── types/               # Tipos TypeScript globais
│   ├── api.ts
│   └── user.ts
├── utils/               # Funções utilitárias
│   ├── format.ts
│   └── validation.ts
├── App.tsx
├── main.tsx
└── vite-env.d.ts
```

### Estrutura de Componente

```
Button/
├── Button.tsx           # Componente principal
├── Button.test.tsx      # Testes
├── Button.module.css    # Estilos (ou .css)
├── Button.types.ts      # Tipos (se complexo)
└── index.ts             # Export
```

---

## Componentes

### Componentes Funcionais

```tsx
// ✅ BOM: Componente funcional com tipos claros
interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  className?: string;
}

export function UserCard({ user, onEdit, className }: UserCardProps) {
  return (
    <div className={className}>
      <h3>{user.name}</h3>
      {onEdit && (
        <button onClick={() => onEdit(user)}>Edit</button>
      )}
    </div>
  );
}
```

### Composição sobre Herança

```tsx
// ✅ BOM: Composição
interface CardProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function Card({ children, header, footer }: CardProps) {
  return (
    <div className="card">
      {header && <div className="card-header">{header}</div>}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}

// Uso
<Card header={<h2>Title</h2>}>
  <p>Content here</p>
</Card>
```

### Single Responsibility

```tsx
// ❌ RUIM: Componente fazendo muitas coisas
function UserProfile() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  // fetch user, posts, friends...
  // render tudo junto
}

// ✅ BOM: Componentes separados por responsabilidade
function UserProfile() {
  return (
    <div>
      <UserInfo />
      <UserPosts />
      <UserFriends />
    </div>
  );
}
```

### Props Drilling vs Context

```tsx
// ❌ RUIM: Props drilling profundo
<App user={user}>
  <Layout user={user}>
    <Sidebar user={user}>
      <UserMenu user={user} />
    </Sidebar>
  </Layout>
</App>

// ✅ BOM: Context para dados globais
const UserContext = createContext<User | null>(null);

function App() {
  const [user, setUser] = useState<User | null>(null);

  return (
    <UserContext.Provider value={user}>
      <Layout>
        <Sidebar>
          <UserMenu /> {/* Acessa user via useContext */}
        </Sidebar>
      </Layout>
    </UserContext.Provider>
  );
}

// Hook para consumir
function useUser() {
  const user = useContext(UserContext);
  if (user === undefined) {
    throw new Error('useUser must be used within UserProvider');
  }
  return user;
}
```

---

## TypeScript

### Tipos vs Interfaces

```tsx
// Use interface para objetos que podem ser extendidos
interface User {
  id: string;
  name: string;
  email: string;
}

interface AdminUser extends User {
  role: 'admin';
  permissions: string[];
}

// Use type para unions, tuples, mapped types
type Status = 'idle' | 'loading' | 'success' | 'error';
type Nullable<T> = T | null;
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };
```

### Props com Children

```tsx
// Para componentes que aceitam children
interface LayoutProps {
  children: React.ReactNode;
}

// Para componentes com render props
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}
```

### Event Handlers

```tsx
interface FormProps {
  onSubmit: (data: FormData) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}
```

### Tipos de API

```tsx
// types/api.ts
interface ApiResponse<T> {
  data: T;
  error?: never;
}

interface ApiError {
  data?: never;
  error: {
    code: string;
    message: string;
  };
}

type ApiResult<T> = ApiResponse<T> | ApiError;

// Uso
async function fetchUser(id: string): Promise<ApiResult<User>> {
  // ...
}
```

### Evite `any`

```tsx
// ❌ RUIM
function process(data: any) { }

// ✅ BOM: Use unknown e faça type guard
function process(data: unknown) {
  if (isUser(data)) {
    // data é User aqui
  }
}

// Type guard
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'email' in data
  );
}
```

---

## Estado e Data Fetching

### useState - Quando Usar

```tsx
// Para estado local do componente
const [isOpen, setIsOpen] = useState(false);
const [inputValue, setInputValue] = useState('');

// Inicialização lazy para cálculos pesados
const [state, setState] = useState(() => {
  return expensiveComputation();
});
```

### useReducer - Estado Complexo

```tsx
type State = {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: User | null;
  error: string | null;
};

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: User }
  | { type: 'FETCH_ERROR'; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, status: 'loading', error: null };
    case 'FETCH_SUCCESS':
      return { status: 'success', data: action.payload, error: null };
    case 'FETCH_ERROR':
      return { status: 'error', data: null, error: action.payload };
    default:
      return state;
  }
}
```

### TanStack Query (React Query)

```tsx
// Configuração
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Hook de query
function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => userService.getUser(userId),
    enabled: !!userId,
  });
}

// Hook de mutation
function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.updateUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user', data.id] });
    },
  });
}

// Uso no componente
function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = useUser(userId);
  const updateUser = useUpdateUser();

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  if (!user) return null;

  return (
    <div>
      <h1>{user.name}</h1>
      <button
        onClick={() => updateUser.mutate({ id: userId, name: 'New Name' })}
        disabled={updateUser.isPending}
      >
        Update
      </button>
    </div>
  );
}
```

### Zustand para Estado Global

```tsx
// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
);

// Uso
function Header() {
  const { user, logout } = useAuthStore();
  // ...
}
```

---

## Estilização

### CSS Modules

```tsx
// Button.module.css
.button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
}

.primary {
  background: var(--color-primary);
  color: white;
}

.secondary {
  background: var(--color-secondary);
}

// Button.tsx
import styles from './Button.module.css';

function Button({ variant = 'primary', children }) {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>
      {children}
    </button>
  );
}
```

### CSS Variables para Temas

```css
/* styles/variables.css */
:root {
  /* Colors */
  --color-primary: #667eea;
  --color-secondary: #764ba2;
  --color-success: #22c55e;
  --color-error: #ef4444;
  --color-warning: #f59e0b;

  /* Text */
  --color-text-primary: #1e293b;
  --color-text-secondary: #64748b;
  --color-text-muted: #94a3b8;

  /* Background */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8fafc;
  --color-bg-tertiary: #f1f5f9;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;
}

/* Dark theme */
[data-theme='dark'] {
  --color-text-primary: #f8fafc;
  --color-text-secondary: #cbd5e1;
  --color-bg-primary: #0f172a;
  --color-bg-secondary: #1e293b;
}
```

### Classe Condicional

```tsx
// Utilitário simples
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// Uso
<button className={cn(
  styles.button,
  variant === 'primary' && styles.primary,
  isDisabled && styles.disabled,
  className
)}>
  {children}
</button>
```

---

## Testes

### Estrutura de Teste

```tsx
// Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  describe('rendering', () => {
    it('should render children correctly', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('should apply variant class', () => {
      render(<Button variant="primary">Primary</Button>);
      expect(screen.getByRole('button')).toHaveClass('primary');
    });
  });

  describe('interactions', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Click me</Button>);
      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick} disabled>Click me</Button>);
      await user.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });
  });
});
```

### Testing Hooks

```tsx
// useCounter.test.tsx
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('should initialize with custom value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it('should increment', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
```

### Mocking API

```tsx
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { UserProfile } from './UserProfile';

const server = setupServer(
  rest.get('/api/users/:id', (req, res, ctx) => {
    return res(ctx.json({ id: '1', name: 'John Doe', email: 'john@email.com' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrapper({ children }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('UserProfile', () => {
  it('should display user data', async () => {
    render(<UserProfile userId="1" />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('should display error on failure', async () => {
    server.use(
      rest.get('/api/users/:id', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(<UserProfile userId="1" />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

---

## Performance

### React.memo

```tsx
// Use quando o componente renderiza frequentemente com as mesmas props
const ExpensiveList = React.memo(function ExpensiveList({ items }: Props) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
});

// Com comparador customizado
const UserCard = React.memo(
  function UserCard({ user }: { user: User }) {
    return <div>{user.name}</div>;
  },
  (prevProps, nextProps) => prevProps.user.id === nextProps.user.id
);
```

### useMemo e useCallback

```tsx
// useMemo: para valores computados pesados
function UserList({ users, filter }: Props) {
  const filteredUsers = useMemo(
    () => users.filter(u => u.name.includes(filter)),
    [users, filter]
  );

  return <List items={filteredUsers} />;
}

// useCallback: para funções passadas como props
function Parent() {
  const [count, setCount] = useState(0);

  // Sem useCallback, handleClick seria recriada a cada render
  const handleClick = useCallback((id: string) => {
    console.log('clicked', id);
  }, []); // Dependências vazias = função estável

  return <Child onClick={handleClick} />;
}
```

### Lazy Loading

```tsx
// Lazy load de páginas
const SessionPage = lazy(() => import('./pages/Session'));
const ProfilePage = lazy(() => import('./pages/Profile'));

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/session" element={<SessionPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </Suspense>
  );
}

// Lazy load de componentes pesados
const VideoPlayer = lazy(() => import('./components/VideoPlayer'));

function Session() {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div>
      <button onClick={() => setShowVideo(true)}>Start</button>
      {showVideo && (
        <Suspense fallback={<Spinner />}>
          <VideoPlayer />
        </Suspense>
      )}
    </div>
  );
}
```

### Virtualização para Listas Grandes

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Acessibilidade

### Semântica HTML

```tsx
// ❌ RUIM
<div onClick={handleClick}>Click me</div>

// ✅ BOM
<button onClick={handleClick}>Click me</button>

// ❌ RUIM
<div className="header">
  <div className="nav">...</div>
</div>

// ✅ BOM
<header>
  <nav>...</nav>
</header>
```

### ARIA quando necessário

```tsx
// Modal acessível
function Modal({ isOpen, onClose, title, children }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-hidden={!isOpen}
    >
      <h2 id="modal-title">{title}</h2>
      {children}
      <button onClick={onClose} aria-label="Fechar modal">
        ×
      </button>
    </div>
  );
}

// Loading state
<button disabled={isLoading} aria-busy={isLoading}>
  {isLoading ? 'Carregando...' : 'Enviar'}
</button>

// Ícone apenas visual
<span aria-hidden="true">🔍</span>
<span className="sr-only">Buscar</span>
```

### Focus Management

```tsx
// Trap focus no modal
import { FocusTrap } from 'focus-trap-react';

function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <FocusTrap>
      <div className="modal">
        {children}
        <button onClick={onClose}>Fechar</button>
      </div>
    </FocusTrap>
  );
}

// Auto-focus no primeiro input
function SearchForm() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return <input ref={inputRef} type="search" />;
}
```

### Skip Links

```tsx
// Layout.tsx
function Layout({ children }) {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Pular para conteúdo principal
      </a>
      <Header />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </>
  );
}

// CSS
.skip-link {
  position: absolute;
  left: -9999px;
}

.skip-link:focus {
  left: 0;
  z-index: 9999;
  background: white;
  padding: 1rem;
}
```

---

## Segurança

### XSS Prevention

```tsx
// ❌ PERIGOSO: dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ BOM: React escapa automaticamente
<div>{userInput}</div>

// Se precisar de HTML, sanitize primeiro
import DOMPurify from 'dompurify';

function SafeHTML({ html }: { html: string }) {
  const sanitized = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

### Validação de Input

```tsx
// Com Zod
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginForm() {
  const handleSubmit = (data: LoginForm) => {
    const result = loginSchema.safeParse(data);
    if (!result.success) {
      // Mostrar erros
      return;
    }
    // Prosseguir com login
  };
}
```

### Tokens e Autenticação

```tsx
// Nunca armazene tokens sensíveis em localStorage para aplicações críticas
// Use httpOnly cookies quando possível

// Se usar localStorage, limpe em logout
function logout() {
  localStorage.removeItem('token');
  // ou
  sessionStorage.clear();
}

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## Convenções de Código

### Nomenclatura

```tsx
// Componentes: PascalCase
function UserProfile() {}
function SessionCard() {}

// Hooks: camelCase com use prefix
function useAuth() {}
function useLocalStorage() {}

// Funções/variáveis: camelCase
const handleClick = () => {};
const isLoading = true;
const userData = {};

// Constantes: SCREAMING_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_ATTEMPTS = 3;

// Tipos/Interfaces: PascalCase
interface User {}
type ButtonVariant = 'primary' | 'secondary';

// Arquivos de componente: PascalCase
UserProfile.tsx
SessionCard.tsx

// Outros arquivos: camelCase ou kebab-case
useAuth.ts
api-client.ts
```

### Organização de Imports

```tsx
// 1. React
import { useState, useEffect } from 'react';

// 2. Bibliotecas externas
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// 3. Componentes internos
import { Button } from '@/components/ui';
import { UserCard } from '@/components/common';

// 4. Hooks internos
import { useAuth } from '@/hooks/useAuth';

// 5. Utilitários/Serviços
import { formatDate } from '@/utils/format';
import { userService } from '@/services';

// 6. Tipos
import type { User } from '@/types';

// 7. Estilos
import styles from './Component.module.css';
```

### Export Pattern

```tsx
// Prefer named exports
export function UserCard() {}
export function UserList() {}

// Barrel exports em index.ts
// components/ui/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Modal } from './Modal';

// Uso
import { Button, Input, Modal } from '@/components/ui';
```

### Props Pattern

```tsx
// Destructure props
function Button({ children, variant = 'primary', ...rest }: ButtonProps) {
  return <button {...rest}>{children}</button>;
}

// Evite props spreading excessivo
// ❌ RUIM
<Component {...props} />

// ✅ BOM: Explicite as props
<Component
  name={props.name}
  value={props.value}
  onChange={props.onChange}
/>
```

---

## Checklist de Code Review

### Funcionalidade
- [ ] O componente faz o que deveria fazer?
- [ ] Casos de borda tratados?
- [ ] Estados de loading/error tratados?

### Código
- [ ] TypeScript sem `any`?
- [ ] Componentes pequenos e focados?
- [ ] Hooks seguem as regras?
- [ ] Sem código duplicado?

### Performance
- [ ] Re-renders desnecessários evitados?
- [ ] Listas grandes virtualizadas?
- [ ] Lazy loading onde apropriado?

### Acessibilidade
- [ ] Semântica HTML correta?
- [ ] Labels em inputs?
- [ ] Navegação por teclado funciona?

### Testes
- [ ] Testes unitários para lógica?
- [ ] Testes de integração para fluxos?
- [ ] Coverage adequado?

---

## Referências

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Web Accessibility Initiative](https://www.w3.org/WAI/)
- [Vite](https://vitejs.dev/)
