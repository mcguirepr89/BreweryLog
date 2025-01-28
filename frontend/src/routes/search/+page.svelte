<script lang="ts">
	import BreweryCard from '$lib/components/BreweryCard.svelte';
	import RegionCard from '$lib/components/RegionCard.svelte';
	import CityCard from '$lib/components/CityCard.svelte';
	import CountryCard from '$lib/components/CountryCard.svelte';
	import CollectionCard from '$lib/components/CollectionCard.svelte';
	import UserCard from '$lib/components/UserCard.svelte';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import { t } from 'svelte-i18n';
	import type {
		Brewery,
		Collection,
		User,
		Country,
		Region,
		City,
		VisitedRegion,
		VisitedCity
	} from '$lib/types';

	export let data: PageData;

	// Whenever the query changes in the URL, SvelteKit automatically re-calls +page.server.ts
	// and updates 'data'. This reactive statement reads the updated 'query' from $page:
	$: query = $page.url.searchParams.get('query') ?? '';

	// Assign updated results from data, so when data changes, the displayed items update:
	$: breweries = data.breweries as Brewery[];
	$: collections = data.collections as Collection[];
	$: users = data.users as User[];
	$: countries = data.countries as Country[];
	$: regions = data.regions as Region[];
	$: cities = data.cities as City[];
	$: visited_regions = data.visited_regions as VisitedRegion[];
	$: visited_cities = data.visited_cities as VisitedCity[];
</script>

<h1 class="text-4xl font-bold text-center m-4">Search{query ? `: ${query}` : ''}</h1>

{#if breweries.length > 0}
	<h2 class="text-3xl font-bold text-center m-4">Breweries</h2>
	<div class="flex flex-wrap gap-4 mr-4 ml-4 justify-center content-center">
		{#each breweries as brewery}
			<BreweryCard {brewery} user={null} />
		{/each}
	</div>
{/if}

{#if collections.length > 0}
	<h2 class="text-3xl font-bold text-center m-4">Collections</h2>
	<div class="flex flex-wrap gap-4 mr-4 ml-4 justify-center content-center">
		{#each collections as collection}
			<CollectionCard {collection} type="" />
		{/each}
	</div>
{/if}

{#if countries.length > 0}
	<h2 class="text-3xl font-bold text-center m-4">Countries</h2>
	<div class="flex flex-wrap gap-4 mr-4 ml-4 justify-center content-center">
		{#each countries as country}
			<CountryCard {country} />
		{/each}
	</div>
{/if}

{#if regions.length > 0}
	<h2 class="text-3xl font-bold text-center m-4">Regions</h2>
	<div class="flex flex-wrap gap-4 mr-4 ml-4 justify-center content-center">
		{#each regions as region}
			<RegionCard {region} visited={visited_regions.some((vr) => vr.region === region.id)} />
		{/each}
	</div>
{/if}

{#if cities.length > 0}
	<h2 class="text-3xl font-bold text-center m-4">Cities</h2>
	<div class="flex flex-wrap gap-4 mr-4 ml-4 justify-center content-center">
		{#each cities as city}
			<CityCard {city} visited={visited_cities.some((vc) => vc.city === city.id)} />
		{/each}
	</div>
{/if}

{#if users.length > 0}
	<h2 class="text-3xl font-bold text-center m-4">Users</h2>
	<div class="flex flex-wrap gap-4 mr-4 ml-4 justify-center content-center">
		{#each users as user}
			<UserCard {user} />
		{/each}
	</div>
{/if}

{#if breweries.length === 0 && regions.length === 0 && cities.length === 0 && countries.length === 0 && collections.length === 0 && users.length === 0}
	<p class="text-center text-lg m-4">
		{$t('breweries.no_results')}
	</p>
{/if}

<svelte:head>
	<title>Search: {query}</title>
	<meta name="description" content="BreweryLog global search results for {query}" />
</svelte:head>
