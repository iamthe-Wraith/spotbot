<script lang="ts">
	import { page } from "$app/state";
	import ComboBox from "$lib/components/ComboBox.svelte";
	import Link from "$lib/components/Link.svelte";
    import WorkflowSteps from "$lib/components/WorkflowSteps.svelte";
	import { db, WORKFLOW_STATUS, type IWorkflow, type IWorkflowFile } from "$lib/state/db.svelte";
	import { onMount } from "svelte";

    interface IFiles {
        base: IWorkflowFile | null;
        updated: IWorkflowFile | null;
    }
    
    let workflow = $state<IWorkflow | null>(null);
    let files = $state<IFiles>({
        base: null,
        updated: null,
    });

    let options = $derived(files.updated?.columns?.map(c => ({
        value: c,
        text: c,
    })) ?? [])

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

    const on_map_columns = async (e: Event) => {
        e.preventDefault();

        console.log('map columns');
    }
</script>

<div class="workflow-container">
    {#if workflow}
        <WorkflowSteps {workflow} />

        {#if workflow.status === WORKFLOW_STATUS.CREATED}
            <section>
                You must upload the base and updated files before mapping columns.

                <Link href="/workflows/{workflow.id}" theme="primary">
                    Upload Files
                </Link>
            </section>
        {:else}
            <section>
                <h1>{workflow.name} - Map Columns</h1>
            </section>

            <section class="column-mapping-container">
                <form
                    method="POST"
                    onsubmit={on_map_columns}
                >
                    {#if files.base && files.updated}
                        <div class="column-mapping-row">
                            <div class="h2">Base Columns</div>

                            <div class="h2">Updated Columns</div>
                        </div>
                        {#each files.base.columns as column}
                            <div class="column-mapping-row">
                                <div>
                                    { column }
                                </div>

                                <div>
                                    <ComboBox
                                        id="column-mapping-base-column"
                                        name="base_column"
                                        options={options}
                                        selected_option={options?.find(c => c.value === column)}
                                        placeholder="Select a Column"
                                    />
                                </div>
                            </div>
                        {/each}
                    {/if}
                </form>

                <div class="controls-container">
                    <Link
                        href="/workflows/{workflow.id}"
                        theme="primary-text"
                    >
                        Back to Files Upload
                    </Link>

                    <div>
                        process data...
                    </div>
                </div>
            </section>
        {/if}
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

    .column-mapping-container {
        display: flex;
        flex: 1;
        flex-direction: column;
        align-items: stretch;
        justify-content: space-between;
        gap: 1rem;
        height: 100%;
        margin-top: 2rem;
    }

    .column-mapping-container form {
        width: 100%;
        max-width: 50rem;
        margin: 0 auto;
    }

    .column-mapping-row {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem;
        border-bottom: 1px solid var(--primary-200);

        & > * {
            flex: 1;
        }
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