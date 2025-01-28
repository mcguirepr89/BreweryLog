<script lang="ts">
	import { enhance, deserialize } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import BreweryCard from '$lib/components/BreweryCard.svelte';
	import BreweryModal from '$lib/components/BreweryModal.svelte';
	import CategoryFilterDropdown from '$lib/components/CategoryFilterDropdown.svelte';
	import CategoryModal from '$lib/components/CategoryModal.svelte';
	import NotFound from '$lib/components/NotFound.svelte';
	import type { Brewery, Category } from '$lib/types';
	import { t } from 'svelte-i18n';

	import Plus from '~icons/mdi/plus';

	export let data: any;
	console.log(data);

	let breweries: Brewery[] = data.props.breweries || [];

	let currentSort = {
		order_by: '',
		order: '',
		visited: true,
		planned: true,
		includeCollections: true,
		is_visited: 'all'
	};

	let resultsPerPage: number = 25;

	let count = data.props.count || 0;

	let totalPages = Math.ceil(count / resultsPerPage);
	let currentPage: number = 1;

	let is_category_modal_open: boolean = false;

	let typeString: string = '';

	$: {
		if (typeof window !== 'undefined') {
			let url = new URL(window.location.href);
			if (typeString) {
				url.searchParams.set('types', typeString);
			} else {
				url.searchParams.delete('types');
			}
			goto(url.toString(), { invalidateAll: true, replaceState: true });
		}
	}

	// sets typeString if present in the URL
	$: {
		// check to make sure its running on the client side
		if (typeof window !== 'undefined') {
			let url = new URL(window.location.href);
			let types = url.searchParams.get('types');
			if (types) {
				typeString = types;
			}
		}
	}

	function handleChangePage(pageNumber: number) {
		// let query = new URLSearchParams($page.url.searchParams.toString());

		// query.set('page', pageNumber.toString());

		// console.log(query.toString());
		currentPage = pageNumber;

		let url = new URL(window.location.href);
		url.searchParams.set('page', pageNumber.toString());
		breweries = [];
		breweries = data.props.breweries;

		goto(url.toString(), { invalidateAll: true, replaceState: true });

		// goto(`?${query.toString()}`, { invalidateAll: true });
	}

	$: {
		let url = new URL($page.url);
		let page = url.searchParams.get('page');
		if (page) {
			currentPage = parseInt(page);
		}
	}

	$: {
		if (data.props.breweries) {
			breweries = data.props.breweries;
		}
		if (data.props.count) {
			count = data.props.count;
			totalPages = Math.ceil(count / resultsPerPage);
		}
	}

	$: {
		let url = new URL($page.url);
		currentSort.order_by = url.searchParams.get('order_by') || 'updated_at';
		currentSort.order = url.searchParams.get('order_direction') || 'asc';

		if (url.searchParams.get('planned') === 'on') {
			currentSort.planned = true;
		} else {
			currentSort.planned = false;
		}
		if (url.searchParams.get('visited') === 'on') {
			currentSort.visited = true;
		} else {
			currentSort.visited = false;
		}
		if (url.searchParams.get('include_collections') === 'on') {
			currentSort.includeCollections = true;
		} else {
			currentSort.includeCollections = false;
		}

		if (!currentSort.visited && !currentSort.planned) {
			currentSort.visited = true;
			currentSort.planned = true;
		}

		if (url.searchParams.get('is_visited')) {
			currentSort.is_visited = url.searchParams.get('is_visited') || 'all';
		}
	}

	let breweryToEdit: Brewery | null = null;
	let isBreweryModalOpen: boolean = false;

	function deleteBrewery(event: CustomEvent<string>) {
		breweries = breweries.filter((brewery) => brewery.id !== event.detail);
	}

	// function that save changes to an existing brewery or creates a new one if it doesn't exist
	function saveOrCreate(event: CustomEvent<Brewery>) {
		if (breweries.find((brewery) => brewery.id === event.detail.id)) {
			breweries = breweries.map((brewery) => {
				if (brewery.id === event.detail.id) {
					return event.detail;
				}
				return brewery;
			});
		} else {
			breweries = [event.detail, ...breweries];
		}
		isBreweryModalOpen = false;
	}

	function editBrewery(event: CustomEvent<Brewery>) {
		breweryToEdit = event.detail;
		isBreweryModalOpen = true;
	}

	let sidebarOpen = false;

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}
</script>

{#if isBreweryModalOpen}
	<BreweryModal
		{breweryToEdit}
		on:close={() => (isBreweryModalOpen = false)}
		on:save={saveOrCreate}
	/>
{/if}

{#if is_category_modal_open}
	<CategoryModal on:close={() => (is_category_modal_open = false)} />
{/if}

<div class="fixed bottom-4 right-4 z-[999]">
	<div class="flex flex-row items-center justify-center gap-4">
		<div class="dropdown dropdown-top dropdown-end">
			<div tabindex="0" role="button" class="btn m-1 size-16 btn-primary">
				<Plus class="w-8 h-8" />
			</div>
			<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
			<ul
				tabindex="0"
				class="dropdown-content z-[1] menu p-4 shadow bg-base-300 text-base-content rounded-box w-52 gap-4"
			>
				<p class="text-center font-bold text-lg">{$t('breweries.create_new')}</p>
				<button
					class="btn btn-primary"
					on:click={() => {
						isBreweryModalOpen = true;
						breweryToEdit = null;
					}}
				>
					{$t('breweries.brewery')}</button
				>

				<!-- <button
			class="btn btn-primary"
			on:click={() => (isShowingNewTrip = true)}>Trip Planner</button
		  > -->
			</ul>
		</div>
	</div>
</div>

<div class="drawer lg:drawer-open">
	<input id="my-drawer" type="checkbox" class="drawer-toggle" bind:checked={sidebarOpen} />
	<div class="drawer-content">
		<!-- Page content -->
		<h1 class="text-center font-bold text-4xl mb-6">{$t('navbar.my_breweries')}</h1>
		<p class="text-center">{count} {$t('breweries.count_txt')}</p>
		{#if breweries.length === 0}
			<NotFound error={undefined} />
		{/if}
		<div class="p-4">
			<button
				class="btn btn-primary drawer-button lg:hidden mb-4 fixed bottom-0 left-0 ml-2 z-[999]"
				on:click={toggleSidebar}
			>
				{sidebarOpen ? $t(`breweries.close_filters`) : $t(`breweries.open_filters`)}
			</button>

			<div class="flex flex-wrap gap-4 mr-4 justify-center content-center">
				{#each breweries as brewery}
					<BreweryCard
						user={data.user}
						{brewery}
						on:delete={deleteBrewery}
						on:edit={editBrewery}
					/>
				{/each}
			</div>

			<div class="join flex items-center justify-center mt-4">
				{#if totalPages > 1}
					<div class="join">
						{#each Array.from({ length: totalPages }, (_, i) => i + 1) as page}
							{#if currentPage != page}
								<button class="join-item btn btn-lg" on:click={() => handleChangePage(page)}
									>{page}</button
								>
							{:else}
								<button class="join-item btn btn-lg btn-active">{page}</button>
							{/if}
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
	<div class="drawer-side">
		<label for="my-drawer" class="drawer-overlay"></label>

		<ul class="menu p-4 w-80 h-full bg-base-200 text-base-content rounded-lg">
			<!-- Sidebar content here -->
			<div class="form-control">
				<!-- <h3 class="text-center font-bold text-lg mb-4">Brewery Types</h3> -->
				<form method="get">
					<CategoryFilterDropdown bind:types={typeString} />
					<button
						on:click={() => (is_category_modal_open = true)}
						class="btn btn-neutral btn-sm min-w-full">Manage Categories</button
					>
					<div class="divider"></div>
					<h3 class="text-center font-bold text-lg mb-4">{$t('breweries.sort')}</h3>
					<p class="text-lg font-semibold mb-2">{$t('breweries.order_direction')}</p>
					<div class="join">
						<input
							class="join-item btn btn-neutral"
							type="radio"
							name="order_direction"
							id="asc"
							value="asc"
							aria-label={$t('breweries.ascending')}
							checked={currentSort.order === 'asc'}
						/>
						<input
							class="join-item btn btn-neutral"
							type="radio"
							name="order_direction"
							id="desc"
							value="desc"
							aria-label={$t('breweries.descending')}
							checked={currentSort.order === 'desc'}
						/>
					</div>
					<br />
					<p class="text-lg font-semibold mt-2 mb-2">{$t('breweries.order_by')}</p>
					<div class="flex flex-wrap gap-2">
						<input
							class="btn btn-neutral text-wrap"
							type="radio"
							name="order_by"
							id="updated_at"
							value="updated_at"
							aria-label={$t('breweries.updated')}
							checked={currentSort.order_by === 'updated_at'}
						/>
						<input
							class="btn btn-neutral text-wrap"
							type="radio"
							name="order_by"
							id="name"
							aria-label={$t('breweries.name')}
							value="name"
							checked={currentSort.order_by === 'name'}
						/>
						<input
							class="btn btn-neutral text-wrap"
							type="radio"
							value="date"
							name="order_by"
							id="date"
							aria-label={$t('breweries.date')}
							checked={currentSort.order_by === 'date'}
						/>
						<input
							class="btn btn-neutral text-wrap"
							type="radio"
							name="order_by"
							id="rating"
							aria-label={$t('breweries.rating')}
							value="rating"
							checked={currentSort.order_by === 'rating'}
						/>
					</div>

					<!-- is visited true false or all -->
					<p class="text-lg font-semibold mt-2 mb-2">{$t('breweries.visited')}</p>
					<div class="join">
						<input
							class="join-item btn btn-neutral"
							type="radio"
							name="is_visited"
							id="all"
							value="all"
							aria-label={$t('breweries.all')}
							checked={currentSort.is_visited === 'all'}
						/>
						<input
							class="join-item btn btn-neutral"
							type="radio"
							name="is_visited"
							id="true"
							value="true"
							aria-label={$t('breweries.visited')}
							checked={currentSort.is_visited === 'true'}
						/>
						<input
							class="join-item btn btn-neutral"
							type="radio"
							name="is_visited"
							id="false"
							value="false"
							aria-label={$t('breweries.not_visited')}
							checked={currentSort.is_visited === 'false'}
						/>
					</div>
					<div class="divider"></div>
					<div class="form-control">
						<p class="text-lg font-semibold mb-2">{$t('breweries.sources')}</p>
						<label class="label cursor-pointer">
							<span class="label-text">{$t('breweries.collection_breweries')}</span>
							<input
								type="checkbox"
								name="include_collections"
								id="include_collections"
								class="checkbox checkbox-primary"
								checked={currentSort.includeCollections}
							/>
						</label>
						<button type="submit" class="btn btn-success mt-4">{$t('breweries.filter')}</button>
					</div>
				</form>
			</div>
		</ul>
	</div>
</div>

<svelte:head>
	<title>{$t('navbar.breweries')}</title>
	<meta name="description" content="View your completed and planned breweries." />
</svelte:head>
