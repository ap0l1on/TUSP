import { describe, it, expect } from 'vitest';
import { announcementICS } from '../src/lib/ics';
import { timetableCsvToJson } from '../scripts/timetable-csv-to-json';
import { menuCsvToJson } from '../scripts/menu-csv-to-json';
import { allKeys, missingKeys } from '../src/lib/i18n';
import { validateAll } from '../scripts/validate-data';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('menu states', () => {
  it('weekend/holiday/missing determined by caller data', async () => {
    const { weekdayOfISO } = await import('../src/lib/time');
    expect(weekdayOfISO('2026-10-04')).toBe(0);
    const menu = JSON.parse(readFileSync(join(__dirname, '..', 'public/data/menu.json'), 'utf8'));
    expect(menu.days['2026-10-04']).toBeUndefined();
    expect(menu.days['2026-09-28']).toBeDefined();
  });
});

describe('ics', () => {
  it('produces VCALENDAR with SUMMARY', () => {
    const ics = announcementICS(
      { id: 'a1', title: 'Test', body: 'hi', priority: 'normal', audience: ['all'], publish: '2026-09-28T07:00:00+03:00', expires: '2027-01-01T00:00:00+03:00', pinned: false },
      { id: 'e1', kind: 'conference', title: 'Konf', date: '2026-10-20', start: '11:15', end: '13:10' },
    );
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('SUMMARY:Test');
    expect(ics).toContain('TZID=Europe/Istanbul');
  });
});

describe('csv converters', () => {
  it('timetable ok + bad rows reported', () => {
    const good = 'class,weekday,p,subject,teacher,room\n9A,1,1,Matematik,,B-204\n';
    const r = timetableCsvToJson(good);
    expect(r.errors.length).toBe(0);
    expect(r.json.classes['9A']?.['1']?.length).toBe(1);
    const bad = 'class,weekday,p,subject,teacher,room\n9A,9,99,,,,\n';
    expect(timetableCsvToJson(bad).errors.length).toBeGreaterThan(0);
  });
  it('menu ok + bad rows reported', () => {
    const good = 'date,soup,main,side,veg,dessert,salad,kcal,allergens,note\n2026-10-13,Mercimek,Fırın,Pilav,Fasulye,Kek,true,850,gluten|milk,\n';
    const r = menuCsvToJson(good);
    expect(r.errors.length).toBe(0);
    const bad = 'date,soup,main,side,veg,dessert,salad,kcal,allergens,note\nnot-a-date,,,,,,maybe,,\n';
    expect(menuCsvToJson(bad).errors.length).toBeGreaterThan(0);
  });
});

describe('i18n', () => {
  it('every key exists in both languages', () => {
    const { missingInEn, missingInTr } = missingKeys();
    expect(missingInEn).toEqual([]);
    expect(missingInTr).toEqual([]);
    expect(allKeys().length).toBeGreaterThan(20);
  });
});

describe('schemas', () => {
  it('every sample file passes', () => {
    expect(validateAll()).toEqual([]);
  });
  it('broken samples fail readably', async () => {
    const Ajv = (await import('ajv')).default;
    const addFormats = (await import('ajv-formats')).default;
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    const schema = JSON.parse(readFileSync(join(__dirname, '..', 'schemas/classes.schema.json'), 'utf8'));
    const v = ajv.compile(schema);
    expect(v({ version: 1, classes: [{ id: 'bad id!', label: '', grade: 99 }] })).toBe(false);
    expect((v.errors ?? []).length).toBeGreaterThan(0);
  });
});
