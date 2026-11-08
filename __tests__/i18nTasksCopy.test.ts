import { splitLinkedText } from '../src/shared/i18n/linkedText';
import { setLanguage, t } from '../src/shared/i18n/translate';
import {
  getTaskCategoryOptions,
  taskCategoryLabel,
} from '../src/features/tasks/ui/taskCategories';

describe('splitLinkedText', () => {
  it('splits around the bracketed phrase', () => {
    expect(splitLinkedText('Use [monthly goals] to repeat.')).toEqual({
      before: 'Use ',
      link: 'monthly goals',
      after: ' to repeat.',
    });
  });

  it('works when the phrase starts or ends the sentence', () => {
    expect(splitLinkedText('[月間目標]から追加できます。')).toEqual({
      before: '',
      link: '月間目標',
      after: 'から追加できます。',
    });
  });

  it('returns the whole message when there is no marker', () => {
    expect(splitLinkedText('Plain text')).toEqual({
      before: 'Plain text',
      link: '',
      after: '',
    });
    expect(splitLinkedText('Broken [marker')).toEqual({
      before: 'Broken [marker',
      link: '',
      after: '',
    });
  });
});

describe('task copy', () => {
  afterEach(() => setLanguage('en'));

  it('pluralises task counts', () => {
    expect(t('tasks.moveTitle', { count: 1 })).toBe('Move 1 task');
    expect(t('tasks.moveTitle', { count: 3 })).toBe('Move 3 tasks');
  });

  it('uses all four Russian forms', () => {
    setLanguage('ru');
    expect(t('tasks.moveTitle', { count: 1 })).toBe('Перенести 1 задачу');
    expect(t('tasks.moveTitle', { count: 3 })).toBe('Перенести 3 задачи');
    expect(t('tasks.moveTitle', { count: 5 })).toBe('Перенести 5 задач');
    expect(t('tasks.moveTitle', { count: 21 })).toBe('Перенести 21 задачу');
  });

  it('puts the goal title and task count into the remove-goal prompt', () => {
    setLanguage('de');
    expect(t('tasks.goals.removeBody', { title: 'Fit', count: 2 })).toBe(
      '„Fit“ und seine 2 Aufgaben entfernen?',
    );
  });

  it('labels every category in the active language', () => {
    expect(getTaskCategoryOptions().map(option => option.label)).toEqual([
      'Health',
      'Work',
      'Personal care',
      'Learning',
      'Other',
    ]);
    setLanguage('fr');
    expect(taskCategoryLabel('health')).toBe('Santé');
    expect(taskCategoryLabel('personal_care')).toBe('Soin de soi');
  });

  it('lets a component pass its own t so memoised labels follow the language', () => {
    setLanguage('es');
    const spanish = (key: Parameters<typeof t>[0]) => `es:${t(key)}`;
    expect(taskCategoryLabel('work', spanish as typeof t)).toBe('es:Trabajo');
  });
});
