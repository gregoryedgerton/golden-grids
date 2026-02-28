import React from 'react';
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

  test('accepts className prop', () => {
    const props: GoldenBoxProps = { className: 'my-class' };
    expect(props.className).toBe('my-class');
  });

  test('accepts style prop', () => {
    const props: GoldenBoxProps = { style: { color: 'red' } };
    expect(props.style).toEqual({ color: 'red' });
  });

  test('renders a div element', () => {
    const element = GoldenBox({}) as React.ReactElement<Record<string, unknown>>;
    expect(element.type).toBe('div');
  });

  test('passes children into the rendered div', () => {
    const element = GoldenBox({ children: 'hello' }) as React.ReactElement<Record<string, unknown>>;
    expect(element.props['children']).toBe('hello');
  });

  test('merges className onto the rendered div', () => {
    const element = GoldenBox({ className: 'my-class' }) as React.ReactElement<Record<string, unknown>>;
    expect(element.props['className']).toBe('my-class');
  });

  test('merges style overrides onto the rendered div', () => {
    const element = GoldenBox({ style: { color: 'red' } }) as React.ReactElement<Record<string, unknown>>;
    expect(element.props['style']).toMatchObject({ color: 'red' });
  });

  test('always applies 100% width and height base styles', () => {
    const element = GoldenBox({}) as React.ReactElement<Record<string, unknown>>;
    expect(element.props['style']).toMatchObject({ width: '100%', height: '100%' });
  });
});
