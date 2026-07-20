import { describe, it, expect } from 'vitest';
import { CotisationPaymentEngine } from './CotisationPaymentEngine';

describe('CotisationPaymentEngine.compute', () => {
  it('unpaid quand aucun versement', () => {
    const r = CotisationPaymentEngine.compute(10000, 0);
    expect(r.status).toBe('unpaid');
    expect(r.verrouille).toBe(false);
    expect(r.solde).toBe(10000);
  });

  it('partial quand versement inférieur au dû', () => {
    const r = CotisationPaymentEngine.compute(10000, 4000);
    expect(r.status).toBe('partial');
    expect(r.solde).toBe(6000);
    expect(r.verrouille).toBe(false);
  });

  it('paid + verrouille quand versement égal ou supérieur', () => {
    const r = CotisationPaymentEngine.compute(10000, 10000);
    expect(r.status).toBe('paid');
    expect(r.verrouille).toBe(true);
    expect(r.solde).toBe(0);
  });

  it('paid également si surplus versé (jamais de solde négatif)', () => {
    const r = CotisationPaymentEngine.compute(10000, 15000);
    expect(r.status).toBe('paid');
    expect(r.solde).toBe(0);
  });

  it('gère les valeurs négatives ou invalides', () => {
    const r = CotisationPaymentEngine.compute(-500, -100);
    expect(r.montant_du).toBe(0);
    expect(r.montant_paye).toBe(0);
    expect(r.status).toBe('unpaid');
  });
});

describe('CotisationPaymentEngine.computeBeneficiaireExpected', () => {
  it('applique la formule mensuel × mois', () => {
    expect(CotisationPaymentEngine.computeBeneficiaireExpected(2000, 12)).toBe(24000);
  });

  it('force un minimum de 1 mois', () => {
    expect(CotisationPaymentEngine.computeBeneficiaireExpected(2000, 0)).toBe(2000);
  });
});
