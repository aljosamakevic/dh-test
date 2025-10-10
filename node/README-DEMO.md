# DataHaven Storage Demo

A clean, organized demonstration of DataHaven's storage capabilities including bucket creation, file upload, and download operations.

## Project Structure

```
src/
├── index-new.ts              # Main entry point (organized version)
├── config/
│   ├── chain.ts              # Blockchain chain configuration
│   └── environment.ts        # Environment variables and validation
├── services/
│   ├── clientService.ts      # Viem clients and StorageHub client setup
│   └── mspService.ts         # MSP (Managed Storage Provider) service
├── operations/
│   ├── bucketOperations.ts   # Bucket creation and management
│   ├── fileOperations.ts     # File upload and download operations
│   └── dataHavenDemo.ts      # Main demo orchestration
├── types/
│   └── index.ts              # Type definitions and demo configuration
└── utils/
    └── fileUtils.ts          # File system utilities
```

## Features

- ✅ **Clean Architecture**: Separated concerns with dedicated services and operations
- ✅ **Type Safety**: Full TypeScript support with proper type definitions
- ✅ **Error Handling**: Comprehensive error handling and validation
- ✅ **Logging**: Clear console output with status indicators
- ✅ **Configuration**: Centralized configuration management

## Getting Started

1. **Environment Setup**
   ```bash
   cp .env.example .env
   # Add your PRIVATE_KEY to .env
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Run the Demo**
   ```bash
   pnpm demo
   ```

## What the Demo Does

1. **Initialize Services**: Sets up all required clients and connections
2. **Create Bucket**: Creates a storage bucket on DataHaven
3. **Upload File**: Uploads a test file to the created bucket
4. **Download File**: Downloads the file back from storage
5. **Verify**: Saves the downloaded file for verification

## Configuration

The demo configuration can be modified in `src/types/index.ts`:

```typescript
export const DEMO_CONFIG: DemoConfig = {
  bucketName: 'b1',                    // Name of the bucket to create
  testFileName: 'papermoon_logo.jpeg', // File to upload/download
  replicationLevel: 0,                 // Replication level
  replicas: 0,                         // Number of replicas
};
```

## Key Components

- **ClientService**: Manages all blockchain and StorageHub client connections
- **MspService**: Handles MSP-specific operations and value propositions
- **BucketOperations**: Manages bucket creation and verification
- **FileOperations**: Handles file upload, download, and verification
- **DataHavenDemo**: Orchestrates the complete demo workflow

## Scripts

- `pnpm demo` - Run the organized demo
- `pnpm start` - Run the original demo
- `pnpm build` - Build the TypeScript project
