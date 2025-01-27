import type { Brewery, OpenStreetMapPlace } from '$lib/types';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { appVersion } from '$lib/config';

const PUBLIC_SERVER_URL = process.env['PUBLIC_SERVER_URL'];
const serverEndpoint = PUBLIC_SERVER_URL || 'http://localhost:8000';

export const load = (async (event) => {
	const query = event.url.searchParams.get('query');
	const property = event.url.searchParams.get('property') || 'all';

	if (!query) {
		return { data: [] };
	}

	let sessionId = event.cookies.get('sessionid');

	let res = await fetch(
		`${serverEndpoint}/api/breweries/search/?query=${query}&property=${property}`,
		{
			headers: {
				'Content-Type': 'application/json',
				Cookie: `sessionid=${sessionId}`
			}
		}
	);

	if (!res.ok) {
		console.error('Failed to fetch search data');
		let error = await res.json();
		return { error: error.error };
	}

	let breweries: Brewery[] = await res.json();

	let osmRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=jsonv2`, {
		headers: {
			'User-Agent': `BreweryLog / ${appVersion} `
		}
	});

	if (!osmRes.ok) {
		console.error('Failed to fetch OSM data');
		let error = await res.json();
		return { error: error.error };
	}

	let osmData = (await osmRes.json()) as OpenStreetMapPlace[];

	return {
		props: {
			breweries,
			query,
			osmData
		}
	};
}) satisfies PageServerLoad;
