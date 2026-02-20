import { GoldenBox } from '../components/GoldenBox';
import type { GoldenBoxProps } from '../components/GoldenBox';

describe('GoldenBox', () => {
  test('is a function (React functional component)', () => {
    expect(typeof GoldenBox).toBe('function');
  });

  test('accepts children prop', () => {
    const props: GoldenBoxProps = { children: 'hello' };
    expect(props.children).toBe('hello');
  });

  test('placeholder prop is typed as optional boolean', () => {
    const withPlaceholder: GoldenBoxProps = { placeholder: true };
    const withoutPlaceholder: GoldenBoxProps = {};
    expect(withPlaceholder.placeholder).toBe(true);
    expect(withoutPlaceholder.placeholder).toBeUndefined();
  });

  test('accepts className prop', () => {
    const props: GoldenBoxProps = { className: 'my-class' };
    expect(props.className).toBe('my-class');
  });

  test('accepts style prop', () => {
    const props: GoldenBoxProps = { style: { color: 'red' } };
    expect(props.style).toEqual({ color: 'red' });
  });
});
