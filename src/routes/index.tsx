import { createFileRoute } from "@tanstack/react-router";
import {
	ArrowRight,
	Camera,
	Check,
	Copy,
	Eye,
	EyeOff,
	Shield,
	Sparkles,
	Users,
} from "lucide-react";
import { nip19 } from "nostr-tools";
import { useMemo, useState } from "react";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";
import { Textarea } from "../components/ui/textarea";
import { suggestedFollows } from "../lib/follow-list";
import {
	createFollowEvent,
	createKeys,
	createProfileEvent,
	type NostrKeys,
} from "../lib/nostr";

export const Route = createFileRoute("/")({ component: App });

type Screen = "welcome" | "keys" | "profile" | "follow" | "done";

function App() {
	const [screen, setScreen] = useState<Screen>("welcome");
	const [keys, setKeys] = useState<NostrKeys | null>(null);
	const [savedKeyConfirmed, setSavedKeyConfirmed] = useState(false);
	const [showPrivateKey, setShowPrivateKey] = useState(false);

	const [displayName, setDisplayName] = useState("");
	const [about, setAbout] = useState("");
	const [picture, setPicture] = useState("");
	const [profileEventJson, setProfileEventJson] = useState("");
	const [followEventJson, setFollowEventJson] = useState("");

	const [selectedPubkeys, setSelectedPubkeys] = useState<string[]>(
		suggestedFollows.slice(0, 3).map((person) => person.pubkey),
	);

	const progressPercent =
		screen === "keys"
			? 34
			: screen === "profile"
				? 67
				: screen === "follow"
					? 100
					: 0;

	const followCards = useMemo(() => {
		return suggestedFollows.map((person) => ({
			...person,
			npub: nip19.npubEncode(person.pubkey),
		}));
	}, []);

	function handleCreateAccount() {
		const generated = createKeys();
		setKeys(generated);
		setSavedKeyConfirmed(false);
		setScreen("keys");
	}

	function handleCreateProfile() {
		if (!keys || !displayName.trim()) {
			return;
		}

		const profileEvent = createProfileEvent({
			keys,
			profile: {
				name: displayName.trim(),
				about: about.trim(),
				picture: picture.trim(),
			},
		});

		setProfileEventJson(JSON.stringify(profileEvent, null, 2));
		setScreen("follow");
	}

	function handleFinishFollows() {
		if (!keys) {
			return;
		}

		const followEvent = createFollowEvent({
			keys,
			pubkeysToFollow: selectedPubkeys,
		});

		setFollowEventJson(JSON.stringify(followEvent, null, 2));
		setScreen("done");
	}

	function toggleFollow(pubkey: string) {
		setSelectedPubkeys((current) => {
			if (current.includes(pubkey)) {
				return current.filter((candidate) => candidate !== pubkey);
			}

			return [...current, pubkey];
		});
	}

	if (screen === "welcome") {
		return (
			<main className="onboarding-shell">
				<div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-10">
					<div className="mx-auto max-w-3xl text-center">
						<p className="font-mono text-sm text-fuchsia-300">
							START WITH NOSTR
						</p>
						<h1 className="mt-3 bg-gradient-to-r from-fuchsia-400 via-pink-300 to-violet-400 bg-clip-text text-6xl font-extrabold leading-tight text-transparent md:text-8xl">
							NOSTR
						</h1>
						<p className="mt-8 text-4xl font-bold tracking-tight text-foreground md:text-6xl">
							Own your voice.
						</p>
						<p className="mt-2 text-4xl font-bold tracking-tight text-fuchsia-300 md:text-6xl">
							Join Nostr.
						</p>
						<p className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
							A social network where you control your data, your identity, and
							your connections. No algorithms. No ads. No censorship.
						</p>

						<Button className="mt-10" size="lg" onClick={handleCreateAccount}>
							Create Your Account <ArrowRight className="ml-1 size-5" />
						</Button>

						<p className="mt-4 text-sm text-muted-foreground">
							Takes about 2 minutes
						</p>
					</div>

					<div className="mt-16 grid gap-4 md:grid-cols-3">
						{[
							{
								icon: Shield,
								title: "You own your identity",
								text: "Only your keys unlock your account.",
							},
							{
								icon: Users,
								title: "Works everywhere",
								text: "Your profile and follows are portable.",
							},
							{
								icon: Sparkles,
								title: "Censorship resistant",
								text: "No single company controls your social graph.",
							},
						].map((feature) => (
							<Card key={feature.title} className="border-white/10 bg-black/25">
								<CardHeader>
									<feature.icon className="size-7 text-fuchsia-300" />
									<CardTitle>{feature.title}</CardTitle>
									<CardDescription>{feature.text}</CardDescription>
								</CardHeader>
							</Card>
						))}
					</div>
				</div>
			</main>
		);
	}

	return (
		<main className="onboarding-shell min-h-screen px-6 py-8">
			<div className="mx-auto w-full max-w-3xl pb-20">
				<div className="mb-14">
					<p className="font-mono text-sm text-fuchsia-300">
						{screen === "keys" && "Step 1 of 3 - Save your keys"}
						{screen === "profile" && "Step 2 of 3 - Set up your profile"}
						{screen === "follow" && "Step 3 of 3 - Follow people"}
						{screen === "done" && "All set - Account ready"}
					</p>
					<Progress className="mt-3" value={progressPercent} />
				</div>

				{screen === "keys" && keys ? (
					<div className="space-y-7">
						<div className="text-center">
							<div className="mx-auto mb-5 flex size-24 items-center justify-center rounded-3xl bg-fuchsia-500/20">
								<Shield className="size-12 text-fuchsia-300" />
							</div>
							<h2 className="text-5xl font-bold tracking-tight">
								Your Keys Are Ready
							</h2>
							<p className="mt-4 text-xl text-muted-foreground">
								Save them somewhere safe. If you lose them, you lose access
								forever.
							</p>
						</div>

						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle className="text-lg">Public Key (npub)</CardTitle>
									<Badge>Share freely</Badge>
								</div>
								<CardDescription>This is your Nostr username.</CardDescription>
							</CardHeader>
							<CardContent className="flex gap-3">
								<Input
									readOnly
									value={keys.npub}
									className="font-mono text-sm"
								/>
								<Button
									variant="secondary"
									size="icon"
									onClick={() => navigator.clipboard.writeText(keys.npub)}
									aria-label="Copy public key"
								>
									<Copy className="size-4" />
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle className="text-lg">Private Key (nsec)</CardTitle>
									<Badge className="border-amber-500/40 bg-amber-500/20 text-amber-200">
										Never share
									</Badge>
								</div>
								<CardDescription>
									Anyone with this can control your account.
								</CardDescription>
							</CardHeader>
							<CardContent className="flex gap-3">
								<Input
									readOnly
									value={showPrivateKey ? keys.nsec : "*".repeat(44)}
									className="font-mono text-sm"
								/>
								<Button
									variant="secondary"
									size="icon"
									onClick={() => setShowPrivateKey((current) => !current)}
									aria-label="Toggle private key"
								>
									{showPrivateKey ? (
										<EyeOff className="size-4" />
									) : (
										<Eye className="size-4" />
									)}
								</Button>
								<Button
									variant="secondary"
									size="icon"
									onClick={() => navigator.clipboard.writeText(keys.nsec)}
									aria-label="Copy private key"
								>
									<Copy className="size-4" />
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="flex items-start gap-3 pt-6">
								<Checkbox
									checked={savedKeyConfirmed}
									onChange={(event) =>
										setSavedKeyConfirmed(event.currentTarget.checked)
									}
								/>
								<div>
									<p className="text-xl font-semibold">
										I have saved my private key somewhere safe
									</p>
									<p className="mt-2 text-muted-foreground">
										Write it down, save it in a password manager, or secure it
										offline.
									</p>
								</div>
							</CardContent>
						</Card>

						<Button
							size="lg"
							className="w-full"
							disabled={!savedKeyConfirmed}
							onClick={() => setScreen("profile")}
						>
							Continue to Profile Setup <ArrowRight className="size-5" />
						</Button>
					</div>
				) : null}

				{screen === "profile" ? (
					<div className="space-y-7">
						<div className="text-center">
							<div className="mx-auto mb-5 flex size-24 items-center justify-center rounded-3xl bg-fuchsia-500/20">
								<Sparkles className="size-12 text-fuchsia-300" />
							</div>
							<h2 className="text-5xl font-bold tracking-tight">
								Create Your Profile
							</h2>
							<p className="mt-4 text-xl text-muted-foreground">
								Let people know who you are. You can always change this later.
							</p>
						</div>

						<Card>
							<CardContent className="space-y-5 pt-6">
								<div className="flex justify-center">
									<div className="flex size-40 flex-col items-center justify-center rounded-full border border-white/10 bg-black/35 text-muted-foreground">
										<Camera className="mb-2 size-9" />
										<span>Add photo URL</span>
									</div>
								</div>

								<div>
									<Label>Display Name *</Label>
									<Input
										value={displayName}
										onChange={(event) =>
											setDisplayName(event.currentTarget.value)
										}
										placeholder="How should people call you?"
										className="mt-2"
									/>
								</div>

								<div>
									<Label>Photo URL (optional)</Label>
									<Input
										value={picture}
										onChange={(event) => setPicture(event.currentTarget.value)}
										placeholder="https://example.com/avatar.png"
										className="mt-2"
									/>
								</div>

								<div>
									<Label>About You (optional)</Label>
									<Textarea
										value={about}
										onChange={(event) => setAbout(event.currentTarget.value)}
										placeholder="Tell people a bit about yourself..."
										className="mt-2"
									/>
								</div>
							</CardContent>
						</Card>

						<div className="space-y-3">
							<Button
								size="lg"
								className="w-full"
								onClick={handleCreateProfile}
								disabled={!displayName.trim()}
							>
								Create Profile <ArrowRight className="size-5" />
							</Button>
							<button
								type="button"
								onClick={() => setScreen("follow")}
								className="w-full text-center text-muted-foreground hover:text-foreground"
							>
								Skip for now
							</button>
						</div>
					</div>
				) : null}

				{screen === "follow" ? (
					<div className="space-y-6">
						<div className="text-center">
							<div className="mx-auto mb-5 flex size-24 items-center justify-center rounded-3xl bg-fuchsia-500/20">
								<Users className="size-12 text-fuchsia-300" />
							</div>
							<h2 className="text-5xl font-bold tracking-tight">
								Follow Great People
							</h2>
							<p className="mt-4 text-xl text-muted-foreground">
								Pick a few profiles to make your feed useful from day one.
							</p>
						</div>

						<div className="grid gap-4">
							{followCards.map((person) => {
								const checked = selectedPubkeys.includes(person.pubkey);

								return (
									<Card key={person.pubkey}>
										<CardContent className="flex items-start justify-between gap-4 pt-6">
											<div>
												<p className="text-lg font-semibold">{person.name}</p>
												<p className="text-sm text-muted-foreground">
													{person.handle}
												</p>
												<p className="mt-2 text-sm text-muted-foreground">
													{person.about}
												</p>
												<p className="mt-2 font-mono text-xs text-fuchsia-200">
													{person.npub}
												</p>
											</div>
											<Button
												variant={checked ? "default" : "secondary"}
												onClick={() => toggleFollow(person.pubkey)}
											>
												{checked ? (
													<>
														<Check className="size-4" /> Following
													</>
												) : (
													"Follow"
												)}
											</Button>
										</CardContent>
									</Card>
								);
							})}
						</div>

						<Button size="lg" className="w-full" onClick={handleFinishFollows}>
							Finish setup ({selectedPubkeys.length} selected)
						</Button>
					</div>
				) : null}

				{screen === "done" && keys ? (
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="text-3xl">
									You are ready for Nostr
								</CardTitle>
								<CardDescription>
									You now have keys, a profile event, and a follow list event
									signed with nostr-tools.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-5">
								<div>
									<p className="text-sm text-muted-foreground">Public key</p>
									<p className="mt-1 font-mono text-xs">{keys.npub}</p>
								</div>
								{profileEventJson ? (
									<div>
										<p className="text-sm text-muted-foreground">
											Profile event (kind 0)
										</p>
										<pre className="mt-2 max-h-52 overflow-auto rounded-lg bg-black/40 p-4 font-mono text-xs text-fuchsia-100">
											{profileEventJson}
										</pre>
									</div>
								) : null}
								<div>
									<p className="text-sm text-muted-foreground">
										Follow list event (kind 3)
									</p>
									<pre className="mt-2 max-h-52 overflow-auto rounded-lg bg-black/40 p-4 font-mono text-xs text-fuchsia-100">
										{followEventJson}
									</pre>
								</div>
							</CardContent>
						</Card>

						<Button
							size="lg"
							className="w-full"
							onClick={() => setScreen("welcome")}
						>
							Start again
						</Button>
					</div>
				) : null}
			</div>
		</main>
	);
}
