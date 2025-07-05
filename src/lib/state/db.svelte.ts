import Dexie, { type EntityTable } from "dexie";

const WORKFLOW_STATUS = {
    CREATED: 'created',
    FILES_UPLOADED: 'data_uploaded',
    COLUMNS_MAPPED: 'data_mapped',
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

const db = $state(new Dexie('tydal') as Dexie & {
    workflows: EntityTable<
        IWorkflow,
        'id'
    >;
});

db.version(1).stores({
  workflows: '++id, name, description, confidence_threshold, status, created_at, updated_at',
});

export type { IWorkflow };
export { db, WORKFLOW_STATUS };