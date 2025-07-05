<script lang="ts">
	import { page } from "$app/state";
    import { csvParse } from "d3";
	import dayjs from "dayjs";
    import utc from "dayjs/plugin/utc";
	import Button from "$lib/components/Button.svelte";
	import { db, WORKFLOW_STATUS, type IWorkflow } from "$lib/state/db.svelte";
    import { onMount } from "svelte";

    dayjs.extend(utc);

    interface IFileData {
        filename: string;
        size: number;
        columns: string[];
        data: unknown[];
        type: 'base' | 'updated';
        saved: boolean;
    }

    interface IStep {
        name: string;
        completed: boolean;
    }

    let workflow = $state<IWorkflow | null>(null);
    let steps = $derived.by(() => {
        const _steps: IStep[] = [
            {
                name: 'Workflow Created',
                completed: true,
            },
            {
                name: 'Files Uploaded',
                completed: workflow?.status === WORKFLOW_STATUS.FILES_UPLOADED ||
                    workflow?.status === WORKFLOW_STATUS.COLUMNS_MAPPED ||
                    workflow?.status === WORKFLOW_STATUS.PROCESSING ||
                    workflow?.status === WORKFLOW_STATUS.PROCESSED ||
                    workflow?.status === WORKFLOW_STATUS.COMPLETED,
            },
            {
                name: 'Columns Mapped',
                completed: workflow?.status === WORKFLOW_STATUS.COLUMNS_MAPPED ||
                    workflow?.status === WORKFLOW_STATUS.PROCESSING ||
                    workflow?.status === WORKFLOW_STATUS.PROCESSED ||
                    workflow?.status === WORKFLOW_STATUS.COMPLETED,
            },
            {
                name: 'Data Processed',
                completed: workflow?.status === WORKFLOW_STATUS.PROCESSED ||
                    workflow?.status === WORKFLOW_STATUS.COMPLETED,
            },
            {
                name: 'Workflow Completed',
                completed: workflow?.status === WORKFLOW_STATUS.COMPLETED,
            },
        ];

        return _steps;
    });

    let base_data = $state<IFileData | null>(null);
    let updated_data = $state<IFileData | null>(null);

    let error = $state('');

    onMount(async () => {
        load_workflow();
    });

    const load_workflow = async () => {
        try {
            const workflow_id = page.params.workflow_id;
        
            const wf = await db.workflows.get(workflow_id);

            if (wf) {
                workflow = wf;
            } else {
                error = 'Workflow not found';
            }
        } catch (e) {
            error = `Failed to load workflow: ${e}`;
        }
    }

    const read_data = (reader: FileReader, file: File) => new Promise<{ data: unknown[], columns: string[] }>((resolve, reject) => {
        reader.onload = function (e: ProgressEvent<FileReader>) {
            try {
                const text = e.target?.result;
                if (text) {
                    const raw_data = csvParse(text as string);
                    // remove empty columns
                    const columns = raw_data.length > 0 ? Object.keys(raw_data[0]).filter(c => !!c) : [];
                    // remove empty data in each row
                    const data = raw_data.map(row => {
                        const obj: Record<string, unknown> = {};
                        for (const [key, value] of Object.entries(row)) {
                            if (!!key.trim()) obj[key] = value;
                        }
                        return obj;
                    });

                    resolve({ data, columns });
                } else {
                    reject(new Error(`No data found in ${file.name ?? 'file'}`));
                }
            } catch (err) {
                reject(new Error(`Failed to read ${file.name ?? 'file'}: ${err instanceof Error ? err.message : 'Unknown error'}`));
            }
        };

        reader.onerror = function (e: ProgressEvent<FileReader>) {
            reject(e);
        };

        reader.readAsText(file);
    })

    const on_upload = async (e: Event) => {
        e.preventDefault();

        try {
            const formData = new FormData(e.target as HTMLFormElement);
            const base_data_file = formData.get('base_data_file') as File;
            const updated_data_file = formData.get('updated_data_file') as File;

            if (!base_data_file.name) {
                error = 'Please upload a base data file';
                return;
            }

            if (!base_data_file.size) {
                error = 'No data found in base data file';
                return;
            }

            if (!updated_data_file.name) {
                error = 'Please upload an updated data file';
                return;
            }

            if (!updated_data_file.size) {
                error = 'No data found in updated data file';
                return;
            }

            const reader = new FileReader();

            const raw_base_data = await read_data(reader, base_data_file);
            const raw_updated_data = await read_data(reader, updated_data_file);

            base_data = {
                filename: base_data_file.name,
                size: base_data_file.size,
                columns: raw_base_data.columns,
                data: raw_base_data.data,
                type: 'base',
                saved: false,
            };

            updated_data = {
                filename: updated_data_file.name,
                size: updated_data_file.size,
                columns: raw_updated_data.columns,
                data: raw_updated_data.data,
                type: 'updated',
                saved: false,
            };

            // deleting existing file data for this workflow before writing new data
            await db.workflow_files.where('workflow_id').equals(workflow!.id).delete();
            await db.workflow_file_data.where('workflow_id').equals(workflow!.id).delete();

            base_data.saved = await save_file_data($state.snapshot(base_data));
            updated_data.saved = await save_file_data($state.snapshot(updated_data));

            if (base_data.saved && updated_data.saved) {
                workflow!.status = WORKFLOW_STATUS.FILES_UPLOADED;
                await db.workflows.update(workflow!.id, workflow!);
            }
        } catch (err: unknown) {
            error = err instanceof Error ? err.message : 'Unknown error';
        }
    }

    const save_file_data = async (file_data: IFileData) => {
        try {
            const now = dayjs.utc().toISOString();

            const result = await db.workflow_files.add({
                id: crypto.randomUUID(),
                workflow_id: workflow!.id,
                filename: file_data.filename,
                size: file_data.size,
                workflow_file_type: file_data.type,
                columns: file_data.columns,
                created_at: now,
                updated_at: now,
            });

            for (const row of file_data.data) {
                await db.workflow_file_data.add({
                    id: crypto.randomUUID(),
                    workflow_id: workflow!.id,
                    workflow_file_id: result,
                    data: row as object,
                    created_at: now,
                    updated_at: now,
                });
            }

            return true;
        } catch (err: unknown) {
            error = err instanceof Error ? err.message : 'Unknown error';
            return false;
        }
    }
</script>

<div>
    {#if workflow}
        <div class="workflow-steps">
            {#each steps as step, i}
                <div class="step" class:completed={step.completed}>
                    {#if step.completed}
                        <span class="step-completed-icon">
                            <i class="fa-duotone fa-solid fa-check"></i>
                        </span>
                    {/if}
                    {step.name}
                </div>
                {#if i < steps.length - 1}
                    <div class="step-divider">
                        <i class="fa-duotone fa-solid fa-chevron-right"></i>
                    </div>
                {/if}
            {/each}
        </div>
    
        <section>
            <h1>{workflow.name}</h1>
        
            {#if workflow.description}
                <p>{workflow.description}</p>
            {/if}

            <p>{workflow.confidence_threshold}% confidence threshold</p>
        </section>

        <section class="imports-container">
            <form
                method="POST"
                onsubmit={on_upload}
            >
                <div class="imports-container-inner">
                    <div class="import-card">
                        <input type="file" accept=".csv" name="base_data_file" />
                        {#if base_data?.saved}
                            <p>Base data saved</p>
                        {/if}
                    </div>
        
                    <div class="import-card">
                        <input type="file" accept=".csv" name="updated_data_file" />
                        {#if updated_data?.saved}
                            <p>Updated data saved</p>
                        {/if}
                    </div>
                </div>

                {#if error}
                    <p class="error">{error}</p>
                {/if}

                <div class="buttons-container">
                    <Button
                        type="submit"
                        theme="primary"
                    >
                        Upload Files
                    </Button>
                </div>
            </form>
        </section>
    {:else}
        <p>Loading workflow...</p>
    {/if}
</div>

<style>
    .workflow-steps {
        margin-bottom: 2rem;
    }

    .step {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        gap: 0.5rem;
        color: var(--primary-300);
    }

    .step.completed {
        --fa-primary-color: var(--success-900);
        --fa-secondary-color: var(--primary-500);

        color: var(--primary-900);
    }

    .step-completed-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1.25rem;
        height: 1.25rem;
        border-radius: 100%;
        background-color: var(--success-500);
    }

    .workflow-steps {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        gap: 1rem;
    }

    .imports-container {
        margin-top: 2rem;
    }

    .imports-container form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .error {
        margin: 0;
        text-align: center;
    }

    .imports-container-inner {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 1rem;
    }

    .import-card {
        display: flex;
        flex: 1;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        gap: 1rem;
        padding: 1rem;
        border-radius: 0.5rem;
        background-image: linear-gradient(to bottom, var(--primary-300), var(--primary-200));
        border: 1px solid var(--primary-200);
        border-top: 1px solid var(--accent1-500);
    }

    .import-card input[type="file"] {
        /* display: none; */
    }

    .buttons-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 1rem;
    }
</style>