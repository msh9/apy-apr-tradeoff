// Placeholder web component definition; wire Lit-based UI once math helpers exist.
export class LoanComparisonPlaceholder extends HTMLElement {
  connectedCallback() {
    this.textContent = 'Loan comparison component placeholder';
  }
}

customElements.define('loan-comparison-placeholder', LoanComparisonPlaceholder);
