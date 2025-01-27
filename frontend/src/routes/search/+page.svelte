<script lang="ts">
	import BreweryCard from '$lib/components/BreweryCard.svelte';
	import NotFound from '$lib/components/NotFound.svelte';
	import type { Brewery, OpenStreetMapPlace } from '$lib/types';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import BreweryModal from '$lib/components/BreweryModal.svelte';
	import { t } from 'svelte-i18n';

	export let data: PageData;

	function deleteBrewery(event: CustomEvent<string>) {
		myBreweries = myBreweries.filter((brewery) => brewery.id !== event.detail);
	}

	let osmResults: OpenStreetMapPlace[] = [];
	let myBreweries: Brewery[] = [];
	let publicBreweries: Brewery[] = [];

	let query: string | null = '';
	let property: string = 'all';

	// on chage of property, console log the property

	function filterByProperty() {
		let url = new URL(window.location.href);
		url.searchParams.set('property', property);
		goto(url.toString(), { invalidateAll: true });
	}

	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search);
		query = urlParams.get('query');
	});

	console.log(data);
	$: {
		if (data.props) {
			myBreweries = data.props.breweries;
			publicBreweries = data.props.breweries;

			if (data.user?.uuid != null) {
				myBreweries = myBreweries.filter((brewery) => brewery.user_id === data.user?.uuid);
			} else {
				myBreweries = [];
			}

			publicBreweries = publicBreweries.filter(
				(brewery) => brewery.user_id !== data.user?.uuid
			);

			if (data.props.osmData) {
				osmResults = data.props.osmData;
			}
		}
	}

	let breweryToEdit: Brewery;
	let isBreweryModalOpen: boolean = false;

	function editBrewery(event: CustomEvent<Brewery>) {
		breweryToEdit = event.detail;
		isBreweryModalOpen = true;
	}

	function saveEdit(event: CustomEvent<Brewery>) {
		console.log(event.detail);
		myBreweries = myBreweries.map((brewery) => {
			if (brewery.id === event.detail.id) {
				return event.detail;
			}
			return brewery;
		});
		isBreweryModalOpen = false;
		console.log(myBreweries);
	}
</script>

{#if isBreweryModalOpen}
	<BreweryModal
		{breweryToEdit}
		on:close={() => (isBreweryModalOpen = false)}
		on:save={filterByProperty}
	/>
{/if}

{#if myBreweries.length === 0 && osmResults.length === 0}
	<NotFound error={data.error} />
{/if}

{#if myBreweries.length !== 0}
	<h2 class="text-center font-bold text-2xl mb-4">{$t('search.brewerylog_results')}</h2>
	<div class="flex items-center justify-center mt-2 mb-2">
		<div class="join">
			<input
				class="join-item btn"
				type="radio"
				name="filter"
				aria-label={$t('breweries.all')}
				id="all"
				checked
				on:change={() => (property = 'all')}
			/>
			<input
				class="join-item btn"
				type="radio"
				name="filter"
				aria-label={$t('breweries.name')}
				id="name"
				on:change={() => (property = 'name')}
			/>
			<input
				class="join-item btn"
				type="radio"
				name="filter"
				aria-label={$t('breweries.location')}
				id="location"
				on:change={() => (property = 'location')}
			/>
			<input
				class="join-item btn"
				type="radio"
				name="filter"
				aria-label={$t('breweries.description')}
				id="description"
				on:change={() => (property = 'description')}
			/>
			<input
				class="join-item btn"
				type="radio"
				name="filter"
				aria-label={$t('breweries.tags')}
				id="activity_types"
				on:change={() => (property = 'activity_types')}
			/>
		</div>
		<button class="btn btn-primary ml-2" type="button" on:click={filterByProperty}
			>{$t('breweries.filter')}</button
		>
	</div>
{/if}

{#if myBreweries.length > 0}
	<h2 class="text-center font-bold text-2xl mb-4">{$t('breweries.my_breweries')}</h2>
	<div class="flex flex-wrap gap-4 mr-4 justify-center content-center">
		{#each myBreweries as brewery}
			<BreweryCard
				user={data.user}
				{brewery}
				on:delete={deleteBrewery}
				on:edit={editBrewery}
			/>
		{/each}
	</div>
{/if}

{#if publicBreweries.length > 0}
	<h2 class="text-center font-bold text-2xl mb-4">{$t('search.public_breweries')}</h2>
	<div class="flex flex-wrap gap-4 mr-4 justify-center content-center">
		{#each publicBreweries as brewery}
			<BreweryCard user={null} {brewery} on:delete={deleteBrewery} on:edit={editBrewery} />
		{/each}
	</div>
{/if}
{#if myBreweries.length > 0 && osmResults.length > 0 && publicBreweries.length > 0}
	<div class="divider"></div>
{/if}
{#if osmResults.length > 0}
	<h2 class="text-center font-bold mt-2 text-2xl mb-4">{$t('search.online_results')}</h2>
	<div class="flex flex-wrap gap-4 mr-4 justify-center content-center">
		{#each osmResults as result}
			<div class="bg-base-300 rounded-lg shadow-md p-4 w-96 mb-2">
				<h2 class="text-xl font-bold">{result.display_name}</h2>
				<p>{result.type}</p>
				<p>{result.lat}, {result.lon}</p>
			</div>
		{/each}
	</div>
{/if}

<svelte:head>
	<title>Search{query ? `: ${query}` : ''}</title>
	<meta name="description" content="Search your breweries." />
</svelte:head>
