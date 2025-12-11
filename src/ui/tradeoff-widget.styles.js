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
    font-family:
      'IBM Plex Sans',
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      sans-serif;
  }

  .intro h1 {
    margin: 4px 0;
    font-size: 28px;
    color: var(--base1);
  }

  .eyebrow {
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 12px;
    color: var(--base00);
  }

  .lede {
    margin: 0;
    color: var(--base0);
    font-size: 16px;
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

  .global-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 12px;
  }

  .timing-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;
    align-items: end;
  }

  .cards-wrapper {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    align-items: start;
  }

  .option-card {
    background: var(--base02);
    border: 1px solid var(--base01);
    border-radius: 12px;
    padding: 16px;
    display: grid;
    gap: 10px;
    min-height: 100%;
    position: relative;
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
    font-size: 13px;
    letter-spacing: 0.1px;
    text-align: center;
    flex: 1 1 auto;
  }

  .option-tag {
    background: var(--base01);
    color: var(--base3);
    padding: 6px 10px;
    border-radius: 10px;
    font-weight: 700;
    font-size: 12px;
    white-space: nowrap;
  }

  .option-tag.subtle {
    background: var(--base00);
    color: var(--base3);
  }

  .card-heading h2 {
    margin: 0;
    color: var(--base1);
    font-size: 20px;
  }

  .subtitle {
    margin: 2px 0 0 0;
    color: var(--base0);
    font-size: 14px;
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
    font-size: 15px;
    color: var(--base1);
  }

  .helper {
    margin: 0;
    color: var(--base0);
    font-size: 13px;
  }

  input,
  select {
    background: var(--base03);
    border: 1px solid var(--base01);
    border-radius: 6px;
    padding: 10px;
    color: var(--base1);
    font-size: 15px;
    font-family:
      'IBM Plex Sans',
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      sans-serif;
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
    font-size: 12px;
  }

  .checkbox-row {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 14px;
    color: var(--base0);
  }

  .checkbox-row input {
    width: 18px;
    height: 18px;
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
    font-size: 14px;
  }

  .mini-results .label {
    color: var(--base0);
    font-weight: 600;
  }

  .connector {
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--base0);
    font-size: 13px;
    letter-spacing: 0.02em;
  }

  .connector span {
    padding: 6px 10px;
    border: 1px dashed var(--base01);
    border-radius: 999px;
  }

  .mobile-connector {
    display: none;
    color: var(--base0);
    background: rgba(133, 153, 0, 0.12);
    border: 1px solid var(--green);
    border-radius: 8px;
    padding: 8px;
    font-size: 13px;
  }

  .summary-card {
    display: grid;
    gap: 10px;
  }

  .summary-headline {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: var(--base1);
  }

  .chip {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    justify-self: end;
  }

  .chip.positive {
    background: var(--green);
  }

  .chip.caution {
    background: var(--orange);
  }

  .chip.baseline {
    background: var(--blue);
  }

  .chip.neutral {
    background: var(--base00);
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
    font-size: 13px;
  }

  @media (max-width: 960px) {
    .cards-wrapper {
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
