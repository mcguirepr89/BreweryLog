<script lang="ts">
	import type { Brewery } from '$lib/types';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import Lost from '$lib/assets/undraw_lost.svg';
	import { DefaultMarker, MapLibre, Popup, GeoJSON, LineLayer } from 'svelte-maplibre';
	import { t } from 'svelte-i18n';
	import { marked } from 'marked'; // Import the markdown parser

	// @ts-ignore
	import toGeoJSON from '@mapbox/togeojson';

	import LightbulbOn from '~icons/mdi/lightbulb-on';

	let geojson: any;

	const renderMarkdown = (markdown: string) => {
		return marked(markdown);
	};

	async function getGpxFiles() {
		let gpxfiles: string[] = [];

		// Collect all GPX file attachments
		if (brewery.attachments && brewery.attachments.length > 0) {
			brewery.attachments
				.filter((attachment) => attachment.extension === 'gpx')
				.forEach((attachment) => gpxfiles.push(attachment.file));
		}

		// Initialize a collection GeoJSON object
		geojson = {
			type: 'FeatureCollection',
			features: []
		};

		// Process each GPX file
		if (gpxfiles.length > 0) {
			for (const gpxfile of gpxfiles) {
				try {
					let gpxFileName = gpxfile.split('/').pop();
					let res = await fetch('/gpx/' + gpxFileName);

					if (!res.ok) {
						console.error(`Failed to fetch GPX file: ${gpxFileName}`);
						continue;
					}

					let gpxData = await res.text();
					let parser = new DOMParser();
					let gpx = parser.parseFromString(gpxData, 'text/xml');

					// Convert GPX to GeoJSON and merge features
					let convertedGeoJSON = toGeoJSON.gpx(gpx);
					if (convertedGeoJSON.features) {
						geojson.features.push(...convertedGeoJSON.features);
					}
				} catch (error) {
					console.error(`Error processing GPX file ${gpxfile}:`, error);
				}
			}
		}
	}

	export let data: PageData;
	console.log(data);

	let brewery: Brewery;

	let currentSlide = 0;

	function goToSlide(index: number) {
		currentSlide = index;
	}

	let notFound: boolean = false;
	let isEditModalOpen: boolean = false;
	let image_url: string | null = null;

	import ClipboardList from '~icons/mdi/clipboard-list';
	import BreweryModal from '$lib/components/BreweryModal.svelte';
	import ImageDisplayModal from '$lib/components/ImageDisplayModal.svelte';
	import AttachmentCard from '$lib/components/AttachmentCard.svelte';

	onMount(async () => {
		if (data.props.brewery) {
			brewery = data.props.brewery;
			// sort so that any image in brewery_images .is_primary is first
			brewery.images.sort((a, b) => {
				if (a.is_primary && !b.is_primary) {
					return -1;
				} else if (!a.is_primary && b.is_primary) {
					return 1;
				} else {
					return 0;
				}
			});
		} else {
			notFound = true;
		}
		await getGpxFiles();
	});

	async function saveEdit(event: CustomEvent<Brewery>) {
		brewery = event.detail;
		isEditModalOpen = false;
		geojson = null;
		await getGpxFiles();
	}
</script>

{#if notFound}
	<div
		class="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 -mt-20"
	>
		<div class="mx-auto max-w-md text-center">
			<div class="flex items-center justify-center">
				<img src={Lost} alt="Lost" class="w-1/2" />
			</div>
			<h1 class="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
				{$t('breweries.not_found')}
			</h1>
			<p class="mt-4 text-muted-foreground">
				{$t('breweries.not_found_desc')}
			</p>
			<div class="mt-6">
				<button class="btn btn-primary" on:click={() => goto('/')}
					>{$t('breweries.homepage')}</button
				>
			</div>
		</div>
	</div>
{/if}

{#if isEditModalOpen}
	<BreweryModal
		breweryToEdit={brewery}
		on:close={() => (isEditModalOpen = false)}
		on:save={saveEdit}
	/>
{/if}

{#if image_url}
	<ImageDisplayModal image={image_url} on:close={() => (image_url = null)} {brewery} />
{/if}

{#if !brewery && !notFound}
	<div class="flex justify-center items-center w-full mt-16">
		<span class="loading loading-spinner w-24 h-24"></span>
	</div>
{/if}

{#if brewery}
	{#if data.user && data.user.uuid == brewery.user_id}
		<div class="fixed bottom-4 right-4 z-[999]">
			<button class="btn m-1 size-16 btn-primary" on:click={() => (isEditModalOpen = true)}
				><ClipboardList class="w-8 h-8" /></button
			>
		</div>
	{/if}
	<div class="flex flex-col min-h-dvh">
		<main class="flex-1">
			<div class="max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
				<div class="grid gap-8">
					{#if brewery.images && brewery.images.length > 0}
						<div class="carousel w-full">
							{#each brewery.images as image, i}
								<!-- svelte-ignore a11y-no-static-element-interactions -->
								<!-- svelte-ignore a11y-missing-attribute -->
								<!-- svelte-ignore a11y-missing-content -->
								<div
									class="carousel-item w-full"
									style="display: {i === currentSlide ? 'block' : 'none'}"
								>
									<!-- svelte-ignore a11y-click-events-have-key-events -->
									<!-- svelte-ignore a11y-missing-attribute -->
									<a on:click={() => (image_url = image.image)}>
										<img
											src={image.image}
											width="1200"
											height="600"
											class="w-full h-auto object-cover rounded-lg"
											style="aspect-ratio: 1200 / 600; object-fit: cover;"
											alt={brewery.name}
										/>
									</a>
									<div class="flex justify-center w-full py-2 gap-2">
										{#each brewery.images as _, i}
											<button
												on:click={() => goToSlide(i)}
												class="btn btn-xs {i === currentSlide ? 'btn-active' : ''}">{i + 1}</button
											>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					{/if}
					<div class="grid gap-4">
						<div class="flex items-center justify-between">
							<div>
								<h1 class="text-4xl mt-2 font-bold">{brewery.name}</h1>
							</div>
							<div class="flex items-center gap-1">
								{#if brewery.rating !== undefined && brewery.rating !== null}
									<div class="flex justify-center items-center">
										<div class="rating" aria-readonly="true">
											{#each Array.from({ length: 5 }, (_, i) => i + 1) as star}
												<input
													type="radio"
													name="rating-1"
													class="mask mask-star"
													checked={star <= brewery.rating}
													disabled
												/>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						</div>
						<div class="grid gap-2">
							<div class="flex items-center gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="w-5 h-5 text-muted-foreground"
								>
									<rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
									<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
								</svg>
								<span class="text-sm text-muted-foreground"
									>{brewery.is_public ? 'Public' : 'Private'}</span
								>
							</div>
							{#if brewery.location}
								<div class="flex items-center gap-2">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										class="w-5 h-5 text-muted-foreground"
									>
										<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
										<circle cx="12" cy="10" r="3"></circle>
									</svg>
									<span class="text-sm text-muted-foreground">{brewery.location}</span>
								</div>
							{/if}
							{#if brewery.activity_types && brewery.activity_types?.length > 0}
								<div class="flex items-center gap-2">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										class="w-5 h-5 text-muted-foreground"
									>
										<path
											d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"
										></path>
									</svg>
									<span class="text-sm text-muted-foreground"
										>{brewery.activity_types.join(', ')}</span
									>
								</div>
							{/if}
							{#if brewery.link}
								<div class="flex items-center gap-2">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										class="w-5 h-5 text-muted-foreground"
									>
										<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
										<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
									</svg>
									<a
										href={brewery.link}
										class="text-sm text-muted-foreground hover:underline"
										target="_blank"
									>
										{brewery.link.length > 45
											? `${brewery.link.slice(0, 45)}...`
											: brewery.link}
									</a>
								</div>
							{/if}
						</div>
						{#if brewery.description}
							<p class="text-sm text-muted-foreground" style="white-space: pre-wrap;"></p>
							<article
								class="prose overflow-auto h-full max-w-full p-4 border border-base-300 rounded-lg"
							>
								{@html renderMarkdown(brewery.description)}
							</article>
						{/if}
					</div>
				</div>
				<div
					data-orientation="horizontal"
					role="none"
					class="shrink-0 bg-border h-[1px] w-full my-8"
				></div>
				<div class="grid gap-8">
					<div>
						<h2 class="text-2xl font-bold mt-4">{$t('breweries.brewery_details')}</h2>
						<div class="grid gap-4 mt-4">
							<div class="grid md:grid-cols-2 gap-4">
								<div>
									<p class="text-sm text-muted-foreground">{$t('breweries.brewery_type')}</p>
									<p class="text-base font-medium">
										{brewery.category?.display_name + ' ' + brewery.category?.icon}
									</p>
								</div>
								{#if data.props.collection}
									<div>
										<p class="text-sm text-muted-foreground">{$t('breweries.collection')}</p>
										<a
											class="text-base font-medium link"
											href="/collections/{data.props.collection.id}">{data.props.collection.name}</a
										>
									</div>
								{/if}
								{#if brewery.visits.length > 0}
									<div>
										<p class="text-sm text-muted-foreground">Visits</p>
										<p class="text-base font-medium">
											{brewery.visits.length}
											{brewery.visits.length > 1
												? $t('breweries.visits')
												: $t('breweries.visit') + ':'}
										</p>
										<!-- show each visit start and end date as well as notes -->
										{#each brewery.visits as visit}
											<div class="grid gap-2">
												<p class="text-sm text-muted-foreground">
													{visit.start_date
														? new Date(visit.start_date).toLocaleDateString(undefined, {
																timeZone: 'UTC'
															})
														: ''}
													{visit.end_date &&
													visit.end_date !== '' &&
													visit.end_date !== visit.start_date
														? ' - ' +
															new Date(visit.end_date).toLocaleDateString(undefined, {
																timeZone: 'UTC'
															})
														: ''}
												</p>
												<p class="text-sm text-muted-foreground -mt-2 mb-2">{visit.notes}</p>
											</div>
										{/each}
									</div>
								{/if}
							</div>
							{#if (brewery.longitude && brewery.latitude) || geojson}
								{#if brewery.longitude && brewery.latitude}
									<div class="grid md:grid-cols-2 gap-4">
										<div>
											<p class="text-sm text-muted-foreground">{$t('breweries.latitude')}</p>
											<p class="text-base font-medium">{brewery.latitude}° N</p>
										</div>
										<div>
											<p class="text-sm text-muted-foreground">{$t('breweries.longitude')}</p>
											<p class="text-base font-medium">{brewery.longitude}° W</p>
										</div>
									</div>
								{/if}
								<MapLibre
									style="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
									class="flex items-center self-center justify-center aspect-[9/16] max-h-[70vh] sm:aspect-video sm:max-h-full w-10/12 rounded-lg"
									standardControls
									center={{ lng: brewery.longitude || 0, lat: brewery.latitude || 0 }}
									zoom={brewery.longitude ? 12 : 1}
								>
									<!-- use the geojson to make a line -->
									{#if geojson}
										<!-- Add the GeoJSON data -->
										<GeoJSON data={geojson}>
											<LineLayer
												paint={{
													'line-color': '#FF0000', // Red line color
													'line-width': 4 // Adjust the line thickness
												}}
											/>
										</GeoJSON>
									{/if}

									<!-- MapEvents gives you access to map events even from other components inside the map,
  where you might not have access to the top-level `MapLibre` component. In this case
  it would also work to just use on:click on the MapLibre component itself. -->
									<!-- <MapEvents on:click={addMarker} /> -->

									{#if brewery.longitude && brewery.latitude}
										<DefaultMarker lngLat={{ lng: brewery.longitude, lat: brewery.latitude }}>
											<Popup openOn="click" offset={[0, -10]}>
												<div class="text-lg text-black font-bold">{brewery.name}</div>
												<p class="font-semibold text-black text-md">
													{brewery.category?.display_name + ' ' + brewery.category?.icon}
												</p>
												{#if brewery.visits.length > 0}
													<p class="text-black text-sm">
														{#each brewery.visits as visit}
															{visit.start_date
																? new Date(visit.start_date).toLocaleDateString(undefined, {
																		timeZone: 'UTC'
																	})
																: ''}
															{visit.end_date &&
															visit.end_date !== '' &&
															visit.end_date !== visit.start_date
																? ' - ' +
																	new Date(visit.end_date).toLocaleDateString(undefined, {
																		timeZone: 'UTC'
																	})
																: ''}
															<br />
														{/each}
													</p>
												{/if}
											</Popup>
										</DefaultMarker>
									{/if}
								</MapLibre>
							{/if}
						</div>
						{#if brewery.attachments && brewery.attachments.length > 0}
							<div>
								<!-- attachments -->
								<h2 class="text-2xl font-bold mt-4">
									{$t('breweries.attachments')}
									<div class="tooltip z-10" data-tip={$t('breweries.gpx_tip')}>
										<button class="btn btn-sm btn-circle btn-neutral">
											<LightbulbOn class="w-6 h-6" />
										</button>
									</div>
								</h2>

								<div class="grid gap-4 mt-4">
									{#if brewery.attachments && brewery.attachments.length > 0}
										<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
											{#each brewery.attachments as attachment}
												<AttachmentCard {attachment} />
											{/each}
										</div>
									{/if}
								</div>
							</div>
						{/if}
						{#if brewery.images && brewery.images.length > 0}
							<div>
								<h2 class="text-2xl font-bold mt-4">{$t('breweries.images')}</h2>
								<div class="grid gap-4 mt-4">
									{#if brewery.images && brewery.images.length > 0}
										<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
											{#each brewery.images as image}
												<div class="relative">
													<!-- svelte-ignore a11y-no-static-element-interactions -->
													<!-- svelte-ignore a11y-missing-attribute -->
													<!-- svelte-ignore a11y-missing-content -->
													<!-- svelte-ignore a11y-click-events-have-key-events -->
													<div
														class="w-full h-48 bg-cover bg-center rounded-lg"
														style="background-image: url({image.image})"
														on:click={() => (image_url = image.image)}
													></div>
													{#if image.is_primary}
														<div
															class="absolute top-0 right-0 bg-primary text-white px-2 py-1 rounded-bl-lg"
														>
															{$t('breweries.primary')}
														</div>
													{/if}
												</div>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</main>
	</div>
{/if}

<svelte:head>
	<title
		>{data.props.brewery && data.props.brewery.name
			? `${data.props.brewery.name}`
			: 'Brewery'}</title
	>
	<meta name="description" content="Explore the world and add countries to your visited list!" />
</svelte:head>
