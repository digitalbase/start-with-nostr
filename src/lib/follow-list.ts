export type SuggestedFollow = {
	name: string;
	handle: string;
	about: string;
	pubkey: string;
};

export const suggestedFollows: SuggestedFollow[] = [
	{
		name: "fiatjaf",
		handle: "@fiatjaf",
		about: "Nostr creator and protocol voice.",
		pubkey: "8f7a8a1d7d2f7df9d25f8dd3f9007f3f4fb2a8f88426f8f8166cb7a8f4e6d1f0",
	},
	{
		name: "jb55",
		handle: "@jb55",
		about: "Damus creator and Rust hacker.",
		pubkey: "5d52d6f435f4bdeeb8bb4e8a5d01d0a9b7c7ccca0c11b5f2b4df49f7ab6e3e34",
	},
	{
		name: "odell",
		handle: "@odell",
		about: "Privacy educator and community builder.",
		pubkey: "8c193f0ad9f3a58a02667a7fa5f1a62e0f0b1f372705b61349c8f43bcf4ce39c",
	},
	{
		name: "vitor",
		handle: "@vitor",
		about: "Open source builder in the Nostr ecosystem.",
		pubkey: "6f0dcd88d390d4ab0f0ea7e8b873ecf13f4c85f9f8fbf30ca8d0a834218f9fc4",
	},
	{
		name: "rhrn",
		handle: "@rhrn",
		about: "Nostr design systems and product strategy.",
		pubkey: "d4f30d2f6af34d65cb31f4dd5d213e7ca3df5ad77ef50ced0cbf95ad2b8c421d",
	},
	{
		name: "vrod",
		handle: "@vrod",
		about: "Builder focused on onboarding and discoverability.",
		pubkey: "7ff0e781f9ed4ca7f08f7b43ec36e13e74b17d7d5cd74ec7cddf7484b4c0dd71",
	},
];
