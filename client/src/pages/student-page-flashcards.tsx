import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Check, Volume2 } from "lucide-react";
import { markedParts } from "@shared/lesson-expressions";
import { studentPagePath, type PracticeResult, type StudentFlashcard, type StudentFlashcardDeck } from "@shared/student-page";
import { getStudentPage, sendFlashcardResult, studentPageUrls } from "@/lib/student-page-api";
import {
  BackLink,
  KindTag,
  StudentPageFrame,
  StudentPageLoading,
  StudentPageProblem,
  useStudentPageTitle,
} from "@/components/student-page/student-page-layout";

const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";

function say(text: string) {
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "en-GB";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(speech);
}

/** An example sentence with the word (marked **like this** in the lesson) highlighted. */
function Example({ text, word }: { text: string; word: string }) {
  return (
    <p className="text-lg font-normal leading-relaxed">
      {markedParts(text, word).map((part, index) =>
        part.marked ? (
          <strong key={index} className="rounded bg-yellow-100 px-1 font-bold">{part.text}</strong>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </p>
  );
}

/**
 * Flashcards from the student's own words: the word first, then its meaning
 * and example. Each answer is saved as it is given, so a session can stop at
 * any card.
 */
export default function StudentPageFlashcardsPage() {
  const { token } = useParams<{ token: string }>();
  const urls = studentPageUrls(token);
  const page = studentPagePath(token);
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useQuery<StudentFlashcardDeck>({
    queryKey: [urls.flashcards],
    queryFn: () => getStudentPage<StudentFlashcardDeck>(urls.flashcards),
    // One deck per visit: refetching mid-session would reshuffle it.
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
  useStudentPageTitle("Flashcards");

  const [deck, setDeck] = useState<StudentFlashcard[] | null>(null);
  const [position, setPosition] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [gotCount, setGotCount] = useState(0);
  const [again, setAgain] = useState<StudentFlashcard[]>([]);
  const [brokenPictures, setBrokenPictures] = useState<Set<number>>(new Set());
  const [notSaved, setNotSaved] = useState(false);

  useEffect(() => {
    if (data && deck === null) setDeck(data.cards);
  }, [data, deck]);

  // The page and word list show practice progress, so refresh them after practising.
  useEffect(() => () => {
    queryClient.invalidateQueries({ queryKey: [urls.home] });
    queryClient.invalidateQueries({ queryKey: [urls.words] });
  }, [queryClient, urls.home, urls.words]);

  if (isLoading || (data && deck === null)) return <StudentPageLoading />;
  if (error || !data || !deck) return <StudentPageProblem error={error} backHref={page} />;

  const card = deck[position];
  const finished = position >= deck.length;

  const answer = (result: PracticeResult) => {
    sendFlashcardResult(token, card.id, result).catch(() => setNotSaved(true));
    if (result === "got") setGotCount((count) => count + 1);
    else setAgain((cards) => [...cards, card]);
    setPosition((current) => current + 1);
    setFlipped(false);
  };

  const practiseAgain = () => {
    setDeck(again);
    setPosition(0);
    setGotCount(0);
    setAgain([]);
    setFlipped(false);
  };

  const cardClass = "flex flex-1 flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-md";
  const picture = card?.imageUrl && !brokenPictures.has(card.id) ? card.imageUrl : null;

  return (
    <StudentPageFrame>
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-col gap-3 px-5 pb-4 pt-3">
          <div className="flex items-center justify-between">
            <BackLink href={page} label="My page" />
            {deck.length > 0 && (
              <span className="text-sm font-semibold text-gray-600" aria-live="polite">
                {finished ? "All done" : `Card ${position + 1} of ${deck.length}`}
              </span>
            )}
          </div>
          {deck.length > 0 && (
            <div className="h-2 overflow-hidden rounded-full bg-gray-200" aria-hidden="true">
              <div className="h-full rounded-full bg-brand-yellow transition-all" style={{ width: `${Math.round((Math.min(position, deck.length) / deck.length) * 100)}%` }} />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col px-5 pb-6">
          {deck.length === 0 && (
            <div className={`${cardClass} items-center justify-center text-center`}>
              <h1 className="font-nunito text-2xl font-extrabold">All done for now!</h1>
              <p className="text-base font-normal text-gray-600">
                You've practised all your words. More cards will be ready soon.
              </p>
              <BackLink href={page} label="Back to my page" />
            </div>
          )}

          {card && !flipped && (
            <div className={cardClass}>
              {picture && (
                <img
                  src={picture}
                  alt="Picture from your lesson"
                  className="h-56 w-full rounded-2xl bg-gray-50 object-contain"
                  onError={() => setBrokenPictures((ids) => new Set(ids).add(card.id))}
                />
              )}
              <div className="flex flex-wrap items-center gap-2">
                <KindTag kind={card.kind} />
                {card.partOfSpeech && <span className="text-sm font-normal text-gray-600">{card.partOfSpeech}</span>}
              </div>
              <h1 className="break-words font-nunito text-4xl font-extrabold leading-tight">{card.word}</h1>
              {canSpeak() && (
                <button
                  type="button"
                  onClick={() => say(card.word)}
                  className="flex min-h-11 items-center gap-2 self-start rounded-full border border-gray-300 bg-white px-4 text-base font-semibold"
                >
                  <Volume2 className="h-5 w-5" aria-hidden="true" />
                  Hear it
                </button>
              )}
              <p className="text-base font-normal text-gray-600">Do you remember what it means?</p>
              <button
                type="button"
                onClick={() => setFlipped(true)}
                className="mt-auto min-h-[54px] rounded-xl bg-brand-navy text-lg font-bold text-white hover:bg-brand-navy-light"
              >
                Show the meaning
              </button>
            </div>
          )}

          {card && flipped && (
            <div className={cardClass}>
              <div>
                <KindTag kind={card.kind} />
              </div>
              <h1 className="break-words font-nunito text-3xl font-extrabold leading-tight">{card.word}</h1>
              {card.meaning && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Meaning</span>
                  <p className="text-xl font-semibold leading-snug">{card.meaning}</p>
                </div>
              )}
              {card.example && (
                <div className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Example</span>
                  <Example text={card.example} word={card.word} />
                </div>
              )}
              {card.lessonTitle && <p className="text-sm font-normal text-gray-600">From your lesson: {card.lessonTitle}</p>}
              <p className="mt-auto text-center text-base font-semibold">Did you know it?</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => answer("again")}
                  className="min-h-[54px] flex-1 rounded-xl border-2 border-amber-600 bg-amber-50 text-lg font-bold text-amber-900"
                >
                  Not yet
                </button>
                <button
                  type="button"
                  onClick={() => answer("got")}
                  className="min-h-[54px] flex-1 rounded-xl bg-green-700 text-lg font-bold text-white hover:bg-green-800"
                >
                  Got it
                </button>
              </div>
            </div>
          )}

          {finished && deck.length > 0 && (
            <div className={`${cardClass} items-center justify-center text-center`}>
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-700">
                <Check className="h-10 w-10" strokeWidth={2.5} aria-hidden="true" />
              </span>
              <h1 className="font-nunito text-3xl font-extrabold">Nice work!</h1>
              <dl className="grid w-full grid-cols-2 gap-3">
                <div className="flex flex-col rounded-2xl border border-green-200 bg-green-50 p-4">
                  <dt className="order-last text-sm font-medium text-green-800">Got it</dt>
                  <dd className="font-nunito text-3xl font-extrabold text-green-700">{gotCount}</dd>
                </div>
                <div className="flex flex-col rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <dt className="order-last text-sm font-medium text-amber-900">Not yet</dt>
                  <dd className="font-nunito text-3xl font-extrabold text-amber-900">{again.length}</dd>
                </div>
              </dl>
              <p className="text-base font-normal text-gray-700">
                Cards you marked "Not yet" come back sooner. The others come back in a few days.
              </p>
              {again.length > 0 && (
                <button
                  type="button"
                  onClick={practiseAgain}
                  className="min-h-[52px] w-full rounded-xl bg-brand-yellow text-lg font-bold text-brand-navy hover:bg-brand-yellow-light"
                >
                  {again.length === 1 ? "Practise that card again" : `Practise those ${again.length} again`}
                </button>
              )}
              <Link
                href={page}
                className="flex min-h-[52px] w-full items-center justify-center rounded-xl border-2 border-brand-navy text-base font-bold text-brand-navy"
              >
                Back to my page
              </Link>
            </div>
          )}

          {notSaved && (
            <p className="mt-3 text-center text-sm font-normal text-amber-900" role="status">
              Some answers weren't saved. Please check your internet connection.
            </p>
          )}
        </div>
      </div>
    </StudentPageFrame>
  );
}
