/*
 * Word pools for word-sequence tests (Classic mode) and Rush mode.
 * Each pool is a plain space separated list so new words are easy to add.
 */

const pool = (list: string): string[] => Array.from(new Set(list.trim().split(/\s+/)))

/** Frequent, short everyday words. */
export const commonWords = pool(`
  the be to of and a in that have it for not on with he as you do at this but his by from they we say her
  she or an will my one all would there their what so up out if about who get which go me when make can like
  time no just him know take people into year your good some could them see other than then now look only
  come its over think also back after use two how our work first well way even new want because any these
  give day most us thing man find here many long down life still own hand part place last child world school
  great small large next early young old right left high low few public same able end point home water room
  mother area money story fact month lot study book eye job word issue side kind head house service friend
  father power hour game line member law car city name team minute idea kid body face others level office door
  health person art war history party result change morning reason research girl guy moment air teacher force
  open walk win offer remember love consider appear buy wait serve die send expect build stay fall cut reach
  kill remain suggest raise pass sell require report decide pull return explain hope develop carry break
  receive agree support hit produce eat cover catch draw choose cause point listen begin real sure free
  better true whole clear easy hard late full simple strong ready short light dark warm cold quick quiet
  bright fresh slow fast soft plain calm wide deep rich thin fine happy close heavy
  river stone cloud green paper music garden table window river letter road field summer winter spring
  morning evening night street market bread coffee train ticket island forest bridge candle mirror pencil
  orange yellow purple silver golden simple honest gentle careful sudden steady rapid distant ancient modern
`)

/** Longer, less frequent words used to raise the difficulty. */
export const advancedWords = pool(`
  accomplish adventure algorithm ambitious analysis approximate architecture atmosphere authentic balance
  boundary brilliant calendar capacity celebrate character chemistry circumstance collaborate committee
  comfortable community comparison complicated concentrate confidence consequence considerable continuous
  conversation curiosity database deliberate democracy determine development different dimension discipline
  discovery distribute efficient electricity elephant emphasis encourage engineering enormous environment
  equipment establish evaluate evidence exaggerate excellent experience experiment explanation expression
  extraordinary fascinating flexibility frequency fundamental generation geography gradually guarantee
  harmony horizon hypothesis identical imagination immediately important improvement independent individual
  information infrastructure ingredient initiative innovation instrument intelligence interesting interface
  interpretation investigate journey keyboard knowledge landscape laboratory language literature magnificent
  maintenance mathematics measurement mechanism memorable microscope migration miniature momentum mountain
  narrative necessary negotiate neighborhood nevertheless observation obstacle occasionally opportunity
  orchestra organization original paragraph parameter particular patience perspective phenomenon philosophy
  photograph possibility potential practical precision preference preparation principle priority probability
  procedure professional programming progress pronunciation proportion psychology publication quantity
  question recognize recommend reflection relationship remarkable represent reputation resilience resource
  responsibility restaurant rhythm satellite schedule scientific sentence separate significant simplicity
  situation sophisticated strategy structure substantial successful sufficient surprising sustainable
  symphony technology telescope temperature territory thoughtful tradition transform translation transparent
  tremendous understanding universe valuable variable vegetable velocity vocabulary volunteer wilderness
`)

export type RushTier = 1 | 2 | 3 | 4

const byLength = (min: number, max: number) =>
  [...commonWords, ...advancedWords].filter((word) => word.length >= min && word.length <= max)

/** Rush mode word tiers, from short warm-up words to long challenging ones. */
export const rushTiers: Record<RushTier, string[]> = {
  1: byLength(2, 4),
  2: byLength(4, 6),
  3: byLength(6, 9),
  4: byLength(8, 16),
}
