import Dexie, { type EntityTable } from "dexie";

const WORKFLOW_STATUS = {
    CREATED: 'created',
    FILES_UPLOADED: 'data_uploaded',
    COLUMNS_MAPPED: 'columns_mapped',
    PROCESSING: 'processing',
    PROCESSED: 'processed',
    COMPLETED: 'completed',
    FAILED: 'failed',
} as const;

interface IWorkflow {
    id: string;
    name: string;
    description: string;
    confidence_threshold: number;
    status: typeof WORKFLOW_STATUS[keyof typeof WORKFLOW_STATUS];
    created_at: string;
    updated_at: string;
}

interface IWorkflowFile {
    id: string;
    workflow_id: string;
    filename: string;
    size: number;
    workflow_file_type: 'base' | 'updated';
    columns: string[];
    created_at: string;
    updated_at: string;
}

interface IWorkflowColumnMapping {
    id: string;
    workflow_id: string;
    base_column: string;
    updated_column: string;
    match: boolean;
    created_at: string;
    updated_at: string;
}

interface IWorkflowFileData {
    id: string;
    workflow_id: string;
    workflow_file_id: string;
    data: object;
    created_at: string;
    updated_at: string;
}

const db = $state(new Dexie('tydal') as Dexie & {
    workflows: EntityTable<
        IWorkflow,
        'id'
    >;
    workflow_files: EntityTable<
        IWorkflowFile,
        'id'
    >;
    workflow_column_mappings: EntityTable<
        IWorkflowColumnMapping,
        'id'
    >;
    workflow_file_data: EntityTable<
        IWorkflowFileData,
        'id'
    >;
});

db.version(1).stores({
  workflows: '++id, name, description, confidence_threshold, status, created_at, updated_at',
  workflow_files: '++id, workflow_id, filename, size, workflow_file_type, columns, created_at, updated_at',
  workflow_column_mappings: '++id, workflow_id, workflow_file_id, base_column, updated_column, match, created_at, updated_at',
  workflow_file_data: '++id, workflow_id, workflow_file_id, data, created_at, updated_at',
});

export type { IWorkflow, IWorkflowFile, IWorkflowColumnMapping, IWorkflowFileData };
export { db, WORKFLOW_STATUS };