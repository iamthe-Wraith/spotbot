<script lang="ts">
	import dayjs from "dayjs";
    import utc from "dayjs/plugin/utc";
	import { page } from "$app/state";
	import Awkward from "$lib/components/Awkward.svelte";
	import Button from "$lib/components/Button.svelte";
	import Link from "$lib/components/Link.svelte";
	import WorkflowSteps from "$lib/components/WorkflowSteps.svelte";
	import { db, WORKFLOW_STATUS, type IWorkflow, type IWorkflowColumnMapping, type IWorkflowFile, type IWorkflowFileData } from "$lib/state/db.svelte";
	import { round } from "$lib/utils/number";
	import { jaroWinklerDistance, levenshteinDistance } from "$lib/utils/string";
	import { onMount } from "svelte";
	import { sort } from "d3";

    dayjs.extend(utc);

    interface IFiles {
        base: IWorkflowFile | null;
        updated: IWorkflowFile | null;
    }
    interface IMapping {
        mapping: IWorkflowColumnMapping;
        base_col: string;
        base_value: string;
        updated_col: string;
        updated_value: string;
        confidence: number;
    }

    interface IMatchedRow {
        updated_row: IWorkflowFileData;
        rejected_at: string | null;
        matched_columns: IMapping[];
    }

    interface IResult {
        base_row: IWorkflowFileData;
        confirmed_row: IWorkflowFileData | null;
        confirmed_at: string | null;
        rejected_at: string | null;
        matched_rows: Record<string, IMatchedRow>
    }

    type IResults = Record<string, IResult>;
    
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

    let results = $state<IResults>({});
    let summary = $derived.by(() => {
        if (!results) {
            return {
                potential_matches: 0,
                confirmed_matches: 0,
                rejected_matches: 0,
                new_records: 0,
            };
        }

        const potential_matches = Object.keys(results).filter(r => !results[r].rejected_at && !results[r].confirmed_at).length;
        const confirmed_matches = Object.values(results).filter(r => r.confirmed_at).length;
        const rejected_matches = Object.values(results).filter(r => r.rejected_at).length;
        const new_records = data.updated.length - confirmed_matches;

        return {
            potential_matches,
            confirmed_matches,
            rejected_matches,
            new_records,
        };
    });

    let loading = $state(true);
    let processing = $state(false);

    let error = $state('');

    onMount(async () => {
        await load_workflow();
        await load_workflow_files();
        await load_workflow_column_mappings();
        await load_workflow_data();
        await load_workflow_matches();
        loading = false;

        if (!Object.keys(results).length) {
            await process_data();
        }
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

            const matches = await db.workflow_matches.where('workflow_id')
                .equals(workflow.id)
                .toArray();

            if (matches.length > 0) {
                const all_results: IResults = {};

                for (const match of matches) {
                    if (all_results[match.base_row_id]) {
                        if (match.confirmed_at) {
                            all_results[match.base_row_id].confirmed_at = match.confirmed_at;
                            all_results[match.base_row_id].rejected_at = null;
                            all_results[match.base_row_id].confirmed_row = data.updated.find(d => d.id === match.updated_row_id)!;
                        }

                        if (match.rejected_at && !all_results[match.base_row_id].confirmed_at) {
                            all_results[match.base_row_id].rejected_at = match.rejected_at;
                        }

                        all_results[match.base_row_id].matched_rows[match.updated_row_id] = {
                            updated_row: data.updated.find(d => d.id === match.updated_row_id)!,
                            rejected_at: match.rejected_at,
                            matched_columns: match.confirmations.map(c => ({
                                mapping: column_mappings.find(m => m.base_column === c.base_column && m.updated_column === c.updated_column)!,
                                base_col: c.base_column,
                                base_value: '',
                                updated_col: c.updated_column,
                                updated_value: '',
                                confidence: c.confidence,
                            })),
                        }
                    } else {
                        const base_row = data.base.find(d => d.id === match.base_row_id)!;
                        const updated_row = data.updated.find(d => d.id === match.updated_row_id)!;

                        all_results[match.base_row_id] = {
                            base_row,
                            confirmed_row: null,
                            rejected_at: match.rejected_at,
                            confirmed_at: match.confirmed_at,
                            matched_rows: {
                                [updated_row.id]: {
                                    updated_row,
                                    rejected_at: match.rejected_at,
                                    matched_columns: match.confirmations.map(c => ({
                                        mapping: column_mappings.find(m => m.base_column === c.base_column && m.updated_column === c.updated_column)!,
                                        base_col: c.base_column,
                                        base_value: '',
                                        updated_col: c.updated_column,
                                        updated_value: '',
                                        confidence: c.confidence,
                                    })),
                                }
                            }
                        }
                    }
                }

                results = all_results;
            }
        } catch (e) {
            error = `Failed to load workflow matches: ${e}`;
        }
    }

    const on_confirm_result = (updated_row_id: string, result: IResult) => async () => {
        try {
            if (result.confirmed_at) {
                return;
            }

            const now = dayjs.utc().toISOString();
            result.confirmed_row = result.matched_rows[updated_row_id].updated_row;
            result.confirmed_at = now;
            result.rejected_at = null;

            await db.workflow_matches.where('base_row_id')
                .equals(result.base_row.id)
                .and(m => m.workflow_id === workflow!.id && m.updated_row_id === updated_row_id)
                .modify(m => {
                    m.confirmed_at = now;
                    m.rejected_at = null;
                    m.updated_at = now;
                });
            
            // reject any other matches for this base row
            await db.workflow_matches.where('base_row_id')
                .equals(result.base_row.id)
                .and(m => m.workflow_id === workflow!.id && m.updated_row_id !== updated_row_id)
                .modify(m => {
                    m.confirmed_at = null;
                    m.rejected_at = now;
                    m.updated_at = now;
                });

            if (!Object.values(results).filter(r => !r.confirmed_at && !r.rejected_at).length) {
                await db.workflows.update(workflow!.id, {
                    status: WORKFLOW_STATUS.MATCHES_REVIEWED,
                });
            }
        } catch (e) {
            error = `Failed to confirm result: ${e}`;
        }
    }

    const on_reject_result = (updated_row_id: string, result: IResult) => async () => {
        try {            
            if (result.confirmed_at) {
                return;
            }

            const now = dayjs.utc().toISOString();
            result.matched_rows[updated_row_id].rejected_at = now;

            await db.workflow_matches.where('base_row_id')
                .equals(result.base_row.id)
                .and(m => m.workflow_id === workflow!.id && m.updated_row_id === updated_row_id)
                .modify(m => {
                    m.rejected_at = now;
                    m.confirmed_at = null;
                    m.updated_at = now;
                });

            const rejected_rows = Object.values(result.matched_rows).filter(r => r.rejected_at);
            if (rejected_rows.length === Object.keys(result.matched_rows).length) {
                result.rejected_at = now;
            }

            if (!Object.values(results).filter(r => !r.confirmed_at && !r.rejected_at).length) {
                await db.workflows.update(workflow!.id, {
                    status: WORKFLOW_STATUS.MATCHES_REVIEWED,
                });
            }
        } catch (e) {
            error = `Failed to reject result: ${e}`;
        }
    }

    const process_data = async () => {
        try {
            if (!workflow || error) return;

            processing = true;

            const commonly_used_short_columns = [
                'name',
            ]

            const all_results: IResults = {};

            for (const base_row of data.base) {
                for (const updated_row of data.updated) {
                    for (const col of files.base?.columns ?? []) {
                        const mapping = column_mappings.find(m => m.base_column === col);
                        
                        if (mapping?.match) {
                            const base_value = base_row.data[mapping.base_column as keyof typeof base_row.data] as string;
                            const updated_value = updated_row.data[mapping.updated_column as keyof typeof updated_row.data] as string;

                            if (!base_value || !updated_value) {
                                continue;
                            }

                            let jaro_winkler_distance: number | null = null;
                            let levenshtein_distance: number | null = null;

                            let is_common_short_column = commonly_used_short_columns.filter(c => mapping.base_column.toLocaleLowerCase().includes(c));
                            if (!is_common_short_column.length) {
                                is_common_short_column = commonly_used_short_columns.filter(c => mapping.updated_column.toLocaleLowerCase().includes(c));
                            }

                            if (
                                is_common_short_column ||
                                base_value.length < 30 ||
                                updated_value.length < 30
                            ) {
                                jaro_winkler_distance = jaroWinklerDistance(base_value, updated_value);
                            } else {
                                levenshtein_distance = levenshteinDistance(base_value, updated_value);
                            }

                            if (
                                (jaro_winkler_distance && jaro_winkler_distance > (workflow.confidence_threshold / 100)) ||
                                (levenshtein_distance && levenshtein_distance > (workflow.confidence_threshold / 100))
                            ) {
                                if (!all_results[base_row.id]) {
                                    all_results[base_row.id] = {
                                        base_row: base_row,
                                        confirmed_row: null,
                                        rejected_at: null,
                                        confirmed_at: null,
                                        matched_rows: {
                                            [updated_row.id]: {
                                                updated_row: updated_row,
                                                rejected_at: null,
                                                matched_columns: [],
                                            }
                                        }
                                    };
                                }

                                if (!all_results[base_row.id].matched_rows[updated_row.id]) {
                                    all_results[base_row.id].matched_rows[updated_row.id] = {
                                        updated_row,
                                        rejected_at: null,
                                        matched_columns: [],
                                    };
                                }

                                all_results[base_row.id].matched_rows[updated_row.id].matched_columns.push({
                                    mapping,
                                    base_col: mapping.base_column,
                                    base_value: base_value,
                                    updated_col: mapping.updated_column,
                                    updated_value: updated_value,
                                    confidence: jaro_winkler_distance ?? levenshtein_distance ?? 0,
                                });
                    
                                const existing_match = await db.workflow_matches.where('workflow_id')
                                    .equals(workflow.id)
                                    .and(m => m.base_row_id === base_row.id && m.updated_row_id === updated_row.id)
                                    .first();

                                // TODO: save the match to the database
                                const now = dayjs.utc().toISOString();
                                
                                if (existing_match) {
                                    await db.workflow_matches.update(existing_match.id, {
                                        workflow_id: workflow.id,
                                        base_file_id: files.base!.id,
                                        updated_file_id: files.updated!.id,
                                        base_row_id: base_row.id,
                                        updated_row_id: updated_row.id,
                                        rejected_at: null,
                                        confirmed_at: null,
                                        confirmations: all_results[base_row.id].matched_rows[updated_row.id].matched_columns.map(c => ({
                                            base_column: c.base_col,
                                            updated_column: c.updated_col,
                                            confidence: c.confidence,
                                        })),
                                        updated_at: now,
                                    });
                                } else {
                                    await db.workflow_matches.add({
                                        workflow_id: workflow.id,
                                        base_file_id: files.base!.id,
                                        updated_file_id: files.updated!.id,
                                        base_row_id: base_row.id,
                                        updated_row_id: updated_row.id,
                                        rejected_at: null,
                                        confirmed_at: null,
                                        confirmations: all_results[base_row.id].matched_rows[updated_row.id].matched_columns.map(c => ({
                                            base_column: c.base_col,
                                            updated_column: c.updated_col,
                                            confidence: c.confidence,
                                        })),
                                        created_at: now,
                                        updated_at: now,
                                    });
                                }
                            }
                        }
                    }
                }
            }

            results = all_results;
        } catch (e) {
            error = `Failed to process data: ${e}`;
        } finally {
            processing = false;
        }
    }
</script>

<div class="workflow-container">
    {#if workflow}
        <WorkflowSteps {workflow} />

        {#if workflow.status === WORKFLOW_STATUS.CREATED || workflow.status === WORKFLOW_STATUS.FILES_UPLOADED}
            <section>
                You must upload the base and updated files and map their columns before processing data.

                <div class="previous-controls-container">
                    <Link href="/workflows/{workflow.id}" theme="primary">
                        Upload Files
                    </Link>

                    <Link href="/workflows/{workflow.id}/map-columns" theme="primary">
                        Map Columns
                    </Link>
                </div>
            </section>
        {:else}
            <section>
                <h1>{workflow.name} - Review Mapped Columns</h1>

                <p>
                    Here, you'll need to review any rows that were matched between the base and updated files based on your configured
                    threshold and column mappings. Confirmed matches will be updated in the base file. Rejected matches will be ignored.
                </p>

                <p>
                    <b>Note:</b> If you are not sure about the match, you can always change it later.
                </p>
            </section>

            <section>
                <h2>Summary</h2>

                <div class="summary-container">
                    <div class="summary-item">
                        <div class="summary-item-label">
                            Potential Matches
                        </div>

                        <div class="summary-item-value">
                            {summary.potential_matches}
                        </div>
                    </div>

                    <div class="summary-item">
                        <div class="summary-item-label"> 
                            Confirmed Matches
                        </div>

                        <div class="summary-item-value">
                            {summary.confirmed_matches}
                        </div>
                    </div>

                    <div class="summary-item">
                        <div class="summary-item-label"> 
                            Rejected Matches
                        </div>

                        <div class="summary-item-value">
                            {summary.rejected_matches}
                        </div>
                    </div>

                    <div class="summary-item">
                        <div class="summary-item-label">
                            New Records
                        </div>

                        <div class="summary-item-value">
                            {summary.new_records}
                        </div>
                    </div>
                </div>
            </section>

            <section class="process-data-container">
                <div class="results-container">
                    {#if Object.keys(results).length}
                        {#each Object.values(results).sort((a, b) => a.base_row.row - b.base_row.row) as result (result.base_row.id)}
                            <article
                                class="result-container"
                                class:confirmed={result.confirmed_at}
                                class:rejected={result.rejected_at}
                            >
                                <div>
                                    {#if result.confirmed_at}
                                        <p>Match confirmed. This base record will be updated with the confirmed data.</p>
                                    {:else if result.rejected_at}
                                        {#if Object.keys(result.matched_rows).length > 1}
                                            <p>All potential matches rejected. No changes will be made to the base record.</p>
                                        {:else}
                                            <p>Potential match rejected. No changes will be made to the base record.</p>
                                        {/if}
                                    {:else if Object.keys(result.matched_rows).length > 1}
                                        <p>{`This record has ${Object.keys(result.matched_rows).length} potential matches. Please review the data and select the correct match.`}</p>
                                    {:else}
                                        <p>{`Potential match found. Please review the data and confirm or reject the match.`}</p>
                                    {/if}

                                    <div class="result-row-data-container">
                                        <div
                                            class="result-row"
                                            class:result-row-base={!result.confirmed_at}
                                        >
                                            <div class="result-row-column">
                                                <span>Base</span>
                                            </div>

                                            {#each Object.entries(result.base_row.data) as [row_key, row_value] (row_key)}
                                                <div class="result-row-column">
                                                    <div class="result-row-column-key">
                                                        {row_key}
                                                    </div>
                                                    
                                                    <div class="result-row-column-value">
                                                        {row_value || '--'}
                                                    </div>
                                                </div>
                                            {/each}
                                        </div>
                                    </div>
                                </div>

                                {#each Object.entries(result.matched_rows) as [updated_row_id, updated_row] (updated_row_id)}
                                    {#if !result.confirmed_row || (result.confirmed_row && updated_row_id === result.confirmed_row.id)}
                                        <div class="result-row-container">
                                            {#if !updated_row.rejected_at && !result.rejected_at && !result.confirmed_at}
                                                <div class="result-confidence-container">
                                                    <div class="result-controls">
                                                        <Button
                                                               onclick={on_confirm_result(updated_row_id, result)}
                                                        >
                                                            Confirm
                                                        </Button>
            
                                                        <Button
                                                            onclick={on_reject_result(updated_row_id, result)}
                                                            theme="light-text"
                                                        >
                                                            Reject
                                                        </Button>
                                                    </div>
            
                                                    <div class="result-confidence-values-container">
                                                        {#each updated_row.matched_columns as matched_column (matched_column.mapping.id)}
                                                            <div class="result-confidence-value-container">
                                                                <div class="result-confidence-value">
                                                                    <div class="result-confidence-value-column">
                                                                        <div>(base)</div>
                                                                        <div>(updated)</div>
                                                                    </div>
            
                                                                    <div class="result-confidence-value-column">
                                                                        <div>{matched_column.base_col}</div>
                                                                        <div>{matched_column.updated_col}</div>
                                                                    </div>
            
                                                                    <div class="result-confidence-value-column">
                                                                        <div>
                                                                            <div>{matched_column.base_value}</div>
                                                                        </div>
                                                                        <div>
                                                                            <div>{matched_column.updated_value}</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
            
                                                                <div class="result-confidence">
                                                                    {round(matched_column.confidence * 100, 2)}%
                                                                </div>
                                                            </div>
                                                        {/each}
                                                    </div>
                                                </div>
                                            {:else if updated_row.rejected_at}
                                                <div class="rejected-label">
                                                    Rejected
                                                </div>
                                            {:else if result.confirmed_row && updated_row_id === result.confirmed_row.id}
                                                <div class="confirmed-label">
                                                    Confirmed
                                                </div>
                                            {/if}
        
                                            <div class="result-row-data-container"
                                                class:rejected={updated_row.rejected_at || (result.confirmed_row && updated_row_id !== result.confirmed_row.id)}
                                            >
                                                <div class="result-row">
                                                    <div class="result-row-column">
                                                        <span>Updated</span>
                                                    </div>
                                                
                                                    {#each Object.entries(updated_row.updated_row.data) as [row_key, row_value] (row_key)}
                                                        <div class="result-row-column">
                                                            <div class="result-row-column-key">
                                                                {row_key}
                                                            </div>
                                                            
                                                            <div class="result-row-column-value">
                                                                {row_value || '--'}
                                                            </div>
                                                        </div>
                                                    {/each}
                                                </div>
                                            </div>
                                        </div>
                                    {/if}
                                {/each}
                            </article>
                        {/each}
                    {:else}
                        <div class="no-matches-found">
                            <div>
                                No rows were matched between the base and updated files.
                            </div>
                        </div>
                    {/if}
                </div>

                <div class="controls-container">
                    <Link
                        href="/workflows/{workflow.id}/map-columns"
                        theme="primary-text"
                    >
                        Back to Column Mapping
                    </Link>

                    <span class:disabled={Object.values(results).filter(r => !r.confirmed_at && !r.rejected_at).length}>
                        <Link
                            href={`/workflows/${workflow.id}/results`}
                            theme="primary"
                        >
                            View Results
                        </Link>
                    </span>
                </div>
            </section>

            
        {/if}
    {:else}
        {#if loading}
            <div class="alt-container">
                <p>Loading workflow...</p>
            </div>
        {:else if processing}
            <div class="alt-container">
                <p>Processing data...</p>
            </div>
        {:else if error}
            <div class="alt-container">
                <Awkward message={error} />
            </div>
        {:else}
            <div class="alt-container">
                <Awkward message="Something didn't go as planned." />
            </div>
        {/if}
    {/if}
</div>

<style>
    .summary-container {
        display: flex;
        flex-direction: row;
        align-items: stretch;
        justify-content: flex-start;
        gap: 1rem;
    }

    .summary-item {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        border: 1px solid var(--primary-400);
        border-radius: 0.25rem;
        overflow: hidden;
    }

    .summary-item-label {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.15rem 0.5rem;
        font-size: 0.6rem;
        background: var(--primary-400);
    }

    .summary-item-value {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.15rem 0.5rem;
        font-size: 1.75rem;
    }

    .workflow-container {
        display: flex;
        flex: 1;
        flex-direction: column;
        align-items: stretch;
        justify-content: space-between;
        gap: 1rem;
        height: 100%;
    }

    .process-data-container {
        display: flex;
        flex: 1;
        flex-direction: column;
        align-items: stretch;
        justify-content: space-between;
        gap: 1rem;
        height: 100%;
        margin-top: 1rem;
    }

    .results-container {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        justify-content: flex-start;
        gap: 1.5rem;
    }

    .result-container {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        justify-content: flex-start;
        gap: 1rem;
        background-image: linear-gradient(to bottom, var(--primary-300), var(--primary-200));
        border-top: 1px solid var(--accent1-300);
        border-radius: 0.5rem;
        padding: 1rem;
        overflow: auto;

        &.confirmed {
            background-image: linear-gradient(to bottom, var(--success-300), var(--success-100));
        }

        &.rejected {
            opacity: 0.4;
        }
    }

    .result-confidence-container {
        display: grid;
        grid-template-columns: 1fr 2fr;
    }

    .result-controls {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        gap: 1rem;
    }

    .result-row-container {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        justify-content: flex-start;
        gap: 0.25rem;
    }

    .result-confidence-values-container {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: flex-start;
        justify-content: flex-end;
        gap: 0.5rem;
    }

    .result-confidence-value-container {
        display: flex;
        flex-direction: row;
        flex-shrink: 0;
        align-items: stretch;
        justify-content: flex-start;
        border: 1px solid var(--primary-400);
        border-radius: 0.25rem;
        overflow: hidden;
    }

    .result-confidence-value {
        display: flex;
        flex-direction: row;
        align-items: stretch;
        justify-content: flex-start;
    }

    .result-confidence-value-column {
        display: flex;
        flex-wrap: nowrap;
        flex-direction: column;
        align-items: stretch;

        &:first-child div {
            font-size: 0.6rem;
            color: var(--accent1-500);
        }

        &:last-child div {
            font-size: 0.8rem;
            max-width: 10rem;

            & div {
                width: 100%;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        }
    }

    .result-confidence-value-column div {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        flex: 1;
        padding: 0 0.25rem;
        white-space: nowrap;
    }

    .result-confidence {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem;
        background: var(--primary-400);
    }

    .result-row-data-container {
        display: flex;
        flex-direction: column;

        &.rejected {
            opacity: 0.5;
        }
    }

    .confirmed-label {
        font-size: 0.75rem;
        color: var(--success-700);
    }

    .rejected-label {
        font-size: 0.75rem;
        color: var(--danger-700);
    }

    .result-row {
        display: flex;
        flex-direction: row;
        flex-wrap: no-wrap;
        align-items: center;
        justify-content: flex-start;
        background: var(--primary-600);
        border: 1px solid var(--primary-400);
        border-radius: 0.25rem;
    }

    .result-row-base {
        margin-bottom: 1rem;
    }

    .result-row-column:first-child {
        align-self: stretch;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1rem;
        background: var(--primary-400);
        border-right: none;

        span {
            display: flex;
            font-size: 0.6rem;
            color: var(--primary-900);
            rotate: -90deg;
        }
    }

    .result-row-column:last-child {
        flex: 1;
    }

    .result-row-column:not(:last-child) {
        border-right: 1px solid var(--primary-400);
    }

    .result-row-column-key,
    .result-row-column-value {
        padding: 0.15rem 0.5rem;
        color: var(--primary-100);
    }

    .result-row-column-key {
        font-weight: 600;
        border-bottom: 1px solid var(--primary-400);
    }

    .no-matches-found {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 10rem;
        padding: 1rem;

        div {
            padding: 2rem;
            border: 1px solid var(--accent1-400);
            border-radius: 0.5rem;
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

    .alt-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        height: 20rem;
    }
</style>