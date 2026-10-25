import type { Metadata } from "next";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";
import { signInWithDiscord, signOut } from "./actions";
import { DiscordLink } from "@/components/discord-link";
import {
  IconCheck,
  IconShield,
  IconUsers,
  IconVote,
} from "@/components/icons";
import {
  Avatar,
  Badge,
  buttonClasses,
  Card,
  Container,
} from "@/components/ui";
import { getElections, getInitiatives, getParties } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profil",
  description: "Eigenes Profil, Partei und Stimmnachweise.",
};

type ProfileRow = {
  display_name: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
};

type VoteRow = {
  election_id: string;
  option_id: string;
  created_at: string;
};

type SignatureRow = {
  initiative_id: string;
  created_at: string;
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const configured = isSupabaseConfigured();

  let user: User | null = null;
  let profile: ProfileRow | null = null;
  let votes: VoteRow[] = [];
  let signatures: SignatureRow[] = [];

  if (configured) {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;

    if (user) {
      const [{ data: profileRow }, { data: voteRows }, { data: signatureRows }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("display_name, avatar_url, role, created_at")
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("votes")
            .select("election_id, option_id, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("initiative_signatures")
            .select("initiative_id, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
        ]);

      profile = (profileRow as ProfileRow | null) ?? null;
      votes = (voteRows as VoteRow[] | null) ?? [];
      signatures = (signatureRows as SignatureRow[] | null) ?? [];
    }
  }

  let electionList: Awaited<ReturnType<typeof getElections>> = [];
  let initiativeList: Awaited<ReturnType<typeof getInitiatives>> = [];
  let partyList: Awaited<ReturnType<typeof getParties>> = [];

  if (user) {
    [electionList, initiativeList, partyList] = await Promise.all([
      getElections(),
      getInitiatives(),
      getParties(),
    ]);
  }

  const displayName =
    profile?.display_name ??
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email ??
    "Gast";
  const avatarUrl =
    profile?.avatar_url ?? user?.user_metadata?.avatar_url ?? null;
  const hasDiscordAvatar =
    typeof avatarUrl === "string" &&
    avatarUrl.startsWith("https://cdn.discordapp.com/");
  const roleLabel = profile?.role === "admin" ? "Wahlleitung" : "Bürger";
  const joinedAt = profile?.created_at ?? user?.created_at;
  const initials = displayName.slice(0, 1).toUpperCase();

  const errorMessage =
    error === "discord"
      ? "Die Discord-Anmeldung konnte nicht gestartet werden. Prüfe den Provider in Supabase."
      : error === "auth"
        ? "Die Anmeldung ist fehlgeschlagen. Prüfe die Redirect-URL in Supabase und im Discord-Portal."
        : error === "config"
          ? "Supabase ist noch nicht konfiguriert."
          : null;

  return (
    <>
      <section className="border-b border-border">
        <Container className="py-12 sm:py-16">
          <Badge tone="accent">Konto</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text sm:text-5xl">
            Profil
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            Mit Discord anmelden, um abzustimmen, zu unterschreiben und zu
            kandidieren.
          </p>
        </Container>
      </section>

      <Container className="py-10 sm:py-14">
        {errorMessage ? (
          <Card className="mb-3 border-danger/30 bg-danger/5 p-4">
            <p className="text-sm font-medium text-danger">Anmeldung</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {errorMessage}
            </p>
          </Card>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            <Card className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-4">
                {hasDiscordAvatar && avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt=""
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-full border border-border"
                  />
                ) : (
                  <Avatar initials={initials} size="lg" />
                )}
                <div>
                  <p className="text-lg font-semibold tracking-tight text-text">
                    {displayName}
                  </p>
                  <p className="text-sm text-muted">
                    {user ? `Angemeldet · ${roleLabel}` : "Nicht angemeldet"}
                  </p>
                </div>
                {user ? (
                  <Badge className="ml-auto" tone="success">
                    Angemeldet
                  </Badge>
                ) : (
                  <Badge
                    className="ml-auto"
                    tone={configured ? "default" : "warning"}
                  >
                    {configured ? "Nicht angemeldet" : "Demo"}
                  </Badge>
                )}
              </div>

              <div className="mt-6 border-t border-border pt-6">
                {!configured ? (
                  <>
                    <p className="text-sm font-medium text-text">
                      Supabase ist noch nicht konfiguriert
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      Trage `NEXT_PUBLIC_SUPABASE_URL` und
                      `NEXT_PUBLIC_SUPABASE_ANON_KEY` ein. Bis dahin bleiben
                      Abstimmungen und Unterschriften lokale Demo-Daten.
                    </p>
                    <button
                      type="button"
                      disabled
                      className="mt-5 inline-flex h-11 cursor-not-allowed items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-accent-contrast opacity-40"
                    >
                      Anmeldung folgt
                    </button>
                    <DiscordLink
                      label="Discord beitreten"
                      className={buttonClasses("secondary", "sm", "mt-4")}
                    />
                  </>
                ) : user ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-text">
                          Discord-Konto verbunden
                        </p>
                        {joinedAt ? (
                          <p className="mt-1 text-xs text-faint">
                            Dabei seit {formatDate(joinedAt)}
                          </p>
                        ) : null}
                      </div>
                      <form action={signOut}>
                        <button
                          type="submit"
                          className={buttonClasses("ghost", "sm")}
                        >
                          Abmelden
                        </button>
                      </form>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-border bg-surface-2/40 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-faint">
                          Stimmen
                        </p>
                        {votes.length > 0 ? (
                          <ul className="mt-3 space-y-3">
                            {votes.map((vote) => {
                              const election = electionList.find(
                                (entry) => entry.id === vote.election_id,
                              );
                              const option =
                                election?.candidates.find(
                                  (candidate) => candidate.id === vote.option_id,
                                )?.name ??
                                partyList.find(
                                  (party) => party.id === vote.option_id,
                                )?.name ??
                                vote.option_id;

                              return (
                                <li key={`${vote.election_id}-${vote.created_at}`}>
                                  <p className="text-sm font-medium text-text">
                                    {election?.title ?? vote.election_id}
                                  </p>
                                  <p className="mt-0.5 text-xs text-muted">
                                    {option} · {formatDate(vote.created_at)}
                                  </p>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="mt-3 text-sm text-muted">
                            Noch keine Stimme abgegeben.
                          </p>
                        )}
                      </div>

                      <div className="rounded-xl border border-border bg-surface-2/40 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-faint">
                          Unterschriften
                        </p>
                        {signatures.length > 0 ? (
                          <ul className="mt-3 space-y-3">
                            {signatures.map((signature) => {
                              const initiative = initiativeList.find(
                                (entry) => entry.id === signature.initiative_id,
                              );

                              return (
                                <li
                                  key={`${signature.initiative_id}-${signature.created_at}`}
                                >
                                  <p className="text-sm font-medium text-text">
                                    {initiative?.title ??
                                      signature.initiative_id}
                                  </p>
                                  <p className="mt-0.5 text-xs text-muted">
                                    {formatDate(signature.created_at)}
                                  </p>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="mt-3 text-sm text-muted">
                            Noch kein Bürgerbegehren unterschrieben.
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-text">
                      Anmeldung über Discord
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      Die Anmeldung läuft über den Discord-Server. Dabei werden
                      Discord-ID, Anzeigename und Avatar übernommen. Eine Stimme
                      pro Wahl und Bürger.
                    </p>
                    <form action={signInWithDiscord}>
                      <button
                        type="submit"
                        className={buttonClasses("primary", "md", "mt-5")}
                      >
                        Mit Discord anmelden
                      </button>
                    </form>
                    <DiscordLink
                      label="Discord beitreten"
                      className={buttonClasses("secondary", "sm", "mt-3")}
                    />
                  </>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-3">
            {[
              {
                icon: <IconVote className="h-4 w-4" />,
                title: "Abstimmen",
                text: "Eine Stimme pro Wahl, serverseitig gespeichert.",
              },
              {
                icon: <IconUsers className="h-4 w-4" />,
                title: "Unterschreiben",
                text: "Bürgerbegehren unterstützen und Fortschritt verfolgen.",
              },
              {
                icon: <IconShield className="h-4 w-4" />,
                title: "Kandidieren",
                text: "Programm einreichen und zur Wahl antreten.",
              },
            ].map((item) => (
              <Card key={item.title} className="flex gap-3 p-4">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-surface-2 text-faint">
                  {item.icon}
                </span>
                <div>
                  <p className="text-sm font-medium text-text">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">
                    {item.text}
                  </p>
                </div>
              </Card>
            ))}

            <Card className="border-success/30 bg-success/5 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-text">
                <IconCheck className="h-4 w-4 text-success" />
                Rolle „{roleLabel}“
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Voraussetzung für Wahlen und Bürgerbegehren.
              </p>
            </Card>
          </div>
        </div>
      </Container>
    </>
  );
}
