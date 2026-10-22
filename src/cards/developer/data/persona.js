/**
 * Personal voice for the Developer card (used by the intro and sign-off scenes).
 *
 * This is the ONLY place that holds hand-written text. Everything else on the card
 * (scores, streaks, languages, peak day, ...) comes from live GitHub data.
 * Edit the values below, or override per-embed with query params:
 *   ?tagline=Building+things+that+move   ?call=Thang
 */
export const PERSONA = {
  /** How the character introduces themself in the sign-off bubble ("Hi, I'm <callName>."). */
  callName: 'Thang',
  /** One-line promise shown in the sign-off bubble. Keep it under ~34 characters. */
  tagline: 'I build things that move.',
};
