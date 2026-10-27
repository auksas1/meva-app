
import { describe, it, expect } from 'vitest';
import {
  dedupedPartCosts,
  totalActualSpent,
} from '../src/utils/sessionCostMetrics';
import type { AnalysisSession } from '../src/types/analysis';

// Sukuriame tik funkcijoms reikalingus testinius duomenis
function makeSession(data: object): AnalysisSession {
  return data as AnalysisSession;
}

describe('dedupedPartCosts', () => {
  it('1. Grąžina tuščią Map, kai nėra nuotraukų', () => {
    const session = makeSession({ photos: [] });

    expect(dedupedPartCosts(session).size).toBe(0);
  });

  it('2. Grąžina vienos detalės kainą', () => {
    const session = makeSession({
      photos: [{
        result: {
          affected_parts: [
            { name: 'Bumper', estimated_cost: 200 },
          ],
        },
      }],
    });

    expect(dedupedPartCosts(session).get('Bumper')).toBe(200);
  });

  it('3. Pasirenka didžiausią pasikartojančios detalės kainą', () => {
    const session = makeSession({
      photos: [
        {
          result: {
            affected_parts: [
              { name: 'Door', estimated_cost: 150 },
            ],
          },
        },
        {
          result: {
            affected_parts: [
              { name: 'Door', estimated_cost: 300 },
            ],
          },
        },
      ],
    });

    const result = dedupedPartCosts(session);

    expect(result.get('Door')).toBe(300);
    expect(result.size).toBe(1);
  });

  it('4. Išsaugo skirtingas detales', () => {
    const session = makeSession({
      photos: [{
        result: {
          affected_parts: [
            { name: 'Hood', estimated_cost: 400 },
            { name: 'Bumper', estimated_cost: 200 },
          ],
        },
      }],
    });

    expect(dedupedPartCosts(session).size).toBe(2);
  });

  it('5. Ignoruoja detales be skaitinės kainos', () => {
    const session = makeSession({
      photos: [{
        result: {
          affected_parts: [
            { name: 'Door' },
            { name: 'Hood', estimated_cost: 'unknown' },
          ],
        },
      }],
    });

    expect(dedupedPartCosts(session).size).toBe(0);
  });

  
  it('6. Grąžina tuščią Map, kai affected_parts nenurodytas', () => {
    const session = makeSession({
      photos: [{
        result: {}
      }]
    });

    expect(dedupedPartCosts(session).size).toBe(0);
  });

  
  it('7. Ignoruoja skaitine eilute pateikta kaina', () => {
    const session = makeSession({
      photos: [{
        result: {
          affected_parts: [
            { name: 'Door', estimated_cost: '250' }
          ]
        }
      }]
    });

    expect(dedupedPartCosts(session).size).toBe(0);
  });

  it('8. Nepakeicia didesnes kainos mazesne', () => {
    const session = makeSession({
      photos: [
        {
          result: {
            affected_parts: [
              { name: 'Bumper', estimated_cost: 300 }
            ]
          }
        },
        {
          result: {
            affected_parts: [
              { name: 'Bumper', estimated_cost: 150 }
            ]
          }
        }
      ]
    });

    expect(dedupedPartCosts(session).get('Bumper')).toBe(300);
  });


});

describe('totalActualSpent', () => {
  it('1. Grąžina null, kai nėra remontų', () => {
    const session = makeSession({ repairs: [] });

    expect(totalActualSpent(session)).toBeNull();
  });

  it('2. Grąžina null, kai repairs nenurodytas', () => {
    const session = makeSession({});

    expect(totalActualSpent(session)).toBeNull();
  });

  it('3. Susumuoja kelių remontų kainas', () => {
    const session = makeSession({
      repairs: [
        { actualCost: 100 },
        { actualCost: 250 },
      ],
    });

    expect(totalActualSpent(session)).toBe(350);
  });

  it('4. Ignoruoja remontą be kainos', () => {
    const session = makeSession({
      repairs: [
        { actualCost: 100 },
        { actualCost: undefined },
      ],
    });

    expect(totalActualSpent(session)).toBe(100);
  });

  it('5. Priima nulinę remonto kainą', () => {
    const session = makeSession({
      repairs: [{ actualCost: 0 }],
    });

    expect(totalActualSpent(session)).toBe(0);
  });
});
