<script lang="ts">
    import { onMount } from 'svelte';
    import Papa from 'papaparse';
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';
	import Link from '$lib/components/Link.svelte';
    import WorkflowSteps from '$lib/components/WorkflowSteps.svelte';
	import { db, WORKFLOW_STATUS, type IWorkflow, type IWorkflowColumnMapping, type IWorkflowFile, type IWorkflowFileData, type IWorkflowMatch } from '$lib/state/db.svelte.js';

    interface IFiles {
        base: IWorkflowFile | null;
        updated: IWorkflowFile | null;
    }
    
    let workflow = $state<IWorkflow | null>(null);
    let files = $state<IFiles>({
        base: null,
        updated: null,
    });
    let column_mappings = $state<IWorkflowColumnMapping[]>([]);
    let data = $state<{
        base: IWorkflowFileData[];
        updated: IWorkflowFileData[];
    }>({
        base: [],
        updated: [],
    });
    let matches = $state<IWorkflowMatch[]>([]);
    let updated_records = $state<object[]>([]);
    let new_records = $state<object[]>([]);

    let loading = $state(true);

    let error = $state('');

    onMount(async () => {
        await load_workflow();
        await load_workflow_files();
        await load_workflow_column_mappings();
        await load_workflow_data();
        await load_workflow_matches();
        get_updated_records();
        get_new_records();
        loading = false;

        if (workflow && !error) {
            await db.workflows.update(workflow.id, {
                status: WORKFLOW_STATUS.COMPLETED,
            });
        }
    });

    const download_new_records_csv = () => {
        const csv = Papa.unparse(new_records);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        window.open(url);
    }

    const download_updated_records_csv = () => {
        const csv = Papa.unparse(updated_records);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        window.open(url);
    }

    const get_new_records = () => {
        const records: object[] = [];

        const confirmed_matches = matches.filter(m => m.confirmed_at).map(m => m.updated_row_id);
        const updated_records = data.updated.filter(d => !confirmed_matches.includes(d.id));

        for (const record of updated_records) {
            records.push(record.data);
        }

        new_records = records;
    }

    const get_updated_records = () => {
        const records: object[] = [];

        for (const match of matches.filter(m => m.confirmed_at)) {
            const base_record = data.base.find(d => d.id === match.base_row_id);
            const updated_record = data.updated.find(d => d.id === match.updated_row_id);

            if (base_record && updated_record) {
                const record: Record<string, any> = base_record.data;

                for (const mapping of column_mappings) {
                    const updated_value = updated_record.data[mapping.updated_column as keyof typeof updated_record.data];

                    if (updated_value !== undefined) {
                        record[mapping.base_column as keyof typeof record] = updated_value;
                    }
                }

                records.push(record);
            }
        }

        updated_records = records;
    }

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

    const load_workflow_column_mappings = async () => {
        try {
            if (!workflow || error) return;

            column_mappings = await db.workflow_column_mappings.where('workflow_id').equals(workflow.id).toArray();
        } catch (e) {
            error = `Failed to load workflow column mappings: ${e}`;
        }
    }

    const load_workflow_data = async () => {
        try {
            if (!files.base || !files.updated || error) return;
            
            const base_data = await db.workflow_file_data.where('workflow_file_id')
                .equals(files.base?.id)
                .toArray();

            const updated_data = await db.workflow_file_data.where('workflow_file_id')
                .equals(files.updated?.id)
                .toArray();

            if (base_data.length === 0) {
                error = 'No data found for base file';
            } else if (updated_data.length === 0) {
                error = 'No data found for updated file';
            } else {
                data = {
                    base: base_data,
                    updated: updated_data,
                };
            }
        } catch (e) {
            error = `Failed to load workflow data: ${e}`;
        }
    }

    const load_workflow_files = async () => {
        try {
            if (!workflow || error) return;

            const workflow_files = await db.workflow_files.where('workflow_id')
                .equals(workflow.id)
                .toArray();

            if (workflow_files.length > 0) {
                files.base = workflow_files.find(f => f.workflow_file_type === 'base') ?? null;
                files.updated = workflow_files.find(f => f.workflow_file_type === 'updated') ?? null;
            }
        } catch (e) {
            error = `Failed to load workflow files: ${e}`;
        }
    }

    const load_workflow_matches = async () => {
        try {
            if (!workflow || error) return;

            matches = await db.workflow_matches.where('workflow_id')
                .equals(workflow.id)
                .and(m => m.confirmed_at !== null)
                .toArray();
        } catch (e) {
            error = `Failed to load workflow matches: ${e}`;
        }
    }
</script>
<div class="workflow-container">
    {#if workflow}
        <WorkflowSteps {workflow} />

        {#if workflow.status === WORKFLOW_STATUS.CREATED || workflow.status === WORKFLOW_STATUS.FILES_UPLOADED || workflow.status === WORKFLOW_STATUS.COLUMNS_MAPPED}
            <section>
                You must upload the base and updated files, map their columns, and review the mapped columns before processing data.

                <div class="previous-controls-container">
                    <Link href="/workflows/{workflow.id}" theme="primary">
                        Upload Files
                    </Link>

                    <Link href="/workflows/{workflow.id}/map-columns" theme="primary">
                        Map Columns
                    </Link>

                    <Link href="/workflows/{workflow.id}/review-matches" theme="primary">
                        Review Matches
                    </Link>
                </div>
            </section>
        {:else}
            <section>
                <h1>{workflow.name} - Results</h1>

                <p>
                    Congratulations! You've completed your workflow. You can now download your results as CSV files.
                </p>
            </section>

            <section class="results-container">
                <div class="results-tables-container">
                    <div class="results-table-container updated-results-container">
                        <div class="results-table-container-header">
                            <div class="results-table-container-header-description">
                                <h2>Updated Records</h2>

                                <p>
                                    The following records are rows found in your base file that have been updated by data found in
                                    your updated file.
                                </p>

                                <p>
                                    {updated_records.length} updated record{updated_records.length === 1 ? '' : 's'}
                                </p>
                            </div>

                            <div class="results-table-container-header-controls">
                                <Button
                                    nowrap
                                    theme="accent1"
                                    size="small"
                                    onclick={download_updated_records_csv}
                                >
                                    Download CSV
                                </Button>
                            </div>
                        </div>
    
                        <table>
                            <tbody>
                                {#each updated_records as record, index (index)}
                                    {#if index === 0}
                                        <tr>
                                            {#each Object.keys(record) as key}
                                                <th>
                                                    {key}
                                                </th>
                                            {/each}
                                        </tr>
                                    {/if}

                                    <tr class="results-table-record">
                                        {#each Object.values(record) as value}
                                            <td>
                                                {value}
                                            </td>
                                        {/each}
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
    
                    <div class="results-table-container base-results-container">
                        <div class="results-table-container-header">
                            <div class="results-table-container-header-description">
                                <h2>New Records</h2>

                                <p>
                                    The following records are rows found in your updated file that were not able to be matched to
                                    any rows found in your base file. Therefore, these are all new records.
                                </p>

                                <p>
                                    {new_records.length} new record{new_records.length === 1 ? '' : 's'}
                                </p>
                            </div>

                            <div class="results-table-container-header-controls">
                                <Button
                                    nowrap
                                    theme="accent1"
                                    size="small"
                                    onclick={download_new_records_csv}
                                >
                                    Download CSV
                                </Button>
                            </div>
                        </div>

                        <table>
                            <tbody>
                                {#each new_records as record, index (index)}
                                    {#if index === 0}
                                        <tr>
                                            {#each Object.keys(record) as key}
                                                <th>
                                                    {key}
                                                </th>
                                            {/each}
                                        </tr>
                                    {/if}

                                    <tr class="results-table-record">
                                        {#each Object.values(record) as value}
                                            <td>
                                                {value}
                                            </td>
                                        {/each}
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="controls-container">
                    <Link
                        href="/workflows/{workflow.id}/review-matches"
                        theme="primary-text"
                    >
                        Back to Reviewing Matches
                    </Link>

                    <Link
                        href={`/workflows`}
                        theme="primary"
                    >
                        Back to Workflows List
                    </Link>
                </div>
            </section>
        {/if}
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

    .results-container {
        display: flex;
        flex: 1;
        flex-direction: column;
        align-items: stretch;
        justify-content: space-between;
        gap: 1rem;
        height: 100%;
        margin-top: 1rem;
    }

    .results-tables-container {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        justify-content: flex-start;
        gap: 2rem;
        overflow: auto;
    }

    .results-table-container {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        justify-content: flex-start;
        gap: 0.25rem;
        padding: 1rem;
        background-image: linear-gradient(to bottom, var(--primary-300), var(--primary-200));   
        border-top: 1px solid var(--accent1-300);
        border-radius: 0.5rem;
    }

    .results-table-container-header-description p {
        &:last-child {
            margin: 0;
        }
    }

    .results-table-container-header {
        display: flex;
        flex-direction: row;
        align-items: flex-end;
        justify-content: space-between;
        gap: 3rem;
    }

    .results-table-container table {
        width: 100%;
        border: 1px solid var(--primary-300);
        border-collapse: collapse;
        color: var(--primary-100);
        background: var(--primary-600);
    }

    .results-table-container th,
    .results-table-container td {
        padding: 0.15rem 0.5rem;
        border: 1px solid var(--primary-400);
    }

    .results-table-container th {
        text-align: left;
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