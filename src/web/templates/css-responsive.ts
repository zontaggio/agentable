export const APP_CSS_RESPONSIVE = `
@media (max-width: 1050px) {
  .analytics-grid {
    grid-template-columns: 1fr;
  }

  .action-grid {
    grid-template-columns: 1fr;
  }

  .modal-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  #app {
    padding: 14px 12px 30px;
  }

  .hero,
  .analytics-card {
    padding: 14px;
  }

  .repo-name {
    font-size: 22px;
  }

  .category-name,
  .category-score {
    font-size: 20px;
  }

  .card-name {
    font-size: 17px;
  }

  .modal-title {
    font-size: 28px;
  }

  .summary-line {
    flex-direction: column;
    gap: 6px;
  }

  .category-head {
    grid-template-columns: auto 1fr auto auto;
  }

  .category-head .accordion-indicator {
    display: none;
  }
}
`;
