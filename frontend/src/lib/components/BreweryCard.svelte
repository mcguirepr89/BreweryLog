<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';
	import type { Brewery, Collection, User } from '$lib/types';
	const dispatch = createEventDispatcher();

	import Launch from '~icons/mdi/launch';
	import FileDocumentEdit from '~icons/mdi/file-document-edit';
	import TrashCan from '~icons/mdi/trash-can-outline';
	import Calendar from '~icons/mdi/calendar';
	import MapMarker from '~icons/mdi/map-marker';
	import { addToast } from '$lib/toasts';
	import Link from '~icons/mdi/link-variant';
	import LinkVariantRemove from '~icons/mdi/link-variant-remove';
	import Plus from '~icons/mdi/plus';
	import CollectionLink from './CollectionLink.svelte';
	import DotsHorizontal from '~icons/mdi/dots-horizontal';
	import DeleteWarning from './DeleteWarning.svelte';
	import CardCarousel from './CardCarousel.svelte';
	import { t } from 'svelte-i18n';

	export let type: string | null = null;
	export let user: User | null;
	export let collection: Collection | null = null;
	export let readOnly: boolean = false;

	let isCollectionModalOpen: boolean = false;
	let isWarningModalOpen: boolean = false;

	export let brewery: Brewery;
	let activityTypes: string[] = [];
	// makes it reactivty to changes so it updates automatically
	$: {
		if (brewery.activity_types) {
			activityTypes = brewery.activity_types;
			if (activityTypes.length > 3) {
				activityTypes = activityTypes.slice(0, 3);
				let remaining = brewery.activity_types.length - 3;
				activityTypes.push('+' + remaining);
			}
		}
	}

	let unlinked: boolean = false;

	// Reactive block to update `unlinked` when dependencies change
	$: {
		if (collection && collection?.start_date && collection.end_date) {
			unlinked = brewery.visits.every((visit) => {
				// Check if visit dates exist
				if (!visit.start_date || !visit.end_date) return true; // Consider "unlinked" for incomplete visit data

				// Check if collection dates are completely outside this visit's range
				const isBeforeVisit = collection.end_date && collection.end_date < visit.start_date;
				const isAfterVisit = collection.start_date && collection.start_date > visit.end_date;

				return isBeforeVisit || isAfterVisit;
			});
		}
	}

	async function deleteBrewery() {
		let res = await fetch(`/api/breweries/${brewery.id}`, {
			method: 'DELETE'
		});
		if (res.ok) {
			addToast('info', $t('breweries.brewery_delete_success'));
			dispatch('delete', brewery.id);
		} else {
			console.log('Error deleting brewery');
		}
	}

	async function removeFromCollection() {
		let res = await fetch(`/api/breweries/${brewery.id}`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ collection: null })
		});
		if (res.ok) {
			addToast('info', `${$t('breweries.collection_remove_success')}`);
			dispatch('delete', brewery.id);
		} else {
			addToast('error', `${$t('breweries.collection_remove_error')}`);
		}
	}

	async function linkCollection(event: CustomEvent<number>) {
		let collectionId = event.detail;
		let res = await fetch(`/api/breweries/${brewery.id}`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ collection: collectionId })
		});
		if (res.ok) {
			console.log('Brewery linked to collection');
			addToast('info', `${$t('breweries.collection_link_success')}`);
			isCollectionModalOpen = false;
			dispatch('delete', brewery.id);
		} else {
			addToast('error', `${$t('breweries.collection_link_error')}`);
		}
	}

	function editBrewery() {
		dispatch('edit', brewery);
	}

	function link() {
		dispatch('link', brewery);
	}
</script>

{#if isCollectionModalOpen}
	<CollectionLink on:link={linkCollection} on:close={() => (isCollectionModalOpen = false)} />
{/if}

{#if isWarningModalOpen}
	<DeleteWarning
		title={$t('breweries.delete_brewery')}
		button_text="Delete"
		description={$t('breweries.brewery_delete_confirm')}
		is_warning={false}
		on:close={() => (isWarningModalOpen = false)}
		on:confirm={deleteBrewery}
	/>
{/if}

<div
	class="card w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-md xl:max-w-md bg-neutral text-neutral-content shadow-xl"
>
	<CardCarousel breweries={[brewery]} />

	<div class="card-body">
		<div class="flex justify-between">
			<button
				on:click={() => goto(`/breweries/${brewery.id}`)}
				class="text-2xl font-semibold -mt-2 break-words text-wrap hover:underline text-left"
			>
				{brewery.name}
			</button>
		</div>
		<div>
			<div class="badge badge-primary">
				{brewery.category?.display_name + ' ' + brewery.category?.icon}
			</div>
			<div class="badge badge-success">
				{brewery.is_visited ? $t('breweries.visited') : $t('breweries.planned')}
			</div>
			<div class="badge badge-secondary">
				{brewery.is_public ? $t('breweries.public') : $t('breweries.private')}
			</div>
		</div>
		{#if unlinked}
			<div class="badge badge-error">{$t('breweries.out_of_range')}</div>
		{/if}
		{#if brewery.location && brewery.location !== ''}
			<div class="inline-flex items-center">
				<MapMarker class="w-5 h-5 mr-1" />
				<p class="ml-.5">{brewery.location}</p>
			</div>
		{/if}
		{#if brewery.visits.length > 0}
			<!-- visited badge -->
			<div class="flex items-center">
				<Calendar class="w-5 h-5 mr-1" />
				<p class="ml-.5">
					{brewery.visits.length}
					{brewery.visits.length > 1 ? $t('breweries.visits') : $t('breweries.visit')}
				</p>
			</div>
		{/if}
		{#if brewery.activity_types && brewery.activity_types.length > 0}
			<ul class="flex flex-wrap">
				{#each activityTypes as activity}
					<div class="badge badge-primary mr-1 text-md font-semibold pb-2 pt-1 mb-1">
						{activity}
					</div>
				{/each}
			</ul>
		{/if}
		{#if !readOnly}
			<div class="card-actions justify-end mt-2">
				<!-- action options dropdown -->

				{#if type != 'link'}
					{#if brewery.user_id == user?.uuid || (collection && user && collection.shared_with?.includes(user.uuid))}
						<div class="dropdown dropdown-end">
							<div tabindex="0" role="button" class="btn btn-neutral-200">
								<DotsHorizontal class="w-6 h-6" />
							</div>
							<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
							<ul
								tabindex="0"
								class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
							>
								<button
									class="btn btn-neutral mb-2"
									on:click={() => goto(`/breweries/${brewery.id}`)}
									><Launch class="w-6 h-6" />{$t('breweries.open_details')}</button
								>
								<button class="btn btn-neutral mb-2" on:click={editBrewery}>
									<FileDocumentEdit class="w-6 h-6" />
									{$t('breweries.edit_brewery')}
								</button>

								<!-- remove from collection -->
								{#if brewery.collection && user?.uuid == brewery.user_id}
									<button class="btn btn-neutral mb-2" on:click={removeFromCollection}
										><LinkVariantRemove class="w-6 h-6" />{$t(
											'breweries.remove_from_collection'
										)}</button
									>
								{/if}
								{#if !brewery.collection}
									<button
										class="btn btn-neutral mb-2"
										on:click={() => (isCollectionModalOpen = true)}
										><Plus class="w-6 h-6" />{$t('breweries.add_to_collection')}</button
									>
								{/if}
								<button
									id="delete_brewery"
									data-umami-event="Delete Brewery"
									class="btn btn-warning"
									on:click={() => (isWarningModalOpen = true)}
									><TrashCan class="w-6 h-6" />{$t('breweries.delete')}</button
								>
							</ul>
						</div>
					{:else}
						<button
							class="btn btn-neutral-200 mb-2"
							on:click={() => goto(`/breweries/${brewery.id}`)}
							><Launch class="w-6 h-6" /></button
						>
					{/if}
				{/if}
				{#if type == 'link'}
					<button class="btn btn-primary" on:click={link}><Link class="w-6 h-6" /></button>
				{/if}
			</div>
		{/if}
	</div>
</div>
