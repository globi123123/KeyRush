import { defineQuotes, type Quote } from './types'

/*
 * Quotations are public-domain texts with well-documented sources.
 * Entries without an author are original KeyRush passages and are shown as such.
 * Punctuation is normalized to characters found on a standard keyboard.
 */

const motivation = defineQuotes('motivation', [
  {
    text: 'Well done is better than well said.',
    author: 'Benjamin Franklin',
    source: "Poor Richard's Almanack, 1737",
  },
  {
    text: 'Diligence is the mother of good luck.',
    author: 'Benjamin Franklin',
    source: "Poor Richard's Almanack",
  },
  {
    text: 'It is not the critic who counts; not the man who points out how the strong man stumbles, or where the doer of deeds could have done them better. The credit belongs to the man who is actually in the arena, whose face is marred by dust and sweat and blood; who strives valiantly; who errs, who comes short again and again, because there is no effort without error and shortcoming; but who does actually strive to do the deeds.',
    author: 'Theodore Roosevelt',
    source: 'Citizenship in a Republic, 1910',
  },
  {
    text: 'Far better is it to dare mighty things, to win glorious triumphs, even though checkered by failure, than to take rank with those poor spirits who neither enjoy much nor suffer much, because they live in the gray twilight that knows not victory nor defeat.',
    author: 'Theodore Roosevelt',
    source: 'The Strenuous Life, 1899',
  },
  {
    text: 'I learned this, at least, by my experiment: that if one advances confidently in the direction of his dreams, and endeavors to live the life which he has imagined, he will meet with a success unexpected in common hours.',
    author: 'Henry David Thoreau',
    source: 'Walden, 1854',
  },
  {
    text: 'Trust thyself: every heart vibrates to that iron string.',
    author: 'Ralph Waldo Emerson',
    source: 'Self-Reliance, 1841',
  },
  {
    text: 'Nothing great was ever achieved without enthusiasm.',
    author: 'Ralph Waldo Emerson',
    source: 'Circles, 1841',
  },
  {
    text: 'Hope is the thing with feathers that perches in the soul, and sings the tune without the words, and never stops at all.',
    author: 'Emily Dickinson',
    source: 'Hope is the thing with feathers, c. 1861',
  },
  {
    text: 'Progress is rarely loud. It looks like one more page, one more lap, one more honest attempt on a day when nobody is watching.',
  },
  {
    text: 'You do not need to feel ready to begin. Most people only feel ready after they have already started, somewhere between the first clumsy attempt and the tenth slightly better one.',
  },
])

const philosophy = defineQuotes('philosophy', [
  {
    text: 'The unexamined life is not worth living.',
    author: 'Socrates',
    source: "Plato's Apology",
  },
  {
    text: 'I think, therefore I am.',
    author: 'Rene Descartes',
    source: 'Discourse on the Method, 1637',
  },
  {
    text: 'Man is born free; and everywhere he is in chains.',
    author: 'Jean-Jacques Rousseau',
    source: 'The Social Contract, 1762',
  },
  {
    text: 'No longer talk at all about the kind of man that a good man ought to be, but be such.',
    author: 'Marcus Aurelius',
    source: 'Meditations, translated by George Long',
  },
  {
    text: 'Such as are thy habitual thoughts, such also will be the character of thy mind; for the soul is dyed by the thoughts.',
    author: 'Marcus Aurelius',
    source: 'Meditations, translated by George Long',
  },
  {
    text: 'There is nothing either good or bad, but thinking makes it so.',
    author: 'William Shakespeare',
    source: 'Hamlet',
  },
  {
    text: 'Is it not pleasant to learn with a constant perseverance and application?',
    author: 'Confucius',
    source: 'The Analects, translated by James Legge',
  },
  {
    text: 'A journey of a thousand miles begins with a single step.',
    author: 'Laozi',
    source: 'Tao Te Ching, chapter 64',
  },
  {
    text: 'It is not that we have a short space of time, but that we waste much of it.',
    author: 'Seneca',
    source: 'On the Shortness of Life',
  },
  {
    text: 'And the life of man, solitary, poor, nasty, brutish, and short.',
    author: 'Thomas Hobbes',
    source: 'Leviathan, 1651',
  },
  {
    text: 'Certainty is comfortable, but curiosity is where thinking actually happens. A question held open a little longer often teaches more than an answer accepted too soon, because the waiting forces you to look at the problem from more than one side.',
  },
])

const science = defineQuotes('science', [
  {
    text: 'If I have seen further it is by standing on the shoulders of Giants.',
    author: 'Isaac Newton',
    source: 'Letter to Robert Hooke, 1675',
  },
  {
    text: 'In the fields of observation chance favors only the prepared mind.',
    author: 'Louis Pasteur',
    source: 'Lecture at the University of Lille, 1854',
  },
  {
    text: 'There is grandeur in this view of life, with its several powers, having been originally breathed into a few forms or into one; and that, whilst this planet has gone cycling on according to the fixed law of gravity, from so simple a beginning endless forms most beautiful and most wonderful have been, and are being, evolved.',
    author: 'Charles Darwin',
    source: 'On the Origin of Species, 1859',
  },
  {
    text: 'Ignorance more frequently begets confidence than does knowledge.',
    author: 'Charles Darwin',
    source: 'The Descent of Man, 1871',
  },
  {
    text: 'Nothing is too wonderful to be true, if it be consistent with the laws of nature.',
    author: 'Michael Faraday',
    source: 'Laboratory journal, 1849',
  },
  {
    text: 'When you can measure what you are speaking about, and express it in numbers, you know something about it; but when you cannot measure it, when you cannot express it in numbers, your knowledge is of a meagre and unsatisfactory kind.',
    author: 'William Thomson, Lord Kelvin',
    source: 'Electrical Units of Measurement, 1883',
  },
  {
    text: 'Nature, to be commanded, must be obeyed.',
    author: 'Francis Bacon',
    source: 'Novum Organum, 1620',
  },
  {
    text: 'Every measurement carries a small uncertainty, and good science says so out loud. Admitting what we do not know is not a weakness of the method; it is the method.',
  },
  {
    text: 'Somewhere right now, a researcher is repeating an experiment for the twentieth time, not because the first nineteen failed, but because one surprising result is not yet a discovery. Patience is the least glamorous instrument in any laboratory, and the one used most often.',
  },
])

const technology = defineQuotes('technology', [
  {
    text: 'The Analytical Engine weaves algebraical patterns just as the Jacquard-loom weaves flowers and leaves.',
    author: 'Ada Lovelace',
    source: 'Notes on the Analytical Engine, 1843',
  },
  {
    text: 'The Analytical Engine has no pretensions whatever to originate anything. It can do whatever we know how to order it to perform.',
    author: 'Ada Lovelace',
    source: 'Notes on the Analytical Engine, 1843',
  },
  {
    text: "On two occasions I have been asked, 'Pray, Mr. Babbage, if you put into the machine wrong figures, will the right answers come out?' I am not able rightly to apprehend the kind of confusion of ideas that could provoke such a question.",
    author: 'Charles Babbage',
    source: 'Passages from the Life of a Philosopher, 1864',
  },
  {
    text: 'Our inventions are wont to be pretty toys, which distract our attention from serious things. They are but improved means to an unimproved end, an end which it was already but too easy to arrive at.',
    author: 'Henry David Thoreau',
    source: 'Walden, 1854',
  },
  {
    text: 'We are in great haste to construct a magnetic telegraph from Maine to Texas; but Maine and Texas, it may be, have nothing important to communicate.',
    author: 'Henry David Thoreau',
    source: 'Walden, 1854',
  },
  {
    text: 'Printing, gunpowder, and the magnet: these three have changed the whole face and state of things throughout the world; the first in literature, the second in warfare, the third in navigation.',
    author: 'Francis Bacon',
    source: 'Novum Organum, 1620',
  },
  {
    text: 'Mr. Watson, come here, I want to see you.',
    author: 'Alexander Graham Bell',
    source: 'Laboratory notebook, March 10, 1876',
  },
  {
    text: 'Every piece of software is a pile of decisions made by people under deadlines. Reading old code with kindness, and leaving it a little clearer than you found it, is one of the quiet virtues of the craft.',
  },
  {
    text: 'The best tools disappear in your hands. You stop thinking about the keyboard, the editor, or the shortcut, and only the work remains.',
  },
])

const literature = defineQuotes('literature', [
  {
    text: 'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair.',
    author: 'Charles Dickens',
    source: 'A Tale of Two Cities, 1859',
  },
  {
    text: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
    author: 'Jane Austen',
    source: 'Pride and Prejudice, 1813',
  },
  {
    text: 'Call me Ishmael. Some years ago, never mind how long precisely, having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.',
    author: 'Herman Melville',
    source: 'Moby-Dick, 1851',
  },
  {
    text: 'Happy families are all alike; every unhappy family is unhappy in its own way.',
    author: 'Leo Tolstoy',
    source: 'Anna Karenina, translated by Constance Garnett',
  },
  {
    text: "All the world's a stage, and all the men and women merely players; they have their exits and their entrances, and one man in his time plays many parts.",
    author: 'William Shakespeare',
    source: 'As You Like It',
  },
  {
    text: 'We are such stuff as dreams are made on, and our little life is rounded with a sleep.',
    author: 'William Shakespeare',
    source: 'The Tempest',
  },
  {
    text: 'Two roads diverged in a wood, and I, I took the one less traveled by, and that has made all the difference.',
    author: 'Robert Frost',
    source: 'The Road Not Taken, 1916',
  },
  {
    text: "'Begin at the beginning,' the King said, very gravely, 'and go on till you come to the end: then stop.'",
    author: 'Lewis Carroll',
    source: "Alice's Adventures in Wonderland, 1865",
  },
  {
    text: "Why, sometimes I've believed as many as six impossible things before breakfast.",
    author: 'Lewis Carroll',
    source: 'Through the Looking-Glass, 1871',
  },
  {
    text: 'I am no bird; and no net ensnares me: I am a free human being with an independent will.',
    author: 'Charlotte Bronte',
    source: 'Jane Eyre, 1847',
  },
  {
    text: 'A thing of beauty is a joy for ever: its loveliness increases; it will never pass into nothingness.',
    author: 'John Keats',
    source: 'Endymion, 1818',
  },
])

const everyday = defineQuotes('everyday', [
  {
    text: 'Early to bed and early to rise, makes a man healthy, wealthy, and wise.',
    author: 'Benjamin Franklin',
    source: "Poor Richard's Almanack, 1735",
  },
  {
    text: 'Fish and visitors stink in three days.',
    author: 'Benjamin Franklin',
    source: "Poor Richard's Almanack, 1736",
  },
  {
    text: 'Lost time is never found again.',
    author: 'Benjamin Franklin',
    source: "Poor Richard's Almanack",
  },
  {
    text: 'I went to the woods because I wished to live deliberately, to front only the essential facts of life, and see if I could not learn what it had to teach, and not, when I came to die, discover that I had not lived.',
    author: 'Henry David Thoreau',
    source: 'Walden, 1854',
  },
  {
    text: 'Our life is frittered away by detail. An honest man has hardly need to count more than his ten fingers, or in extreme cases he may add his ten toes, and lump the rest. Simplicity, simplicity, simplicity!',
    author: 'Henry David Thoreau',
    source: 'Walden, 1854',
  },
  {
    text: 'I like work: it fascinates me. I can sit and look at it for hours.',
    author: 'Jerome K. Jerome',
    source: 'Three Men in a Boat, 1889',
  },
  {
    text: 'Annual income twenty pounds, annual expenditure nineteen nineteen and six, result happiness. Annual income twenty pounds, annual expenditure twenty pounds ought and six, result misery.',
    author: 'Charles Dickens',
    source: 'David Copperfield, 1850',
  },
  {
    text: 'One half of the world cannot understand the pleasures of the other.',
    author: 'Jane Austen',
    source: 'Emma, 1815',
  },
  {
    text: 'The years teach much which the days never know.',
    author: 'Ralph Waldo Emerson',
    source: 'Experience, 1844',
  },
  {
    text: 'A clean kitchen at night is a gift to the person you will be tomorrow morning. They will not thank you out loud, but they will notice.',
  },
  {
    text: 'The best conversations rarely happen at the dinner table. They happen while washing dishes, walking home, or sitting in a parked car, long after the engine is off and nobody wants to be the first to open the door.',
  },
])

export const quotes: Quote[] = [...motivation, ...philosophy, ...science, ...technology, ...literature, ...everyday]
