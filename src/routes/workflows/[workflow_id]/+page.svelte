<script lang="ts">
	import { page } from "$app/state";
    import { csvParse } from "d3";
	import Button from "$lib/components/Button.svelte";
	import { db, WORKFLOW_STATUS, type IWorkflow } from "$lib/state/db.svelte";
    import { onMount } from "svelte";

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

    const read_data = (reader: FileReader, file: File) => new Promise<{ data: any[], columns: string[] }>((resolve, reject) => {
        reader.onload = function (e: ProgressEvent<FileReader>) {
            try {
                const text = e.target?.result;
                if (text) {
                    const data = csvParse(text as string);
                    const columns = (data['columns'] || []).filter(c => !!c);

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

            const base_data = await read_data(reader, base_data_file);
            const updated_data = await read_data(reader, updated_data_file);

            const all_base_data = {
                filename: base_data_file.name,
                size: base_data_file.size,
                columns: base_data.columns,
                data: base_data.data,
            };

            const all_updated_data = {
                filename: updated_data_file.name,
                size: updated_data_file.size,
                columns: updated_data.columns,
                data: updated_data.data,
            };

            // TODO: save file data to db
            console.log(all_base_data, all_updated_data);
        } catch (err: unknown) {
            error = err instanceof Error ? err.message : 'Unknown error';
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
                    </div>
        
                    <div class="import-card">
                        <input type="file" accept=".csv" name="updated_data_file" />
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