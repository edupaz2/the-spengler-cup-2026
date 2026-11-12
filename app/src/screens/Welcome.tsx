export function Welcome({ onContinue }: { onContinue(): void }) {
  return (
    <section class="opening">
      <p class="opening-label">Davos · 26 to 31 December</p>
      <img class="opening-art" src={`${import.meta.env.BASE_URL}art/trophy.webp`} alt="The Spengler Cup trophy" />
      <h1>The Spengler Cup</h1>
      <p>Six teams, six days, one trophy. A new deck of cards every morning.</p>
      <button type="button" class="primary" onClick={onContinue}>Open my first deck</button>
    </section>
  );
}
