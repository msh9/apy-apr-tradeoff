import { css } from 'lit';

const tradeoffWidgetStyles = css`
  :host {
    display: block;
    --base03: #002b36;
    --base02: #073642;
    --base01: #586e75;
    --base00: #657b83;
    --base0: #839496;
    --base1: #93a1a1;
    --base2: #eee8d5;
    --base3: #fdf6e3;
    --yellow: #b58900;
    --orange: #cb4b16;
    --red: #dc322f;
    --magenta: #d33682;
    --violet: #6c71c4;
    --blue: #268bd2;
    --cyan: #2aa198;
    --green: #859900;
  }

  .tradeoff-shell {
    display: grid;
    gap: 18px;
    color: var(--base0);
    background: var(--base03);
    padding: 18px;
    border-radius: 14px;
    border: 1px solid var(--base02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  }

  .intro h1 {
    margin: 4px 0;
    font-size: 2rem;
    color: var(--base1);
  }

  .eyebrow {
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: .75rem;
    color: var(--base00);
  }

  .solar-card {
    background: var(--base02);
    border: 1px solid var(--base01);
    border-radius: 12px;
    padding: 16px;
  }

  .global-card {
    display: grid;
    gap: 12px;
  }

  .timing-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;
    align-items: end;
  }

  .cards-wrapper {

  }

  .cards-wrapper > * {
    min-width: 0;
  }

  .loan-savings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
  }

  .option-card {
    background: var(--base02);
    border: 1px solid var(--base01);
    border-radius: 12px;
    padding: 16px;
    display: grid;
    gap: 10px;
    min-height: 100%;
  }

  .loan-card {
    border-top: 4px solid var(--orange);
  }

  .savings-card {
    border-top: 4px solid var(--green);
  }

  .card-card {
    border-top: 4px solid var(--violet);
  }

  .pill-link {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .strategy-pill {
    background: linear-gradient(
      90deg,
      var(--orange) 0%,
      var(--orange) 50%,
      var(--green) 50%,
      var(--green) 100%
    );
    color: var(--base3);
    padding: 6px 10px;
    border-radius: 999px;
    font-weight: 700;
    font-size: .75rem;
    letter-spacing: 0.1px;
    text-align: center;
    flex: 1 1 auto;
  }

  .card-heading h2 {
    margin: 0;
    color: var(--base1);
    font-size: 1.5rem;
  }

  .subtitle {
    margin: 2px 0 0 0;
    color: var(--base0);
    font-size: .8rem;
  }

  .field {
    display: grid;
    gap: 4px;
  }

  .field.compact {
    gap: 2px;
  }

  .field.inline-field {
    grid-template-columns: 1fr;
  }

  .field-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 10px;
  }

  label {
    font-weight: 700;
    font-size: 1rem;
    color: var(--base1);
  }

  .helper {
    margin: 0;
    color: var(--base0);
    font-size: .8rem;
  }

  input,
  select {
    background: var(--base03);
    border: 1px solid var(--base01);
    border-radius: 6px;
    padding: 10px;
    color: var(--base1);
    font-size: 1rem;
  }

  input:focus,
  select:focus {
    outline: 2px solid var(--blue);
    box-shadow: 0 0 0 2px rgba(38, 139, 210, 0.25);
  }

  .field-group {
    border: 1px dashed var(--base01);
    border-radius: 10px;
    padding: 10px;
    display: grid;
    gap: 8px;
    background: rgba(255, 255, 255, 0.02);
  }

  .group-label {
    margin: 0;
    font-weight: 700;
    color: var(--base0);
    letter-spacing: 0.02em;
    text-transform: uppercase;
    font-size: .9rem;
  }

  .mini-results {
    background: rgba(255, 255, 255, 0.02);
    border-radius: 10px;
    padding: 10px;
    display: grid;
    gap: 6px;
    border: 1px solid var(--base01);
  }

  .mini-results p {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    color: var(--base1);
    font-size: .9rem;
  }

  .mini-results .label {
    color: var(--base0);
    font-weight: 600;
  }

  .summary-card {
    display: grid;
    gap: 10px;
  }

  .bullets {
    display: grid;
    gap: 4px;
    color: var(--base0);
  }

  .bullet-label {
    font-weight: 700;
    color: var(--base1);
    margin-right: 6px;
  }

  .muted {
    color: var(--base00);
  }

  .error {
    color: var(--red);
    min-height: 18px;
    margin: 0;
    font-size: .8rem;
  }

  @media (max-width: 960px) {
    .loan-savings-grid {
      grid-template-columns: 1fr;
    }

    .connector {
      display: none;
    }

    .mobile-connector {
      display: block;
    }
  }

  @media (prefers-color-scheme: light) {
    .tradeoff-shell {
      background: var(--base3);
      color: var(--base00);
      border-color: var(--base2);
    }

    .solar-card,
    .option-card {
      background: var(--base2);
      border-color: var(--base1);
    }

    input,
    select {
      background: var(--base3);
      color: var(--base00);
      border-color: var(--base1);
    }

    .mini-results {
      background: rgba(0, 0, 0, 0.03);
    }
  }
`;

export { tradeoffWidgetStyles };
