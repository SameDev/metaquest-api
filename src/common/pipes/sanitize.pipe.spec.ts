import { SanitizePipe } from './sanitize.pipe';

describe('SanitizePipe', () => {
  let pipe: SanitizePipe;

  beforeEach(() => { pipe = new SanitizePipe(); });

  it('strips HTML tags from strings', () => {
    expect(pipe.transform('<script>alert(1)</script>Hello')).toBe('Hello');
  });

  it('strips img onerror XSS vector', () => {
    const result = pipe.transform('<img src=x onerror=alert(1)>') as string;
    expect(result).not.toContain('<img');
    expect(result).not.toContain('onerror');
  });

  it('strips javascript: protocol', () => {
    const result = pipe.transform('javascript:alert(1)') as string;
    expect(result).not.toContain('javascript:');
  });

  it('strips inline event handlers', () => {
    const result = pipe.transform('onclick=evil()') as string;
    expect(result).not.toMatch(/on\w+\s*=/i);
  });

  it('preserves safe plain text', () => {
    expect(pipe.transform('Minha tarefa diária')).toBe('Minha tarefa diária');
  });

  it('sanitizes nested object fields', () => {
    const input = { title: '<b>tarefa</b>', type: 'daily' };
    expect(pipe.transform(input)).toEqual({ title: 'tarefa', type: 'daily' });
  });

  it('sanitizes strings inside arrays', () => {
    const input = ['<script>x</script>', 'safe'];
    expect(pipe.transform(input)).toEqual(['', 'safe']);
  });

  it('passes numbers unchanged', () => {
    expect(pipe.transform(42)).toBe(42);
  });

  it('passes null unchanged', () => {
    expect(pipe.transform(null)).toBeNull();
  });
});
