# DataTable Component

Componente de tabela genérico e reutilizável com paginação, seleção e suporte a renderização customizada.

## Características

- ✅ Colunas dinâmicas com renderização customizada
- ✅ Paginação completa (primeira, anterior, números, próxima, última)
- ✅ Seletor de tamanho de página
- ✅ Seleção de linhas com checkboxes (opcional)
- ✅ Estados de loading e empty
- ✅ Responsivo
- ✅ Totalmente tipado com TypeScript

## Uso Básico

```tsx
import { DataTable, Column } from '@/components/ui';

interface User {
  id: string;
  name: string;
  email: string;
  active: boolean;
}

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  // Definir colunas
  const columns: Column<User>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (user) => <strong>{user.name}</strong>,
    },
    {
      key: 'email',
      label: 'Email',
      render: (user) => user.email,
    },
    {
      key: 'status',
      label: 'Status',
      render: (user) => (
        <span className={user.active ? 'active' : 'inactive'}>
          {user.active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      data={users}
      columns={columns}
      getRowKey={(user) => user.id}
      loading={loading}
      emptyMessage="No users found"
      showPagination
      currentPage={page}
      pageSize={pageSize}
      totalPages={totalPages}
      totalElements={totalElements}
      onPageChange={setPage}
      onPageSizeChange={(size) => {
        setPageSize(size);
        setPage(0);
      }}
      paginationLabel="users"
    />
  );
}
```

## Exemplo com Seleção

```tsx
function UsersPageWithSelection() {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  return (
    <DataTable
      data={users}
      columns={columns}
      getRowKey={(user) => user.id}
      selectable
      selectedKeys={selectedKeys}
      onSelectionChange={setSelectedKeys}
      // ... outras props
    />
  );
}
```

## Exemplo com Ações

```tsx
const columns: Column<User>[] = [
  // ... outras colunas
  {
    key: 'actions',
    label: 'Actions',
    render: (user) => (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={() => handleEdit(user)}>Edit</button>
        <button onClick={() => handleDelete(user.id)}>Delete</button>
      </div>
    ),
  },
];
```

## Props

### DataTableProps<T>

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `data` | `T[]` | **required** | Array de dados a exibir |
| `columns` | `Column<T>[]` | **required** | Definição das colunas |
| `getRowKey` | `(item: T) => string` | **required** | Função para extrair chave única de cada item |
| `loading` | `boolean` | `false` | Estado de carregamento |
| `emptyMessage` | `string` | `"No data found"` | Mensagem quando não há dados |
| `showPagination` | `boolean` | `true` | Mostrar controles de paginação |
| `currentPage` | `number` | `0` | Página atual (0-indexed) |
| `pageSize` | `number` | `20` | Tamanho da página |
| `totalPages` | `number` | `0` | Número total de páginas |
| `totalElements` | `number` | `0` | Número total de elementos |
| `onPageChange` | `(page: number) => void` | - | Handler para mudança de página |
| `onPageSizeChange` | `(size: number) => void` | - | Handler para mudança de tamanho |
| `pageSizes` | `number[]` | `[10, 20, 50, 100]` | Tamanhos de página disponíveis |
| `selectable` | `boolean` | `false` | Habilitar seleção com checkboxes |
| `selectedKeys` | `Set<string>` | `new Set()` | Keys dos itens selecionados |
| `onSelectionChange` | `(keys: Set<string>) => void` | - | Handler para mudança de seleção |
| `className` | `string` | - | Classe CSS customizada |
| `paginationLabel` | `string` | `"items"` | Label para info de paginação |

### Column<T>

| Prop | Tipo | Descrição |
|------|------|-----------|
| `key` | `string` | Chave única da coluna |
| `label` | `string` | Label do cabeçalho |
| `render` | `(item: T) => ReactNode` | Função de renderização da célula |
| `headerClassName` | `string` | Classe CSS para o cabeçalho (opcional) |
| `cellClassName` | `string` | Classe CSS para as células (opcional) |

## Integração com API

```tsx
useEffect(() => {
  loadData();
}, [page, pageSize]);

const loadData = async () => {
  setLoading(true);
  try {
    const response = await api.getUsers(page, pageSize);
    setUsers(response.content);
    setTotalPages(response.totalPages);
    setTotalElements(response.totalElements);
  } catch (error) {
    console.error('Failed to load data:', error);
  } finally {
    setLoading(false);
  }
};
```

## Estilos Customizados

Você pode sobrescrever os estilos usando a prop `className` ou as classes das colunas:

```tsx
const columns: Column<User>[] = [
  {
    key: 'name',
    label: 'Name',
    render: (user) => user.name,
    headerClassName: styles.nameHeader,
    cellClassName: styles.nameCell,
  },
];
```
