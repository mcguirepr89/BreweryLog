import inspirationalQuotes from './json/quotes.json';
import randomBackgrounds from './json/backgrounds.json';
import type {
	Brewery,
	Background,
	Checklist,
	Collection,
	Note,
	Transportation,
	User
} from './types';

export function getRandomQuote() {
	const quotes = inspirationalQuotes.quotes;
	const randomIndex = Math.floor(Math.random() * quotes.length);
	let quoteString = quotes[randomIndex].quote;
	return { quote: quoteString };
}

export function getFlag(size: number, country: string) {
	return `https://flagcdn.com/h${size}/${country}.png`;
}

export function checkLink(link: string) {
	if (link.startsWith('http://') || (link.startsWith('https://') && link.indexOf('.') !== -1)) {
		return link;
	} else {
		return 'http://' + link + '.com';
	}
}

export async function exportData() {
	let res = await fetch('/api/breweries/all');
	let breweries = (await res.json()) as Brewery[];

	res = await fetch('/api/collections/all');
	let collections = (await res.json()) as Collection[];

	res = await fetch('/api/visitedregion');
	let visitedRegions = await res.json();

	const data = {
		breweries,
		collections,
		visitedRegions
	};

	const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
	return URL.createObjectURL(blob);
}

export function isValidUrl(url: string) {
	try {
		new URL(url);
		return true;
	} catch (err) {
		return false;
	}
}

export function groupBreweriesByDate(
	breweries: Brewery[],
	startDate: Date,
	numberOfDays: number
): Record<string, Brewery[]> {
	const groupedBreweries: Record<string, Brewery[]> = {};

	// Initialize all days in the range
	for (let i = 0; i < numberOfDays; i++) {
		const currentDate = new Date(startDate);
		currentDate.setUTCDate(startDate.getUTCDate() + i);
		const dateString = currentDate.toISOString().split('T')[0];
		groupedBreweries[dateString] = [];
	}

	breweries.forEach((brewery) => {
		brewery.visits.forEach((visit) => {
			if (visit.start_date) {
				const breweryDate = new Date(visit.start_date).toISOString().split('T')[0];
				if (visit.end_date) {
					const endDate = new Date(visit.end_date).toISOString().split('T')[0];

					// Loop through all days and include brewery if it falls within the range
					for (let i = 0; i < numberOfDays; i++) {
						const currentDate = new Date(startDate);
						currentDate.setUTCDate(startDate.getUTCDate() + i);
						const dateString = currentDate.toISOString().split('T')[0];

						// Include the current day if it falls within the brewery date range
						if (dateString >= breweryDate && dateString <= endDate) {
							if (groupedBreweries[dateString]) {
								groupedBreweries[dateString].push(brewery);
							}
						}
					}
				} else if (groupedBreweries[breweryDate]) {
					// If there's no end date, add brewery to the start date only
					groupedBreweries[breweryDate].push(brewery);
				}
			}
		});
	});

	return groupedBreweries;
}

export function groupTransportationsByDate(
	transportations: Transportation[],
	startDate: Date,
	numberOfDays: number
): Record<string, Transportation[]> {
	const groupedTransportations: Record<string, Transportation[]> = {};

	// Initialize all days in the range
	for (let i = 0; i < numberOfDays; i++) {
		const currentDate = new Date(startDate);
		currentDate.setUTCDate(startDate.getUTCDate() + i);
		const dateString = currentDate.toISOString().split('T')[0];
		groupedTransportations[dateString] = [];
	}

	transportations.forEach((transportation) => {
		if (transportation.date) {
			const transportationDate = new Date(transportation.date).toISOString().split('T')[0];
			if (transportation.end_date) {
				const endDate = new Date(transportation.end_date).toISOString().split('T')[0];

				// Loop through all days and include transportation if it falls within the range
				for (let i = 0; i < numberOfDays; i++) {
					const currentDate = new Date(startDate);
					currentDate.setUTCDate(startDate.getUTCDate() + i);
					const dateString = currentDate.toISOString().split('T')[0];

					// Include the current day if it falls within the transportation date range
					if (dateString >= transportationDate && dateString <= endDate) {
						if (groupedTransportations[dateString]) {
							groupedTransportations[dateString].push(transportation);
						}
					}
				}
			} else if (groupedTransportations[transportationDate]) {
				// If there's no end date, add transportation to the start date only
				groupedTransportations[transportationDate].push(transportation);
			}
		}
	});

	return groupedTransportations;
}

export function groupNotesByDate(
	notes: Note[],
	startDate: Date,
	numberOfDays: number
): Record<string, Note[]> {
	const groupedNotes: Record<string, Note[]> = {};

	// Initialize all days in the range
	for (let i = 0; i < numberOfDays; i++) {
		const currentDate = new Date(startDate);
		currentDate.setUTCDate(startDate.getUTCDate() + i);
		const dateString = currentDate.toISOString().split('T')[0];
		groupedNotes[dateString] = [];
	}

	notes.forEach((note) => {
		if (note.date) {
			const noteDate = new Date(note.date).toISOString().split('T')[0];

			// Add note to the appropriate date group if it exists
			if (groupedNotes[noteDate]) {
				groupedNotes[noteDate].push(note);
			}
		}
	});

	return groupedNotes;
}

export function groupChecklistsByDate(
	checklists: Checklist[],
	startDate: Date,
	numberOfDays: number
): Record<string, Checklist[]> {
	const groupedChecklists: Record<string, Checklist[]> = {};

	// Initialize all days in the range
	for (let i = 0; i < numberOfDays; i++) {
		const currentDate = new Date(startDate);
		currentDate.setUTCDate(startDate.getUTCDate() + i);
		const dateString = currentDate.toISOString().split('T')[0];
		groupedChecklists[dateString] = [];
	}

	checklists.forEach((checklist) => {
		if (checklist.date) {
			const checklistDate = new Date(checklist.date).toISOString().split('T')[0];

			// Add checklist to the appropriate date group if it exists
			if (groupedChecklists[checklistDate]) {
				groupedChecklists[checklistDate].push(checklist);
			}
		}
	});

	return groupedChecklists;
}

export function continentCodeToString(code: string) {
	switch (code) {
		case 'AF':
			return 'Africa';
		case 'AN':
			return 'Antarctica';
		case 'AS':
			return 'Asia';
		case 'EU':
			return 'Europe';
		case 'NA':
			return 'North America';
		case 'OC':
			return 'Oceania';
		case 'SA':
			return 'South America';
		default:
			return 'Unknown';
	}
}

export let ADVENTURE_TYPES = [
	{ type: 'general', label: 'General 🌍' },
	{ type: 'outdoor', label: 'Outdoor 🏞️' },
	{ type: 'lodging', label: 'Lodging 🛌' },
	{ type: 'dining', label: 'Dining 🍽️' },
	{ type: 'activity', label: 'Activity 🏄' },
	{ type: 'attraction', label: 'Attraction 🎢' },
	{ type: 'shopping', label: 'Shopping 🛍️' },
	{ type: 'nightlife', label: 'Nightlife 🌃' },
	{ type: 'event', label: 'Event 🎉' },
	{ type: 'transportation', label: 'Transportation 🚗' },
	{ type: 'culture', label: 'Culture 🎭' },
	{ type: 'water_sports', label: 'Water Sports 🚤' },
	{ type: 'hiking', label: 'Hiking 🥾' },
	{ type: 'wildlife', label: 'Wildlife 🦒' },
	{ type: 'historical_sites', label: 'Historical Sites 🏛️' },
	{ type: 'music_concerts', label: 'Music & Concerts 🎶' },
	{ type: 'fitness', label: 'Fitness 🏋️' },
	{ type: 'art_museums', label: 'Art & Museums 🎨' },
	{ type: 'festivals', label: 'Festivals 🎪' },
	{ type: 'spiritual_journeys', label: 'Spiritual Journeys 🧘‍♀️' },
	{ type: 'volunteer_work', label: 'Volunteer Work 🤝' },
	{ type: 'other', label: 'Other' }
];

// brewery type to icon mapping
export let ADVENTURE_TYPE_ICONS = {
	general: '🌍',
	outdoor: '🏞️',
	lodging: '🛌',
	dining: '🍽️',
	activity: '🏄',
	attraction: '🎢',
	shopping: '🛍️',
	nightlife: '🌃',
	event: '🎉',
	transportation: '🚗',
	culture: '🎭',
	water_sports: '🚤',
	hiking: '🥾',
	wildlife: '🦒',
	historical_sites: '🏛️',
	music_concerts: '🎶',
	fitness: '🏋️',
	art_museums: '🎨',
	festivals: '🎪',
	spiritual_journeys: '🧘‍♀️',
	volunteer_work: '🤝',
	other: '❓'
};

export function getBreweryTypeLabel(type: string) {
	// return the emoji ADVENTURE_TYPE_ICONS label for the given type if not found return ? emoji
	if (type in ADVENTURE_TYPE_ICONS) {
		return ADVENTURE_TYPE_ICONS[type as keyof typeof ADVENTURE_TYPE_ICONS];
	} else {
		return '❓';
	}
}

export function getRandomBackground() {
	const today = new Date();

	// Special dates for specific backgrounds
	// New Years week

	const newYearsStart = new Date(today.getFullYear() - 1, 11, 31);
	newYearsStart.setHours(0, 0, 0, 0);
	const newYearsEnd = new Date(today.getFullYear(), 0, 2);
	newYearsEnd.setHours(23, 59, 59, 999);
	if (today >= newYearsStart && today <= newYearsEnd) {
		return {
			url: 'backgrounds/brewerylog_new_year.webp',
			author: 'Roven Images',
			location: "Happy New Year's from the BreweryLog team!"
		} as Background;
	}

	// Christmas 12/24 - 12/25
	const christmasStart = new Date(today.getFullYear(), 11, 24);
	christmasStart.setHours(0, 0, 0, 0);
	const christmasEnd = new Date(today.getFullYear(), 11, 25);
	christmasEnd.setHours(23, 59, 59, 999);

	if (today >= christmasStart && today <= christmasEnd) {
		return {
			url: 'backgrounds/brewerylog_christmas.webp',
			author: 'Annie Spratt',
			location: 'Merry Christmas from the BreweryLog team!'
		} as Background;
	}

	const randomIndex = Math.floor(Math.random() * randomBackgrounds.backgrounds.length);
	return randomBackgrounds.backgrounds[randomIndex] as Background;
}

export function findFirstValue(obj: any): any {
	for (const key in obj) {
		if (typeof obj[key] === 'object' && obj[key] !== null) {
			const value = findFirstValue(obj[key]);
			if (value !== undefined) {
				return value;
			}
		} else {
			return obj[key];
		}
	}
}

export let themes = [
	{ name: 'light', label: 'Light' },
	{ name: 'dark', label: 'Dark' },
	{ name: 'night', label: 'Night' },
	{ name: 'forest', label: 'Forest' },
	{ name: 'aqua', label: 'Aqua' },
	{ name: 'aestheticLight', label: 'Aesthetic Light' },
	{ name: 'aestheticDark', label: 'Aesthetic Dark' },
	{ name: 'northernLights', label: 'Northern Lights' }
];

export function osmTagToEmoji(tag: string) {
	switch (tag) {
		case 'camp_site':
			return '🏕️';
		case 'slipway':
			return '🛳️';
		case 'playground':
			return '🛝';
		case 'viewpoint':
			return '👀';
		case 'cape':
			return '🏞️';
		case 'beach':
			return '🏖️';
		case 'park':
			return '🌳';
		case 'museum':
			return '🏛️';
		case 'theme_park':
			return '🎢';
		case 'nature_reserve':
			return '🌲';
		case 'memorial':
			return '🕊️';
		case 'monument':
			return '🗿';
		case 'wood':
			return '🌲';
		case 'zoo':
			return '🦁';
		case 'attraction':
			return '🎡';
		case 'ruins':
			return '🏚️';
		case 'bay':
			return '🌊';
		case 'hotel':
			return '🏨';
		case 'motel':
			return '🏩';
		case 'pub':
			return '🍺';
		case 'restaurant':
			return '🍽️';
		case 'cafe':
			return '☕';
		case 'bakery':
			return '🥐';
		case 'archaeological_site':
			return '🏺';
		case 'lighthouse':
			return '🗼';
		case 'tree':
			return '🌳';
		case 'cliff':
			return '⛰️';
		case 'water':
			return '💧';
		case 'fishing':
			return '🎣';
		case 'golf_course':
			return '⛳';
		case 'swimming_pool':
			return '🏊';
		case 'stadium':
			return '🏟️';
		case 'cave_entrance':
			return '🕳️';
		case 'anchor':
			return '⚓';
		case 'garden':
			return '🌼';
		case 'disc_golf_course':
			return '🥏';
		case 'natural':
			return '🌿';
		case 'ice_rink':
			return '⛸️';
		case 'horse_riding':
			return '🐎';
		case 'wreck':
			return '🚢';
		case 'water_park':
			return '💦';
		case 'picnic_site':
			return '🧺';
		case 'axe_throwing':
			return '🪓';
		case 'fort':
			return '🏰';
		case 'amusement_arcade':
			return '🕹️';
		case 'tepee':
			return '🏕️';
		case 'track':
			return '🏃';
		case 'trampoline_park':
			return '🤸';
		case 'dojo':
			return '🥋';
		case 'tree_stump':
			return '🪵';
		case 'peak':
			return '🏔️';
		case 'fitness_centre':
			return '🏋️';
		case 'artwork':
			return '🎨';
		case 'fast_food':
			return '🍔';
		case 'ice_cream':
			return '🍦';
		default:
			return '📍'; // Default placeholder emoji for unknown tags
	}
}
