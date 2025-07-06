import Dexie, { type EntityTable } from "dexie";

const WORKFLOW_STATUS = {
    CREATED: 'created',
    FILES_UPLOADED: 'data_uploaded',
    COLUMNS_MAPPED: 'columns_mapped',
    MAPPED_COLUMNS_REVIEWED: 'mapped_columns_reviewed',
    RESULTS_REVIEWED: 'results_reviewed',
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
    row: number;
    data: object;
    created_at: string;
    updated_at: string;
}

interface IWorkflowMatch {
    id: string;
    workflow_id: string;
    base_file_id: string;
    updated_file_id: string;
    base_row_id: string;
    updated_row_id: string;
    rejected_at: string | null;
    confirmed_at: string | null;
    confirmations: {
        base_column: string;
        updated_column: string;
        confidence: number;
    }[];
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
    workflow_matches: EntityTable<
        IWorkflowMatch,
        'id'
    >;
});

db.version(2).stores({
  workflows: '++id, name, description, confidence_threshold, status, created_at, updated_at',
  workflow_files: '++id, workflow_id, filename, size, workflow_file_type, columns, created_at, updated_at',
  workflow_column_mappings: '++id, workflow_id, workflow_file_id, base_column, updated_column, match, created_at, updated_at',
  workflow_file_data: '++id, workflow_id, workflow_file_id, data, created_at, updated_at',
  workflow_matches: '++id, workflow_id, base_file_id, updated_file_id, base_row_id, updated_row_id, rejected_at, confirmed_at, created_at, updated_at',
});

export type { IWorkflow, IWorkflowFile, IWorkflowColumnMapping, IWorkflowFileData, IWorkflowMatch };
export { db, WORKFLOW_STATUS };