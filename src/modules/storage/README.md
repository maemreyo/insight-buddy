# Advanced Storage System Module

A comprehensive storage system with advanced features for managing application data securely and efficiently.

## Features

- 🔐 **Encryption**: AES-256 encryption for sensitive data
- 🗜️ **Compression**: Reduce storage size with gzip compression
- 🔄 **Sync**: Automatic synchronization between devices
- 📦 **Bulk Operations**: Process multiple items atomically
- 🔍 **Query System**: Search and filter data with complex queries
- 📥 **Import/Export**: Backup and restore data
- 🏷️ **Versioning**: Track change history
- 📊 **Quota Management**: Monitor and manage storage usage

## Installation

Add the following dependencies to your `package.json`:

```json
{
  "dependencies": {
    "dexie": "^3.2.4",
    "crypto-js": "^4.2.0",
    "pako": "^2.1.0"
  }
}
```

## Usage

### Basic Storage Operations

```typescript
import { storageManager } from '~modules/storage';

// Get default storage instance
const storage = storageManager.get();

// Store data with optional tags
await storage.set('user_preferences', {
  theme: 'dark',
  language: 'en',
  notifications: true
}, ['settings']); // tags for categorization

// Retrieve data
const prefs = await storage.get('user_preferences');

// Update data
await storage.update('user_preferences', (current) => ({
  ...current,
  theme: 'light'
}));

// Delete data
await storage.delete('user_preferences');

// Check if key exists
const exists = await storage.has('user_preferences');
```

### Using React Hooks

```typescript
import { useAdvancedStorage } from '~modules/storage/hooks';

function SettingsComponent() {
  // Automatically loads and updates when data changes
  const {
    value,
    set,
    update,
    remove,
    loading,
    error
  } = useAdvancedStorage('user_preferences', {
    theme: 'light',
    language: 'en'
  });

  const toggleTheme = async () => {
    await update(current => ({
      ...current,
      theme: current.theme === 'light' ? 'dark' : 'light'
    }));
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <p>Current theme: {value.theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

### Session Management

```typescript
import { useSession } from '~modules/storage/hooks';

function UserSession() {
  const {
    session,
    setSession,
    clearSession,
    isAuthenticated
  } = useSession();

  const login = async (userData) => {
    await setSession({
      user: userData,
      token: 'jwt-token',
      expiresAt: new Date(Date.now() + 3600000)
    });
  };

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, {session.user.name}</p>
          <button onClick={clearSession}>Logout</button>
        </>
      ) : (
        <button onClick={() => login({ id: 1, name: 'John' })}>
          Login
        </button>
      )}
    </div>
  );
}
```

### History Tracking

```typescript
import { useHistory } from '~modules/storage/hooks';

function DocumentEditor() {
  const {
    current,
    history,
    saveVersion,
    revertTo,
    clearHistory
  } = useHistory('document_123', initialContent);

  const saveDocument = async (content) => {
    // Save current state to history
    await saveVersion(content);
  };

  return (
    <div>
      <textarea
        value={current}
        onChange={(e) => saveDocument(e.target.value)}
      />
      <div>
        <h3>History ({history.length} versions)</h3>
        {history.map((version, index) => (
          <button key={index} onClick={() => revertTo(index)}>
            Version {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Query System

```typescript
import { useStorageQuery } from '~modules/storage/hooks';

function BookmarksList() {
  // Query with filtering, sorting, and pagination
  const {
    data,
    loading,
    error,
    refresh,
    pagination
  } = useStorageQuery({
    where: {
      'metadata.tags': 'bookmark',
      'value.category': 'work'
    },
    orderBy: 'metadata.updated:desc',
    limit: 10,
    offset: 0
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Bookmarks</h2>
      <ul>
        {data.map(item => (
          <li key={item.id}>{item.value.title}</li>
        ))}
      </ul>
      <button onClick={() => pagination.next()}>
        Next Page
      </button>
    </div>
  );
}
```

### Bulk Operations

```typescript
import { storageManager } from '~modules/storage';

// Execute multiple operations atomically
await storageManager.get().bulk([
  {
    type: 'set',
    key: 'item1',
    value: { name: 'Item 1' }
  },
  {
    type: 'update',
    key: 'item2',
    updateFn: (v) => ({ ...v, updated: true })
  },
  {
    type: 'delete',
    key: 'item3'
  }
]);
```

### Import/Export

```typescript
import { storageManager } from '~modules/storage';

// Export all data
const exportData = async () => {
  const blob = await storageManager.get().export({
    format: 'json',
    encrypted: true,
    compressed: true
  });

  // Create download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'backup.json.gz';
  a.click();
};

// Import data
const importData = async (file) => {
  await storageManager.get().import(file, {
    format: 'json',
    compressed: true
  });
};
```

## UI Components

### Storage Manager UI

```typescript
import { StorageProvider } from '~modules/storage';
import { StorageManagerUI } from '~modules/storage/components';

function OptionsPage() {
  return (
    <StorageProvider config={{
      encryption: { enabled: true },
      compression: { enabled: true },
      quota: { maxSize: 50 } // 50MB
    }}>
      <StorageManagerUI />
    </StorageProvider>
  );
}
```

### Storage Explorer

```typescript
import { StorageExplorer } from '~modules/storage/components';

// Visual interface to browse, search, and manage stored items
function DataExplorer() {
  return (
    <StorageExplorer
      title="Data Explorer"
      allowDelete={true}
      allowExport={true}
      filterTags={['settings', 'user', 'cache']}
    />
  );
}
```

### Settings Editor

```typescript
import { SettingsEditor } from '~modules/storage/components';

// UI for editing application settings
function SettingsPage() {
  return (
    <SettingsEditor
      settingsKey="app_settings"
      schema={settingsSchema}
      onSave={(newSettings) => console.log('Settings saved', newSettings)}
    />
  );
}
```

## Configuration

```typescript
import { storageManager, StorageConfig } from '~modules/storage';

const config: StorageConfig = {
  encryption: {
    enabled: true,
    algorithm: 'AES-GCM' // or 'AES-CBC'
  },
  compression: {
    enabled: true,
    algorithm: 'gzip' // or 'lz4', 'brotli'
  },
  sync: {
    enabled: true,
    interval: 300000, // 5 minutes
    conflictResolution: 'merge' // or 'local', 'remote'
  },
  quota: {
    maxSize: 100, // MB
    warnAt: 80 // percentage
  },
  versioning: {
    enabled: true,
    maxVersions: 10
  }
};

// Create configured instance
const customStorage = storageManager.create('myStorage', config);
```

## API Reference

### Core Services

- `storageManager`: Factory for creating and managing storage instances
- `AdvancedStorage`: Main storage implementation with all features
- `SessionManager`: Manages user sessions
- `HistoryManager`: Tracks version history for items

### Types

```typescript
interface StorageConfig {
  encryption?: {
    enabled: boolean;
    key?: string;
    algorithm?: 'AES-GCM' | 'AES-CBC';
  };
  compression?: {
    enabled: boolean;
    algorithm?: 'gzip' | 'lz4' | 'brotli';
  };
  sync?: {
    enabled: boolean;
    interval?: number;
    conflictResolution?: 'local' | 'remote' | 'merge';
  };
  quota?: {
    maxSize?: number; // in MB
    warnAt?: number; // percentage
  };
  versioning?: {
    enabled: boolean;
    maxVersions?: number;
  };
}

interface StorageItem<T = any> {
  id: string;
  key: string;
  value: T;
  metadata: {
    created: Date;
    updated: Date;
    version: number;
    size: number;
    encrypted: boolean;
    compressed: boolean;
    tags?: string[];
  };
}

interface QueryOptions {
  where?: Record<string, any>;
  orderBy?: string;
  limit?: number;
  offset?: number;
  select?: string[];
  include?: string[];
}

interface StorageStats {
  totalSize: number;
  itemCount: number;
  quotaUsed: number;
  quotaAvailable: number;
  lastSync?: Date;
  lastBackup?: Date;
}
```

### React Hooks

- `useAdvancedStorage(key, defaultValue?)`: Basic storage operations
- `useSession()`: Session management
- `useSettings()`: Application settings
- `useHistory(key, initialValue?)`: Version history tracking
- `useStorageStats()`: Storage usage statistics
- `useStorageQuery(queryOptions)`: Advanced data querying

## Security Features

1. **Automatic Encryption**: Data is automatically encrypted when enabled
2. **Secure Key Management**: Keys are generated and stored securely
3. **Encrypted Exports**: Backup files can be encrypted
4. **No Plain Text**: Sensitive data is never stored as plain text

## Performance Optimization

1. **IndexedDB Backend**: Uses Dexie for optimal performance
2. **Compression**: Reduces size up to 70% with gzip
3. **Batch Processing**: Processes multiple operations in a single transaction
4. **Lazy Loading**: Only loads data when needed
5. **Efficient Queries**: Uses indexed fields for fast lookups

## Testing

```typescript
// Mock storage for tests
jest.mock('~modules/storage', () => ({
  storageManager: {
    get: () => ({
      set: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      query: jest.fn()
    })
  }
}));
```

## Best Practices

1. **Use Tags**: Categorize items with tags for easier querying
2. **Set Quotas**: Prevent storage overflow
3. **Regular Backups**: Export data periodically
4. **Vacuum Periodically**: Clean up old versions
5. **Monitor Usage**: Track storage statistics
6. **Use Transactions**: Group related operations with bulk operations
7. **Handle Errors**: Always catch and handle storage errors
