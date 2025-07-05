<script lang="ts">
	import { page } from "$app/state";
    import { csvParse } from "d3";
	import dayjs from "dayjs";
    import utc from "dayjs/plugin/utc";
	import Button from "$lib/components/Button.svelte";
	import { db, WORKFLOW_STATUS, type IWorkflow, type IWorkflowFile } from "$lib/state/db.svelte";
    import { onMount } from "svelte";
	import Link from "$lib/components/Link.svelte";
	import WorkflowSteps from "$lib/components/WorkflowSteps.svelte";
	import Icon from "$lib/components/Icon.svelte";

    dayjs.extend(utc);

    interface IFileData {
        filename: string;
        size: number;
        columns: string[];
        data: unknown[];
        type: 'base' | 'updated';
    }

    interface IFiles {
        base: IWorkflowFile | null;
        updated: IWorkflowFile | null;
    }

    let workflow = $state<IWorkflow | null>(null);
    let files = $state<IFiles>({
        base: null,
        updated: null,
    });

    let base_data = $state<IFileData | null>(null);
    let updated_data = $state<IFileData | null>(null);

    let changing_files = $state(false);

    let error = $state('');

    onMount(async () => {
        await load_workflow();
        await load_workflow_files();
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

    const load_workflow_files = async () => {
        try {
            if (workflow) {
                const workflow_files = await db.workflow_files.where('workflow_id')
                    .equals(workflow.id)
                    .toArray();

                if (workflow_files.length > 0) {
                    files.base = workflow_files.find(f => f.workflow_file_type === 'base') ?? null;
                    files.updated = workflow_files.find(f => f.workflow_file_type === 'updated') ?? null;
                }
            }
        } catch (e) {
            error = `Failed to load workflow files: ${e}`;
        }
    }

    const on_cancel_change_files = async () => {
        changing_files = false;
    }

    const on_change_files = async () => {
        changing_files = true;
    }

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
            };

            updated_data = {
                filename: updated_data_file.name,
                size: updated_data_file.size,
                columns: raw_updated_data.columns,
                data: raw_updated_data.data,
                type: 'updated',
            };

            // deleting existing file data for this workflow before writing new data
            await db.workflow_files.where('workflow_id').equals(workflow!.id).delete();
            await db.workflow_file_data.where('workflow_id').equals(workflow!.id).delete();

            await save_file_data($state.snapshot(base_data));
            await save_file_data($state.snapshot(updated_data));

            if (files.base && files.updated) {
                workflow!.status = WORKFLOW_STATUS.FILES_UPLOADED;
                await db.workflows.update(workflow!.id, workflow!);
            }

            changing_files = false;
        } catch (err: unknown) {
            error = err instanceof Error ? err.message : 'Unknown error';
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

            files[file_data.type] = await db.workflow_files.get(result) ?? null;
        } catch (err: unknown) {
            error = err instanceof Error ? err.message : 'Unknown error';
            return null;
        }
    }
</script>

<div class="workflow-container">
    {#if workflow}
        <WorkflowSteps {workflow} />
    
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

                        <div class="import-card-header h2">Base Data</div>

                        <p>
                            Upload the .csv file that contains your base data here. This is the data that will be updated by the workflow.
                        </p>

                        {#if files.base && !changing_files}
                            <p class="file-uploaded-text">
                                <Icon icon="fa-solid fa-check" theme="success" />
                                {files.base.filename}
                            </p>
                        {:else}
                            <input type="file" accept=".csv" name="base_data_file" />
                        {/if}
                    </div>
        
                    <div class="import-card">
                        <div class="import-card-header h2">Updated Data</div>

                        <p>
                            Upload the .csv file that contains your updated data here. This is the data that will be used to update the base data.
                        </p>

                        {#if files.updated && !changing_files}
                            <p class="file-uploaded-text">
                                <Icon icon="fa-solid fa-check" theme="success" />
                                {files.updated.filename}
                            </p>
                        {:else}
                            <input type="file" accept=".csv" name="updated_data_file" />
                        {/if}
                    </div>
                </div>

                {#if error}
                    <p class="error">{error}</p>
                {/if}

                <div class="buttons-container">
                    {#if files.base && files.updated && !changing_files}
                        <Button
                            type="button"
                            theme="primary-text"
                            onclick={on_change_files}
                        >
                            Change Files
                        </Button>
                    {:else}
                        {#if files.base && files.updated && changing_files}
                            <Button
                                type="button"
                                theme="primary-text"
                                onclick={on_cancel_change_files}
                            >
                                Cancel Change
                            </Button>
                        {/if}

                        <Button
                            type="submit"
                            theme="primary"
                        >
                            Upload Files
                        </Button>
                    {/if}
                </div>
            </form>

            <div class="controls-container">
                <Link
                    href="/workflows"
                    theme="primary-text"
                >
                    Back to Workflows
                </Link>

                <span class:disabled={!files.base || !files.updated || changing_files}>
                    <Link
                        href={files.base && files.updated && !changing_files ? `/workflows/${workflow.id}/map-columns` : '#'}
                        theme="primary"
                    >
                        Map Columns
                    </Link>
                </span>
            </div>
        </section>
    {:else}
        <p>Loading workflow...</p>
    {/if}
</div>

<style>
    .workflow-container {
        display: flex;
        flex: 1;
        flex-direction: column;
        align-items: stretch;
        justify-content: space-between;
        gap: 1rem;
        height: 100%;
    }

    .imports-container {
        display: flex;
        flex: 1;
        flex-direction: column;
        align-items: stretch;
        justify-content: space-between;
        gap: 1rem;
        height: 100%;
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
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;

        @media (min-width: 768px) {
            flex-direction: row;
        }
    }

    .import-card {
        display: flex;
        flex: 1;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        gap: 1rem;
        width: 100%;
        max-width: 30rem;
        padding: 1rem;
        border-radius: 0.5rem;
        background-image: linear-gradient(to bottom, var(--primary-300), var(--primary-200));
        border: 1px solid var(--primary-200);
        border-top: 1px solid var(--accent1-500);
    }

    .import-card input[type="file"] {
        /* display: none; */
    }

    .file-uploaded-text {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        gap: 0.5rem;
    }

    .buttons-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 1rem;
    }

    .controls-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding-top: 1rem;

        .disabled {
            opacity: 0.5;
            pointer-events: none;
        }
    }
</style>